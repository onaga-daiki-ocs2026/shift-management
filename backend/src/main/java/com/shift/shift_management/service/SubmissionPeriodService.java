package com.shift.shift_management.service;

import java.time.LocalDate;

import org.springframework.stereotype.Service;

import com.shift.shift_management.dto.SubmissionPeriodResponse;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class SubmissionPeriodService {

    public SubmissionPeriodResponse getCurrentPeriod() {
        return new SubmissionPeriodResponse(
            1L,
            LocalDate.of(2026, 6, 1),
            LocalDate.of(2026, 6, 14),
            LocalDate.of(2026, 5, 25),
            true
        );
    }
}
