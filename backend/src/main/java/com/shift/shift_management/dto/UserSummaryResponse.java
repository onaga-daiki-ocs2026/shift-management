package com.shift.shift_management.dto;

// ユーザー一覧表示用。lineUserIdは本人確認に使う機密性の高い値であり、
// 一覧画面（AdminUserManagement/AdminConfirmedShiftCreate）では使用しないため含めない。
public record UserSummaryResponse(
		Long id,
		String displayName,
		String role,
		String position,
		Integer sortOrder,
		Integer contractDays,
		Double contractHours) {}
