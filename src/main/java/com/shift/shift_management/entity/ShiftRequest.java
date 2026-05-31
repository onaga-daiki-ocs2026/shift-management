package com.shift.shift_management.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.persistence.*;
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

    private LocalDate date;

    private LocalTime startTime;

    private LocalTime endTime;

    private boolean available;

    private LocalDateTime createdAt;

}
