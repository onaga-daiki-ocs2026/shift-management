package com.shift.shift_management.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.persistence.*;
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

    private boolean published;

    private LocalDateTime createdAt;

    private LocalDateTime updateAt;

}
