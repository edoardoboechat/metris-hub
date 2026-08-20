package com.aetherquest.dto;

import java.util.List;

public record AdminTaskBoardResponse(
        int pendingCount,
        List<AdminTaskSummary> tasks
) {
}
