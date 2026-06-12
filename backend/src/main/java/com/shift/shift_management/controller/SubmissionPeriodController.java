package com.shift.shift_management.controller;

import com.shift.shift_management.dto.SubmissionPeriodResponse;
import com.shift.shift_management.service.SubmissionPeriodService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/submission-periods")
public class SubmissionPeriodController {

	private final SubmissionPeriodService submissionPeriodService;

	@GetMapping("/current")
	public SubmissionPeriodResponse getCurrentPeriod() {
		return submissionPeriodService.getCurrentPeriod();
	}
}
