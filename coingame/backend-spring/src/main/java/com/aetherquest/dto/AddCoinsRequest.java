package com.aetherquest.dto;

import jakarta.validation.constraints.Min;

public record AddCoinsRequest(
        @Min(1) long amount
) {
}
