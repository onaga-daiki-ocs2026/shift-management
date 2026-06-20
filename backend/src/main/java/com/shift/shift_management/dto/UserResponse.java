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
}
