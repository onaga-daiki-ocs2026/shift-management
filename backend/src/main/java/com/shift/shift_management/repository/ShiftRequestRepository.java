package com.shift.shift_management.repository;

import com.shift.shift_management.entity.ShiftRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;
import java.util.List;

public interface ShiftRequestRepository extends JpaRepository<ShiftRequest, Long> {
    List<ShiftRequest> findByUserId(Long userId);

    // 追加：同じユーザー・同じ日付のレコードを1件探す
    Optional<ShiftRequest> findByUserIdAndWorkDate(Long userId, LocalDate workDate);
}
