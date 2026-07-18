package com.shift.shift_management.repository;

import com.shift.shift_management.entity.ShiftPdf;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShiftPdfRepository extends JpaRepository<ShiftPdf, Long> {
	Optional<ShiftPdf> findByPeriodStart(LocalDate periodStart);

	// 新しい期間（periodStart）の順に、直近5件だけ取得する
	// （それより古いものはDBには残るが、スタッフ向け一覧には出さない）
	List<ShiftPdf> findTop5ByOrderByPeriodStartDesc();
}