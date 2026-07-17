package com.shift.shift_management.service;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class LineNotificationService {

	private static final String PUSH_URL = "https://api.line.me/v2/bot/message/push";

	private final RestTemplate restTemplate = new RestTemplate();

	@Value("${line.channel-access-token:}")
	private String channelAccessToken;

	// LINEユーザー1人にテキストメッセージを送信
	public void push(String lineUserId, String text) {
		if (channelAccessToken == null || channelAccessToken.isBlank()) {
			System.out.println("LINE_CHANNEL_ACCESS_TOKEN未設定のため通知をスキップしました");
			return;
		}
		if (lineUserId == null || lineUserId.isBlank()) {
			return;
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
		} catch (Exception e) {
			System.err.println(
					"LINE通知の送信に失敗しました: userId=" + lineUserId + " / " + e.getMessage());
		}
	}
}