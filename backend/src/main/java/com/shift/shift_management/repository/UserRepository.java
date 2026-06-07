package com.shift.shift_management.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.shift.shift_management.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByLineUserId(String lineUserId);
}