package com.shift.shift_management.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.shift.shift_management.entity.ConfirmedShift;

public interface ConfirmedShiftRepository extends JpaRepository<ConfirmedShift,Long>{
    
}
