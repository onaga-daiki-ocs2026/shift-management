package com.shift.shift_management.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record ConfirmedShiftItemRequest(
    Long userId,
    LocalDate date,
    LocalTime startTime,
    LocalTime endTime
) {
}
