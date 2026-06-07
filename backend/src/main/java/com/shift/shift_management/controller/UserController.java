package com.shift.shift_management.controller;

import org.springframework.web.bind.annotation.*;

import com.shift.shift_management.dto.UserRequest;
import com.shift.shift_management.dto.UserResponse;
import com.shift.shift_management.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/login")
    public UserResponse login(@RequestBody UserRequest request) {
        return userService.loginOrRegister(request);
    }
}