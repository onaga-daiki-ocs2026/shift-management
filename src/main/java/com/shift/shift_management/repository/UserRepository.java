package com.shift.shift_management.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.shift.shift_management.entity.User;

public interface UserRepository extends JpaRepository<User,Long>{
    
}
