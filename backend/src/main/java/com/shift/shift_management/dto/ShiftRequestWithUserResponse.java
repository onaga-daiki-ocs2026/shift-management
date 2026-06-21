package com.shift.shift_management.dto;

import java.time.LocalTime;

public record ShiftRequestWithUserResponse(
		Long userId,
		String displayName,
		String position,
		boolean available,
		LocalTime startTime,
		LocalTime endTime) {}