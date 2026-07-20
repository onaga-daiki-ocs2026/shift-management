package com.shift.shift_management.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record ConfirmedShiftResponse(
		Long userId, String name, LocalDate workDate, LocalTime startTime, LocalTime endTime, String role) {}