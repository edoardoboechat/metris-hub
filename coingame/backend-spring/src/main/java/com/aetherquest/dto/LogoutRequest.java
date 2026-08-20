package com.aetherquest.dto;

import jakarta.validation.constraints.NotBlank;

public record LogoutRequest(
        @NotBlank(message = "Refresh token obrigatorio.")
        String refreshToken
) {
}
