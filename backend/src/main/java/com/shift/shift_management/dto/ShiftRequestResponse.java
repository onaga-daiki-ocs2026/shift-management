package com.shift.shift_management.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record ShiftRequestResponse(
		LocalDate workDate, LocalTime startTime, LocalTime endTime, boolean available) {}
