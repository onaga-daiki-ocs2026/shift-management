package com.shift.shift_management.service;

import com.shift.shift_management.entity.User;
import com.shift.shift_management.repository.UserRepository;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
public class LineNotificationService {

	private static final String PUSH_URL = "https://api.line.me/v2/bot/message/push";

	private final RestTemplate restTemplate;
	private final UserRepository userRepository;

	@Value("${line.channel-access-token:}")
	private String channelAccessToken;

	public LineNotificationService(RestTemplateBuilder builder, UserRepository userRepository) {
		this.restTemplate =
				builder
						.connectTimeout(Duration.ofSeconds(3))
						.readTimeout(Duration.ofSeconds(5))
						.build();
		this.userRepository = userRepository;
	}

	// 対象ユーザー全員に非同期でLINE通知を送り、完了後に失敗者をまとめて管理者へ通知する。
	// 呼び出し元（ShiftPdfService, SubmissionReminderScheduler）は別Beanなので、
	// ここを非同期の境界にすればSpringのAOPプロキシが正しく効く（自己呼び出しでの@Async無効化を回避）。
	@Async
	public void notifyBatch(List<User> targets, String message, String context) {
		List<String> failedNames = new ArrayList<>();
		for (User target : targets) {
			boolean success = push(target.getLineUserId(), message, target.getDisplayName());
			if (!success) {
				failedNames.add(target.getDisplayName());
			}
		}
		if (!failedNames.isEmpty()) {
			notifyAdminsOfFailures(context, failedNames);
		}
	}

	// LINEユーザー1人にテキストメッセージを送信。成功/失敗を返す（集計用）。
	private boolean push(String lineUserId, String text, String displayName) {
		if (channelAccessToken == null || channelAccessToken.isBlank()) {
			log.warn("LINE_CHANNEL_ACCESS_TOKEN未設定のため通知をスキップしました: user={}({})", displayName, lineUserId);
			return false;
		}
		if (lineUserId == null || lineUserId.isBlank()) {
			log.warn("lineUserIdが未設定のため通知をスキップしました: user={}", displayName);
			return false;
		}

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		headers.setBearerAuth(channelAccessToken);

		Map<String, Object> body =
				Map.of(
						"to", lineUserId,
						"messages", List.of(Map.of("type", "text", "text", text)));

		try {
			restTemplate.postForEntity(PUSH_URL, new HttpEntity<>(body, headers), String.class);
			log.debug("LINE通知を送信しました: user={}({})", displayName, lineUserId);
			return true;
		} catch (RestClientResponseException e) {
			log.error(
					"LINE通知の送信に失敗しました: user={}({}) status={} body={}",
					displayName,
					lineUserId,
					e.getStatusCode(),
					e.getResponseBodyAsString());
			return false;
		} catch (Exception e) {
			log.error("LINE通知の送信に失敗しました: user={}({})", displayName, lineUserId, e);
			return false;
		}
	}

	// 管理者への集約通知はベストエフォート。ここで失敗してもサマリー通知を再試行しない（無限ループ・例外連鎖の防止）。
	private void notifyAdminsOfFailures(String context, List<String> failedNames) {
		try {
			List<User> admins = userRepository.findByRole("ADMIN");
			if (admins.isEmpty()) {
				log.warn("ADMIN権限のユーザーがいないため、通知失敗のサマリーを送信できませんでした: context={}", context);
				return;
			}

			String summary = buildAdminSummaryMessage(context, failedNames);
			for (User admin : admins) {
				push(admin.getLineUserId(), summary, admin.getDisplayName());
			}
		} catch (Exception e) {
			log.error("管理者への通知失敗サマリー送信中にエラーが発生しました: context={}", context, e);
		}
	}

	private String buildAdminSummaryMessage(String context, List<String> failedNames) {
		String names = String.join("、", failedNames);
		return "⚠️【要確認】"
				+ context
				+ "の通知が"
				+ failedNames.size()
				+ "件、届いていない可能性があります。\n"
				+ "対象："
				+ names
				+ "さん\n"
				+ "本人のLINE連携状況をご確認ください。";
	}
}
