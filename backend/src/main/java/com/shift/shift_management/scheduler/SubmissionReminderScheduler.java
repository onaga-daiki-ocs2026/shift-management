package com.shift.shift_management.scheduler;

import com.shift.shift_management.dto.SubmissionPeriodResponse;
import com.shift.shift_management.entity.User;
import com.shift.shift_management.repository.ShiftRequestRepository;
import com.shift.shift_management.repository.UserRepository;
import com.shift.shift_management.service.LineNotificationService;
import com.shift.shift_management.service.SubmissionPeriodService;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Component
public class SubmissionReminderScheduler {

	// サーバーがUTC等で動いていても、日本時間基準で判定する
	private static final ZoneId JST = ZoneId.of("Asia/Tokyo");

	private final SubmissionPeriodService submissionPeriodService;
	private final UserRepository userRepository;
	private final ShiftRequestRepository shiftRequestRepository;
	private final LineNotificationService lineNotificationService;

	// 毎日 9:00 に実行し、締切が「明日」の場合のみ未提出者へリマインド
	@Scheduled(cron = "0 0 9 * * *")
	public void sendDeadlineReminder() {
		SubmissionPeriodResponse period = submissionPeriodService.getCurrentPeriod();

		LocalDate today = LocalDate.now(JST);
		long daysUntilDeadline = ChronoUnit.DAYS.between(today, period.deadline());

		// 締切の前日だけ送る（毎日送られると鬱陶しいため）
		if (daysUntilDeadline != 1) {
			return;
		}

		String message =
				"🚨【締切間近】シフト希望、まだ出してませんよ！\n"
						+ "締切：" + period.deadline() + "（明日まで！）\n"
						+ "このままだと希望が反映されないまま確定してしまいます。\n"
						+ "今すぐアプリから提出してください！";

		// STAFF/ADMIN問わず、未提出の人全員にリマインドする
		userRepository.findAll().stream()
				.filter(user -> !hasSubmitted(user, period))
				.forEach(user -> lineNotificationService.push(user.getLineUserId(), message));
	}

	// 必須ブロック（期間の初日）に提出済みかどうかで判定
	private boolean hasSubmitted(User user, SubmissionPeriodResponse period) {
		return shiftRequestRepository
				.findByUserIdAndWorkDate(user.getId(), period.startDate())
				.isPresent();
	}
}