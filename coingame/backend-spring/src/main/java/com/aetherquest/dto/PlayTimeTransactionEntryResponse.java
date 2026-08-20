package com.aetherquest.dto;

import java.time.Instant;

public record PlayTimeTransactionEntryResponse(
        Long id,
        String userId,
        String username,
        String transactionType,
        long secondsAmount,
        long balanceAfterSeconds,
        Instant occurredAt
) {
}
