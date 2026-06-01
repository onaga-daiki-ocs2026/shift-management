package com.shift.shift_management.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shift.shift_management.dto.ShiftRequestResponse;
import com.shift.shift_management.dto.ShiftRequestSubmitRequest;
import com.shift.shift_management.service.ShiftRequestService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RequiredArgsConstructor
@RestController
@RequestMapping("/api/shift-requests")
public class ShiftRequestController {
    
    private final ShiftRequestService shiftRequestService;

    @PostMapping
    public void submitShiftRequests(@RequestBody ShiftRequestSubmitRequest request) {
        shiftRequestService.submit(request);
    }
    
    @GetMapping
    public List<ShiftRequestResponse> getShiftRequests() {
        return shiftRequestService.findAll();
    }
}