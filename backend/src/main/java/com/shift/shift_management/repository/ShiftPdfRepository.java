package com.shift.shift_management.repository;

import com.shift.shift_management.entity.ShiftPdf;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShiftPdfRepository extends JpaRepository<ShiftPdf, Long> {
    Optional<ShiftPdf> findByPeriodStart(LocalDate periodStart);
}