package com.shift.shift_management.dto;

import java.util.List;

public record ConfirmedShiftSubmitRequest(
    Long periodId,
    List<ConfirmedShiftItemRequest> requests
) {
}
