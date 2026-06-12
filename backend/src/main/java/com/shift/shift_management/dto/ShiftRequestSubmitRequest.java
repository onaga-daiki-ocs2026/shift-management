package com.shift.shift_management.dto;

import java.util.List;

public record ShiftRequestSubmitRequest(
    Long userId,
    Long periodId,
    List<ShiftRequestItemRequest> requests
) {
} 
