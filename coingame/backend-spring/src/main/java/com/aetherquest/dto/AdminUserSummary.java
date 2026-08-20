package com.aetherquest.dto;

public record AdminUserSummary(
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
        String coinBalance
) {
}
