package com.aetherquest.service;

import com.aetherquest.dto.ProfileResponse;
import com.aetherquest.dto.ProfileUpdateRequest;
import org.springframework.stereotype.Service;

@Service
public class ProfileService {

    private final KeycloakAdminService adminService;
    private final PlayerGameStateService playerGameStateService;

    public ProfileService(KeycloakAdminService adminService, PlayerGameStateService playerGameStateService) {
        this.adminService = adminService;
        this.playerGameStateService = playerGameStateService;
    }

    public ProfileResponse getProfile(String userId) {
        playerGameStateService.touchActiveSession(userId);
        return adminService.getUserProfile(userId);
    }

    public ProfileResponse updateProfile(String userId, ProfileUpdateRequest request) {
        return adminService.updateUserProfile(userId, request);
    }
}
