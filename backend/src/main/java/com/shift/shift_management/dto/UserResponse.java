package com.shift.shift_management.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserResponse {

	private Long id;

	private String lineUserId;

	private String displayName;

	private String role;

	private String position;

	private Integer sortOrder;

	// 契約日数（週あたり）
	private Integer contractDays;

	// 契約時間（週あたり）
	private Double contractHours;
}