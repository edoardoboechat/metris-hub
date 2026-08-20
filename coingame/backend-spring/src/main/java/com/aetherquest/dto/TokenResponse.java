package com.aetherquest.dto;

public record TokenResponse(
        String accessToken,
        String refreshToken,
        long expiresIn,
        long refreshExpiresIn,
        String tokenType,
        ProfileResponse user
) {
}
