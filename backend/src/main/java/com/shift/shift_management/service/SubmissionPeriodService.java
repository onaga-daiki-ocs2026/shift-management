package com.shift.shift_management.service;

import com.shift.shift_management.dto.SubmissionPeriodResponse;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class SubmissionPeriodService {

	private static final LocalDate BASE_DEADLINE = LocalDate.of(2026, 6, 20);

	public SubmissionPeriodResponse getCurrentPeriod() {
		LocalDate today = LocalDate.now();

		// 基準締切日から何日経過したか
		long daysPassed = ChronoUnit.DAYS.between(BASE_DEADLINE, today);

		// 14日ごとに何サイクル経過したか（マイナスにならないよう調整）
		long cycle = Math.floorDiv(daysPassed, 14);

		// 現在の締切日
		LocalDate currentDeadline = BASE_DEADLINE.plusDays(cycle * 14);

		// 必須ブロックの開始日（締切日の15日後）と終了日（28日後＝14日間）
		LocalDate startDate = currentDeadline.plusDays(15);
		LocalDate endDate = currentDeadline.plusDays(28);

		return new SubmissionPeriodResponse(1L, startDate, endDate, currentDeadline, true);
	}
}
