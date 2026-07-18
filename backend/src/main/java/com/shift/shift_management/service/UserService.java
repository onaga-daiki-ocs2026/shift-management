package com.shift.shift_management.service;

import com.shift.shift_management.dto.UserRequest;
import com.shift.shift_management.dto.UserResponse;
import com.shift.shift_management.dto.UserUpdateRequest;
import com.shift.shift_management.entity.User;
import com.shift.shift_management.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

	private final UserRepository userRepository;

	public UserResponse loginOrRegister(UserRequest request) {

		// 既存ユーザーがいればそのまま返す（表示名は上書きしない）。
		// いなければLINEの表示名で新規登録する。
		User user =
				userRepository
						.findByLineUserId(request.getLineUserId())
						.orElseGet(
								() -> {
									User newUser = new User();
									newUser.setLineUserId(request.getLineUserId());
									newUser.setDisplayName(request.getDisplayName());
									newUser.setRole("STAFF");
									newUser.setPosition("HALL");
									return userRepository.save(newUser);
								});

		return toResponse(user);
	}

	public List<UserResponse> findAll() {
		return userRepository.findAllByOrderBySortOrderAsc()
				.stream()
				.map(this::toResponse)
				.toList();
	}

	public UserResponse updateUser(Long id, UserUpdateRequest request) {
		User user = userRepository
				.findById(id)
				.orElseThrow(() -> new RuntimeException("ユーザーが見つかりません"));

		if (request.displayName() != null && !request.displayName().isBlank()) {
			user.setDisplayName(request.displayName());
		}
		if (request.position() != null) {
			user.setPosition(request.position());
		}
		if (request.role() != null) {
			user.setRole(request.role());
		}
		if (request.sortOrder() != null) {
			user.setSortOrder(request.sortOrder());
		}
		if (request.contractDays() != null) {
			user.setContractDays(request.contractDays());
		}
		if (request.contractHours() != null) {
			user.setContractHours(request.contractHours());
		}

		User savedUser = userRepository.save(user);
		return toResponse(savedUser);
	}

	private UserResponse toResponse(User user) {
		UserResponse response = new UserResponse();
		response.setId(user.getId());
		response.setLineUserId(user.getLineUserId());
		response.setDisplayName(user.getDisplayName());
		response.setRole(user.getRole());
		response.setPosition(user.getPosition());
		response.setSortOrder(user.getSortOrder());
		response.setContractDays(user.getContractDays());
		response.setContractHours(user.getContractHours());
		return response;
	}
}