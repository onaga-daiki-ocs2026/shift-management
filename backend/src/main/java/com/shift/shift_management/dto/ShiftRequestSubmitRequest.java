package com.shift.shift_management.dto;

import java.util.List;

public record ShiftRequestSubmitRequest(
    private Long userId,
    Long periodId,
    List<ShiftRequestItemRequest> requests
) {
} 
