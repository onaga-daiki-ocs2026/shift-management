package com.shift.shift_management.controller;

import com.shift.shift_management.dto.UserRequest;
import com.shift.shift_management.dto.UserResponse;
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
	public List<UserResponse> getAllUsers() {
		return userService.findAll();
	}

	@PutMapping("/{id}")
	public UserResponse updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest request) {
		return userService.updateUser(id, request);
	}

	@PutMapping("/sort-order")
	public ResponseEntity<Void> updateSortOrder(
			@RequestBody List<Long> userIds) {
		for (int i = 0; i < userIds.size(); i++) {
			UserUpdateRequest req = new UserUpdateRequest(null, null, null, i);
			userService.updateUser(userIds.get(i), req);
		}
		return ResponseEntity.ok().build();
	}
}