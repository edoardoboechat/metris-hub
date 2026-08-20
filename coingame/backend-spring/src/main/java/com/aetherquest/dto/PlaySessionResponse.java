package com.aetherquest.dto;

public record PlaySessionResponse(
        long remainingPlayTimeSeconds,
        long totalPlayedSeconds,
        long totalCoinsFound,
        String coinBalance,
        long inactivityTimeoutSeconds
) {
}
