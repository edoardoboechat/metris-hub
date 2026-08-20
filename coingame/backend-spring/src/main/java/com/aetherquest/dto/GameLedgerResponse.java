package com.aetherquest.dto;

import java.util.List;

public record GameLedgerResponse(
        List<CoinLedgerEntryResponse> coinEntries,
        List<PlaySessionLedgerEntryResponse> playSessions,
        List<PlayTimeTransactionEntryResponse> playTimeEntries
) {
}
