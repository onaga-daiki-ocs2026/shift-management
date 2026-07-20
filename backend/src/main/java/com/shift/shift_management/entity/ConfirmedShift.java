package com.shift.shift_management.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "confirmedShift")
@Getter
@Setter
public class ConfirmedShift {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private Long userId;

	private long periodId;

	private LocalDate workDate;

	private LocalTime startTime;

	private LocalTime endTime;

	/* 指導・仕込・研修などの役割メモ（空欄可） */
	private String role;

	private boolean published;

	private LocalDateTime createdAt;

	private LocalDateTime updateAt;
}