package com.shift.shift_management.service;

import com.shift.shift_management.dto.ConfirmedShiftItemRequest;
import com.shift.shift_management.dto.ConfirmedShiftResponse;
import com.shift.shift_management.dto.ConfirmedShiftSubmitRequest;
import com.shift.shift_management.entity.ConfirmedShift;
import com.shift.shift_management.repository.ConfirmedShiftRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
public class ConfirmedShiftService {

	private final ConfirmedShiftRepository confirmedShiftRepository;

	@Transactional
	public void submit(ConfirmedShiftSubmitRequest request) {

		// 「一時保存」は上書き保存の仕様。毎回追加していくと、保存するたびに
		// 古いデータがDBに残り続けて重複表示されてしまうため、同じ期間の
		// 既存データを一旦削除してから保存し直す。
		confirmedShiftRepository.deleteByPeriodId(request.periodId());

		for (ConfirmedShiftItemRequest item : request.requests()) {

			ConfirmedShift confirmedShift = new ConfirmedShift();

			confirmedShift.setUserId(item.userId());
			confirmedShift.setPeriodId(request.periodId());

			confirmedShift.setWorkDate(item.workDate());
			confirmedShift.setStartTime(item.startTime());
			confirmedShift.setEndTime(item.endTime());
			confirmedShift.setRole(item.role());

			confirmedShiftRepository.save(confirmedShift);
		}
	}

	public List<ConfirmedShiftResponse> findAll() {
		List<ConfirmedShift> shifts = confirmedShiftRepository.findAll();

		return shifts.stream()
				.map(
						shift ->
								new ConfirmedShiftResponse(
										shift.getUserId(),
										null,
										shift.getWorkDate(),
										shift.getStartTime(),
										shift.getEndTime(),
										shift.getRole()))
				.toList();
	}
}