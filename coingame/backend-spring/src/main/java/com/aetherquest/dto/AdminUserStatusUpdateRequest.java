package com.aetherquest.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminUserStatusUpdateRequest(
        @NotBlank(message = "Informe a acao pretendida.")
        String action
) {
}
