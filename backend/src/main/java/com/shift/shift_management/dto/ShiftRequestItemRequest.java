package com.shift.shift_management.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record ShiftRequestItemRequest(
		LocalDate workDate, LocalTime startTime, LocalTime endTime, boolean available, String comment) {}
