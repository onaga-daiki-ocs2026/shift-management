package com.shift.shift_management.controller;

import com.shift.shift_management.dto.ShiftRequestResponse;
import com.shift.shift_management.dto.ShiftRequestSubmitRequest;
import com.shift.shift_management.dto.ShiftRequestWithUserResponse;
import com.shift.shift_management.service.ShiftRequestService;

import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/shift-requests")
public class ShiftRequestController {

	private final ShiftRequestService shiftRequestService;

	@PostMapping
	public void submitShiftRequests(@RequestBody ShiftRequestSubmitRequest request) {
		shiftRequestService.submit(request);
	}

	@GetMapping
	public List<ShiftRequestResponse> getShiftRequests() {
		return shiftRequestService.findAll();
	}

	@GetMapping("/user/{userId}")
	public List<ShiftRequestResponse> getShiftRequestsByUser(@PathVariable Long userId) {
		return shiftRequestService.findByUserId(userId);
	}

	// 追加：特定の日付の全員分を取得
	@GetMapping("/date/{date}")
	public List<ShiftRequestWithUserResponse> getShiftRequestsByDate(
			@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
		return shiftRequestService.findByWorkDate(date);
	}
}
