package com.shift.shift_management.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.shift.shift_management.entity.User;
import com.shift.shift_management.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

	@Mock private UserRepository userRepository;

	private UserService userService() {
		return new UserService(userRepository);
	}

	@Test
	void requireAdmin_nullCallerId_rejectedWithoutTouchingRepository() {
		// X-Line-User-Idヘッダー自体が無いリクエストを想定（@RequestHeaderのrequired=falseはnullを渡す）
		assertThatThrownBy(() -> userService().requireAdmin(null))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(e -> ((ResponseStatusException) e).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);

		verifyNoInteractions(userRepository);
	}

	@Test
	void requireAdmin_emptyCallerId_rejected() {
		assertThatThrownBy(() -> userService().requireAdmin(""))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(e -> ((ResponseStatusException) e).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);

		verifyNoInteractions(userRepository);
	}

	@Test
	void requireAdmin_blankCallerId_rejected() {
		assertThatThrownBy(() -> userService().requireAdmin("   "))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(e -> ((ResponseStatusException) e).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);

		verifyNoInteractions(userRepository);
	}

	@Test
	void requireAdmin_unknownCallerId_rejected() {
		when(userRepository.findByLineUserId("U_unknown")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> userService().requireAdmin("U_unknown"))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(e -> ((ResponseStatusException) e).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void requireAdmin_staffCaller_rejected() {
		User staff = new User();
		staff.setLineUserId("U_staff");
		staff.setRole("STAFF");
		when(userRepository.findByLineUserId("U_staff")).thenReturn(Optional.of(staff));

		assertThatThrownBy(() -> userService().requireAdmin("U_staff"))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(e -> ((ResponseStatusException) e).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void requireAdmin_adminCaller_passesWithoutThrowing() {
		User admin = new User();
		admin.setLineUserId("U_admin");
		admin.setRole("ADMIN");
		when(userRepository.findByLineUserId("U_admin")).thenReturn(Optional.of(admin));

		assertThatCode(() -> userService().requireAdmin("U_admin")).doesNotThrowAnyException();
	}

	@Test
	void resolveCaller_nullCallerId_rejectedWithUnauthorized() {
		assertThatThrownBy(() -> userService().resolveCaller(null))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(e -> ((ResponseStatusException) e).getStatusCode())
				.isEqualTo(HttpStatus.UNAUTHORIZED);

		verifyNoInteractions(userRepository);
	}

	@Test
	void resolveCaller_unknownCallerId_rejectedWithUnauthorized() {
		when(userRepository.findByLineUserId("U_unknown")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> userService().resolveCaller("U_unknown"))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(e -> ((ResponseStatusException) e).getStatusCode())
				.isEqualTo(HttpStatus.UNAUTHORIZED);
	}

	@Test
	void resolveCaller_staffCaller_returnsUserWithoutRoleCheck() {
		User staff = new User();
		staff.setLineUserId("U_staff");
		staff.setRole("STAFF");
		when(userRepository.findByLineUserId("U_staff")).thenReturn(Optional.of(staff));

		assertThat(userService().resolveCaller("U_staff")).isSameAs(staff);
	}
}
