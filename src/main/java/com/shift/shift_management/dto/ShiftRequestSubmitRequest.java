package com.shift.shift_management.dto;

import java.util.List;

public record ShiftRequestSubmitRequest(
    Long periodId,
    List<ShiftRequestItemRequest> requests
) {
} 
