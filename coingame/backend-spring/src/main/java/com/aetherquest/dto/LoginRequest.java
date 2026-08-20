package com.aetherquest.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Informe o username ou email.")
        String identifier,
        @NotBlank(message = "Informe a password.")
        String password
) {
}
