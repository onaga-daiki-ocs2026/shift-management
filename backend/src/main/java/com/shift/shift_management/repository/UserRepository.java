package com.shift.shift_management.repository;

import com.shift.shift_management.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByLineUserId(String lineUserId);
}
