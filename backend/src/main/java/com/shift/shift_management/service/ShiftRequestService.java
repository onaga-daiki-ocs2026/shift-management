package com.shift.shift_management.service;

import com.shift.shift_management.dto.ShiftRequestItemRequest;
import com.shift.shift_management.dto.ShiftRequestResponse;
import com.shift.shift_management.dto.ShiftRequestSubmitRequest;
import com.shift.shift_management.dto.ShiftRequestWithUserResponse;
import com.shift.shift_management.entity.ShiftRequest;
import com.shift.shift_management.entity.User;
import com.shift.shift_management.repository.ShiftRequestRepository;
import com.shift.shift_management.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
public class ShiftRequestService {

	private final ShiftRequestRepository shiftRequestRepository;
	private final UserRepository userRepository;

	// 14件バラバラに保存・コミットしていたのを、1回のトランザクションにまとめる。
	// これにより「1件保存する度にDBへ確定処理を送る」回数が14回→1回に減り、
	// 同時アクセスが多い時のDB接続の詰まり・待ち時間が大きく改善する。
	// （途中で1件でも失敗した場合は、14件すべてが保存されずロールバックされる）
	@Transactional
	public void submit(ShiftRequestSubmitRequest request) {
		for (ShiftRequestItemRequest item : request.requests()) {

			ShiftRequest shiftRequest = shiftRequestRepository
				.findByUserIdAndWorkDate(request.userId(), item.workDate())
				.orElseGet(ShiftRequest::new);

			shiftRequest.setUserId(request.userId());
			shiftRequest.setPeriodId(request.periodId());
			shiftRequest.setWorkDate(item.workDate());
			shiftRequest.setStartTime(item.startTime());
			shiftRequest.setEndTime(item.endTime());
			shiftRequest.setAvailable(item.available());
			shiftRequest.setCreatedAt(LocalDateTime.now());
			shiftRequest.setComment(item.comment());

			shiftRequestRepository.save(shiftRequest);
		}
	}

	public List<ShiftRequestResponse> findAll() {

		List<ShiftRequest> shifts = shiftRequestRepository.findAll();

		return shifts.stream()
				.map(
						shift ->
								new ShiftRequestResponse(
										shift.getWorkDate(),
										shift.getStartTime(),
										shift.getEndTime(),
										shift.isAvailable()))
				.toList();
	}

	public List<ShiftRequestResponse> findByUserId(Long userId) {
		List<ShiftRequest> shifts = shiftRequestRepository.findByUserId(userId);
		return shifts.stream()
				.map(shift -> new ShiftRequestResponse(
						shift.getWorkDate(),
						shift.getStartTime(),
						shift.getEndTime(),
						shift.isAvailable()))
				.toList();
	}

	// 特定の日付の全員分（ユーザー情報付き）を取得
	public List<ShiftRequestWithUserResponse> findByWorkDate(LocalDate workDate) {
		List<ShiftRequest> shifts = shiftRequestRepository.findByWorkDate(workDate);

		return shifts.stream()
				.filter(ShiftRequest::isAvailable)
				.map(shift -> {
					User user = userRepository.findById(shift.getUserId())
							.orElseThrow(() -> new RuntimeException("ユーザーが見つかりません"));

					return new ShiftRequestWithUserResponse(
							user.getId(),
							user.getDisplayName(),
							user.getPosition(),
							shift.isAvailable(),
							shift.getStartTime(),
							shift.getEndTime(),
							shift.getComment());
				})
				.toList();
	}
}