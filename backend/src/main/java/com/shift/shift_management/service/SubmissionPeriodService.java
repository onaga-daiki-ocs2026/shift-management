package com.shift.shift_management.service;

import com.shift.shift_management.dto.SubmissionPeriodResponse;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class SubmissionPeriodService {

	private static final LocalDate BASE_DEADLINE = LocalDate.of(2026, 6, 20);

	// サーバー（Render等）がUTCで動いていても、日本時間基準で「今日」を判定する
	private static final ZoneId JST = ZoneId.of("Asia/Tokyo");

	public SubmissionPeriodResponse getCurrentPeriod() {
		LocalDate today = LocalDate.now(JST);

		// 基準締切日から何日経過したか
		long daysPassed = ChronoUnit.DAYS.between(BASE_DEADLINE, today);

		// 14日ごとに何サイクル経過したか（マイナスにならないよう調整）
		long cycle = Math.floorDiv(daysPassed, 14);

		// 現在提出中の期間を決めている「基準となる締切日」
		// （提出必須期間の開始日・終了日はこの日を基準に計算する。
		//   ここは今まで通りで、変更していない）
		LocalDate currentDeadline = BASE_DEADLINE.plusDays(cycle * 14);

		// 画面に表示する締切日：
		// currentDeadline は「今日か、今日より前」の日付にしかならない
		// （もう過ぎている場合がほとんど）ため、そのまま見せると
		// スタッフには「もう終わった締切」しか見えず、次の締切がいつかが
		// 分からないまま当日になって初めて表示される、という状態になっていた。
		// すでに過ぎている場合は、次の締切日（14日後）を表示することで、
		// 事前に余裕を持って告知できるようにする。
		LocalDate displayDeadline =
				currentDeadline.isBefore(today) ? currentDeadline.plusDays(14) : currentDeadline;

		// 必須ブロックの開始日（締切日の15日後）と終了日（28日後＝14日間）
		LocalDate startDate = currentDeadline.plusDays(15);
		LocalDate endDate = currentDeadline.plusDays(28);

		return new SubmissionPeriodResponse(1L, startDate, endDate, displayDeadline, true);
	}
}