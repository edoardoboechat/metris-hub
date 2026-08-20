package com.aetherquest.dto;

import jakarta.validation.constraints.Min;

public record GameSettingsUpdateRequest(
        @Min(5) long inactivityTimeoutSeconds,
        @Min(1) long distributionDays
) {
}
