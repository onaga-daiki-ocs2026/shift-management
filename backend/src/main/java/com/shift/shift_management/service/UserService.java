package com.shift.shift_management.service;

import com.shift.shift_management.dto.UserRequest;
import com.shift.shift_management.dto.UserResponse;
import com.shift.shift_management.dto.UserRoleUpdateRequest;
import com.shift.shift_management.dto.UserUpdateRequest;
import com.shift.shift_management.entity.User;
import com.shift.shift_management.repository.UserRepository;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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

	public UserResponse updateUser(Long id, UserUpdateRequest request, String callerLineUserId) {
		requireAdmin(callerLineUserId);

		User user = userRepository
				.findById(id)
				.orElseThrow(() -> new RuntimeException("ユーザーが見つかりません"));

		if (request.displayName() != null && !request.displayName().isBlank()) {
			user.setDisplayName(request.displayName());
		}
		if (request.position() != null) {
			user.setPosition(request.position());
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

	private static final Set<String> VALID_ROLES = Set.of("STAFF", "ADMIN");

	// role変更は昇格に直結するため、一般更新（updateUser）とは別経路にして必ずADMIN経由で通す。
	public UserResponse updateRole(Long id, UserRoleUpdateRequest request, String callerLineUserId) {
		requireAdmin(callerLineUserId);

		if (request.role() == null || !VALID_ROLES.contains(request.role())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roleはSTAFFまたはADMINである必要があります");
		}

		User user = userRepository
				.findById(id)
				.orElseThrow(() -> new RuntimeException("ユーザーが見つかりません"));

		user.setRole(request.role());
		User savedUser = userRepository.save(user);
		return toResponse(savedUser);
	}

	// 検証成功時は呼び出し元のUserを返す（表示名など、呼び出し元側で追加情報が必要な場合に再取得を省ける）
	public User requireAdmin(String callerLineUserId) {
		if (callerLineUserId == null || callerLineUserId.isBlank()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "呼び出し元を特定できません");
		}

		User caller = userRepository
				.findByLineUserId(callerLineUserId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "呼び出し元を特定できません"));

		if (!"ADMIN".equals(caller.getRole())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "管理者権限が必要です");
		}

		return caller;
	}

	// ADMIN権限までは要求せず、呼び出し元が誰であるかだけを特定する。
	// ヘッダーが無い/DBに存在しない場合は401（「あなたが誰か分からない」）で拒否する。
	public User resolveCaller(String callerLineUserId) {
		if (callerLineUserId == null || callerLineUserId.isBlank()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "認証情報がありません");
		}

		return userRepository
				.findByLineUserId(callerLineUserId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "認証情報がありません"));
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