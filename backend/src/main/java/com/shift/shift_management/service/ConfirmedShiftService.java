package com.shift.shift_management.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.shift.shift_management.dto.ConfirmedShiftItemRequest;
import com.shift.shift_management.dto.ConfirmedShiftResponse;
import com.shift.shift_management.dto.ConfirmedShiftSubmitRequest;
import com.shift.shift_management.entity.ConfirmedShift;
import com.shift.shift_management.repository.ConfirmedShiftRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class ConfirmedShiftService {

    private final ConfirmedShiftRepository confirmedShiftRepository;

    public void submit(ConfirmedShiftSubmitRequest request) {
        
        for (ConfirmedShiftItemRequest item : request.requests()) {

            ConfirmedShift confirmedShift = new ConfirmedShift();

            confirmedShift.setUserId(item.userId());
            confirmedShift.setPeriodId(request.periodId());

            confirmedShift.setWorkDate(item.workDate());
            confirmedShift.setStartTime(item.startTime());
            confirmedShift.setEndTime(item.endTime());

            confirmedShiftRepository.save(confirmedShift);
        }
    }

    public List<ConfirmedShiftResponse> findAll() {
        List<ConfirmedShift> shifts =
            confirmedShiftRepository.findAll();

        return shifts.stream().map(shift -> new ConfirmedShiftResponse(
            shift.getUserId(),
            null,
            shift.getWorkDate(),
            shift.getStartTime(),
            shift.getEndTime()
        )).toList();

    }
}
