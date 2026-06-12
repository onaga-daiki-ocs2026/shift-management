package com.shift.shift_management.controller;

import com.shift.shift_management.dto.ConfirmedShiftResponse;
import com.shift.shift_management.dto.ConfirmedShiftSubmitRequest;
import com.shift.shift_management.service.ConfirmedShiftService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/confirmed-shifts")
public class ConfirmedShiftController {

	private final ConfirmedShiftService confirmedShiftService;

	@PostMapping
	public void submitConfirmedRequests(@RequestBody ConfirmedShiftSubmitRequest request) {
		confirmedShiftService.submit(request);
	}

	@GetMapping
	public List<ConfirmedShiftResponse> getConfirmedShifts() {
		return confirmedShiftService.findAll();
	}
}
