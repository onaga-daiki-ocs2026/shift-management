package com.shift.shift_management.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shift.shift_management.dto.ShiftRequestSubmitRequest;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/shift_requests")
public class ShiftRequestController {
    
    @PostMapping
    public String submitShiftRequests(@RequestBody ShiftRequestSubmitRequest request) {
        
        System.out.println(request);
        
        return "シフト希望を受け取りました";
    }
    
}