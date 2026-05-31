package com.shift.shift_management.dto;

import java.time.LocalDate;

public record SubmissionPeriodResponse(
    Long id,
    LocalDate starDate,
    LocalDate endDate,
    LocalDate deadline,
    boolean status
) {
}
