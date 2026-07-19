package com.shift.shift_management.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "shift_pdfs")
@Getter
@Setter
public class ShiftPdf {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	// 対象期間の開始日（2週間の識別キー）
	@Column(nullable = false, unique = true)
	private LocalDate periodStart;

	// CloudinaryのURL
	@Column(nullable = false)
	private String pdfUrl;

	// Cloudinaryのpublic_id（上書き削除用）
	private String cloudinaryPublicId;

	private LocalDateTime createdAt;

	@PrePersist
	public void onCreate() {
		createdAt = LocalDateTime.now(ZoneId.of("Asia/Tokyo"));
	}
}