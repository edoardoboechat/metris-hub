package com.aetherquest.dto;

public record AdminTaskSummary(
        String id,
        String type,
        String title,
        String description,
        long createdAt,
        String userId,
        String username
) {
}
