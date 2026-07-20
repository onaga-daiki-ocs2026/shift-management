package com.shift.shift_management.repository;

import com.shift.shift_management.entity.ConfirmedShift;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConfirmedShiftRepository extends JpaRepository<ConfirmedShift, Long> {

	List<ConfirmedShift> findByPeriodId(long periodId);

	void deleteByPeriodId(long periodId);
}