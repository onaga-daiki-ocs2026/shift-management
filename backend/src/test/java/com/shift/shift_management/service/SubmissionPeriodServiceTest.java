package com.shift.shift_management.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.shift.shift_management.dto.SubmissionPeriodResponse;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class SubmissionPeriodServiceTest {

	private final SubmissionPeriodService service = new SubmissionPeriodService();

	@Test
	void today_isExactlyTheDeadline_periodStartsTheDayAfterTomorrowPlus14() {
		// 締切日当日（2026-08-01）。currentDeadlineは今日と同日になるケース。
		SubmissionPeriodResponse period = service.getCurrentPeriod(LocalDate.of(2026, 8, 1));

		assertThat(period.deadline()).isEqualTo(LocalDate.of(2026, 8, 1));
		assertThat(period.startDate()).isEqualTo(LocalDate.of(2026, 8, 16));
		assertThat(period.endDate()).isEqualTo(LocalDate.of(2026, 8, 29));
	}

	@Test
	void today_isDayAfterDeadline_cycleJustRolledOver_stillUsesThatDeadline() {
		// 締切日の翌日（2026-08-02）。以前のバグではここで1サイクル先送りされていた。
		SubmissionPeriodResponse period = service.getCurrentPeriod(LocalDate.of(2026, 8, 2));

		assertThat(period.deadline()).isEqualTo(LocalDate.of(2026, 8, 1));
		assertThat(period.startDate()).isEqualTo(LocalDate.of(2026, 8, 16));
		assertThat(period.endDate()).isEqualTo(LocalDate.of(2026, 8, 29));
	}

	@Test
	void today_isCurrentRealDate_matchesExpectedPeriod() {
		// 今回の不具合報告時点の実データ（今日=2026-08-02）
		SubmissionPeriodResponse period = service.getCurrentPeriod(LocalDate.of(2026, 8, 2));

		assertThat(period.deadline()).isEqualTo(LocalDate.of(2026, 8, 1));
		assertThat(period.startDate()).isEqualTo(LocalDate.of(2026, 8, 16));
		assertThat(period.endDate()).isEqualTo(LocalDate.of(2026, 8, 29));
	}
}
