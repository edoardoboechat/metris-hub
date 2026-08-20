package com.aetherquest.dto;

import jakarta.validation.constraints.Min;

public record DistributionDaysUpdateRequest(
        @Min(1) long distributionDays
) {
}
