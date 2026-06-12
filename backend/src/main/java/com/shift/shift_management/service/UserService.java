package com.shift.shift_management.service;

import com.shift.shift_management.dto.UserRequest;
import com.shift.shift_management.dto.UserResponse;
import com.shift.shift_management.entity.User;
import com.shift.shift_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

	private final UserRepository userRepository;

	public UserResponse loginOrRegister(UserRequest request) {

		User user =
				userRepository
						.findByLineUserId(request.getLineUserId())
						.orElseGet(
								() -> {
									User newUser = new User();
									newUser.setLineUserId(request.getLineUserId());
									newUser.setDisplayName(request.getDisplayName());
									newUser.setRole("STAFF");
									return userRepository.save(newUser);
								});

		user.setDisplayName(request.getDisplayName());
		User savedUser = userRepository.save(user);

		return toResponse(savedUser);
	}

	private UserResponse toResponse(User user) {
		UserResponse response = new UserResponse();
		response.setId(user.getId());
		response.setLineUserId(user.getLineUserId());
		response.setDisplayName(user.getDisplayName());
		response.setRole(user.getRole());
		return response;
	}
}
