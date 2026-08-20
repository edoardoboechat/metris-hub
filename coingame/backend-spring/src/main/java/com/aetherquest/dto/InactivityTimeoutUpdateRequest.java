package com.aetherquest.dto;

import jakarta.validation.constraints.Min;

public record InactivityTimeoutUpdateRequest(
        @Min(5) long inactivityTimeoutSeconds
) {
}
