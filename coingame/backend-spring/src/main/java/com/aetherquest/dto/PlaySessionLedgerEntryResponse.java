package com.aetherquest.dto;

import java.time.Instant;

public record PlaySessionLedgerEntryResponse(
        Long id,
        String userId,
        String username,
        Instant startedAt,
        Instant endedAt,
        long playedSeconds,
        long coinsFound,
        String coinAmount
) {
}
