package com.shift.shift_management.controller;

import com.shift.shift_management.dto.ShiftRequestResponse;
import com.shift.shift_management.dto.ShiftRequestSubmitRequest;
import com.shift.shift_management.dto.ShiftRequestWithUserResponse;
import com.shift.shift_management.entity.User;
import com.shift.shift_management.service.ShiftRequestService;
import com.shift.shift_management.service.UserService;

import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/shift-requests")
public class ShiftRequestController {

	private final ShiftRequestService shiftRequestService;
	private final UserService userService;

	@PostMapping
	public void submitShiftRequests(@RequestBody ShiftRequestSubmitRequest request) {
		shiftRequestService.submit(request);
	}

	@GetMapping
	public List<ShiftRequestResponse> getShiftRequests(
			@RequestHeader(value = "X-Line-User-Id", required = false) String callerLineUserId) {
		User caller = userService.resolveCaller(callerLineUserId);
		return shiftRequestService.findAll(caller);
	}

	@GetMapping("/user/{userId}")
	public List<ShiftRequestResponse> getShiftRequestsByUser(
			@PathVariable Long userId,
			@RequestHeader(value = "X-Line-User-Id", required = false) String callerLineUserId) {
		User caller = userService.resolveCaller(callerLineUserId);
		if (!"ADMIN".equals(caller.getRole()) && !caller.getId().equals(userId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "他ユーザーの希望シフトは閲覧できません");
		}
		return shiftRequestService.findByUserId(userId);
	}

	// 追加：特定の日付の全員分を取得（STAFFは自分自身の分のみ）
	@GetMapping("/date/{date}")
	public List<ShiftRequestWithUserResponse> getShiftRequestsByDate(
			@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
			@RequestHeader(value = "X-Line-User-Id", required = false) String callerLineUserId) {
		User caller = userService.resolveCaller(callerLineUserId);
		return shiftRequestService.findByWorkDate(date, caller);
	}
}
