package com.aetherquest.dto;

import jakarta.validation.constraints.Min;

public record AdminUserPlayTimeUpdateRequest(
        @Min(value = 1, message = "O tempo adicional deve ser de pelo menos 1 minuto.")
        long minutes
) {
}
