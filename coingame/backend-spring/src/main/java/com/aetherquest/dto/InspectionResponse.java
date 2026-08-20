package com.aetherquest.dto;

public record InspectionResponse(
        boolean success,
        String rewardAmount,
        long remainingPlayTimeSeconds,
        long totalPlayedSeconds,
        long totalCoinsFound,
        String coinBalance,
        long inactivityTimeoutSeconds
) {
}
