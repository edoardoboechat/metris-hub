package com.aetherquest.dto;

public record PlayerGameStats(
        long remainingPlayTimeSeconds,
        long totalPlayedSeconds,
        long totalCoinsFound,
        String coinBalance
) {
}
