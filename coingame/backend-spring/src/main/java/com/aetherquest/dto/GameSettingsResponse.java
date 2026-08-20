package com.aetherquest.dto;

public record GameSettingsResponse(
        long inactivityTimeoutSeconds,
        long availableCoins,
        long distributionDays,
        double estimatedSuccessProbability
) {
}
