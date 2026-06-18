package com.shift.shift_management.repository;

import com.shift.shift_management.entity.ShiftRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShiftRequestRepository extends JpaRepository<ShiftRequest, Long> {
    List<ShiftRequest> findByUserId(Long userId);
}
