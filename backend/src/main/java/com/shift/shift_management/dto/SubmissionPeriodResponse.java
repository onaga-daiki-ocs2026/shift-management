package com.shift.shift_management.dto;

import java.time.LocalDate;

public record SubmissionPeriodResponse(
		Long id, LocalDate startDate, LocalDate endDate, LocalDate deadline, boolean status) {}
