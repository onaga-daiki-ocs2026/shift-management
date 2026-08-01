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
		return getCurrentPeriod(LocalDate.now(JST));
	}

	// today切り出し版：境界日（締切当日・翌日など）をテストで固定して検証できるようにするため分離
	SubmissionPeriodResponse getCurrentPeriod(LocalDate today) {
		// 基準締切日から何日経過したか
		long daysPassed = ChronoUnit.DAYS.between(BASE_DEADLINE, today);

		// 14日ごとに何サイクル経過したか（マイナスにならないよう調整）
		long cycle = Math.floorDiv(daysPassed, 14);

		// 現在提出中の期間を決めている「基準となる締切日」
		// （提出必須期間の開始日・終了日はこの日を基準に計算する。
		//   ここは今まで通りで、変更していない）
		LocalDate currentDeadline = BASE_DEADLINE.plusDays(cycle * 14);

		// 必須ブロックの開始日（締切日の15日後）と終了日（28日後＝14日間）。
		// currentDeadline は floorDiv により「今日以前の直近の締切日」として
		// 一意に定まるため、これをそのまま表示・計算の基準にすればよい。
		// （以前は「今日より前なら+14日進める」ガードがあったが、cycle計算の
		//   性質上そのガードは締切当日を除き常に発火してしまい、対象期間が
		//   常に1サイクル先送りされるバグの原因だった。削除して修正。）
		LocalDate startDate = currentDeadline.plusDays(15);
		LocalDate endDate = currentDeadline.plusDays(28);

		return new SubmissionPeriodResponse(1L, startDate, endDate, currentDeadline, true);
	}
}