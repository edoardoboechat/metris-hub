package com.aetherquest.dto;

import java.time.Instant;

public record CoinLedgerEntryResponse(
        Long id,
        String userId,
        String username,
        String rewardAmount,
        Instant foundAt
) {
}
