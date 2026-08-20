package com.aetherquest.dto;

public record ProfileResponse(
        String id,
        String username,
        String email,
        String phone,
        String firstName,
        String lastName,
        String approvalStatus,
        boolean enabled,
        long playTimeSeconds,
        long totalPlayedSeconds,
        long totalCoinsFound,
        String coinBalance
) {
}
