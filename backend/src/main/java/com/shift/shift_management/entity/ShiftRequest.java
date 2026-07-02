package com.shift.shift_management.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "shiftRequest")
@Getter
@Setter
public class ShiftRequest {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private Long userId;

	private Long periodId;

	private LocalDate workDate;

	private LocalTime startTime;

	private LocalTime endTime;

	private boolean available;

	private LocalDateTime createdAt;

	private String comment;
}
