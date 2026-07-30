package com.shift.shift_management.dto;

public record UserUpdateRequest(
		String displayName,
		String position,
		Integer sortOrder,
		Integer contractDays,
		Double contractHours) {}