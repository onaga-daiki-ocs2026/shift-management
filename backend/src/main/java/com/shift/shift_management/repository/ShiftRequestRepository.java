package com.shift.shift_management.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.shift.shift_management.entity.ShiftRequest;

public interface ShiftRequestRepository extends JpaRepository<ShiftRequest,Long>{

}
