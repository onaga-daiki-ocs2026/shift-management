package com.shift.shift_management.controller;

import com.shift.shift_management.dto.UserRequest;
import com.shift.shift_management.dto.UserResponse;
import com.shift.shift_management.dto.UserRoleUpdateRequest;
import com.shift.shift_management.dto.UserSummaryResponse;
import com.shift.shift_management.dto.UserUpdateRequest;
import com.shift.shift_management.service.UserService;
import java.util.List;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

	private final UserService userService;

	@PostMapping("/login")
	public UserResponse login(@RequestBody UserRequest request) {
		return userService.loginOrRegister(request);
	}

	@GetMapping
	public List<UserSummaryResponse> getAllUsers(
			@RequestHeader(value = "X-Line-User-Id", required = false) String callerLineUserId) {
		return userService.findAll(callerLineUserId);
	}

	@PutMapping("/{id}")
	public UserResponse updateUser(
			@PathVariable Long id,
			@RequestBody UserUpdateRequest request,
			@RequestHeader(value = "X-Line-User-Id", required = false) String callerLineUserId) {
		return userService.updateUser(id, request, callerLineUserId);
	}

	@PutMapping("/{id}/role")
	public UserResponse updateRole(
			@PathVariable Long id,
			@RequestBody UserRoleUpdateRequest request,
			@RequestHeader(value = "X-Line-User-Id", required = false) String callerLineUserId) {
		return userService.updateRole(id, request, callerLineUserId);
	}

	@PutMapping("/sort-order")
	public ResponseEntity<Void> updateSortOrder(
			@RequestBody List<Long> userIds,
			@RequestHeader(value = "X-Line-User-Id", required = false) String callerLineUserId) {
		userService.requireAdmin(callerLineUserId);
		for (int i = 0; i < userIds.size(); i++) {
			UserUpdateRequest req = new UserUpdateRequest(null, null, i, null, null);
			userService.updateUser(userIds.get(i), req, callerLineUserId);
		}
		return ResponseEntity.ok().build();
	}
}