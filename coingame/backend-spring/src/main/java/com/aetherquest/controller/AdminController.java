package com.aetherquest.controller;

import com.aetherquest.dto.AdminTaskBoardResponse;
import com.aetherquest.dto.AdminUserPlayTimeUpdateRequest;
import com.aetherquest.dto.AdminUserStatusUpdateRequest;
import com.aetherquest.dto.AddCoinsRequest;
import com.aetherquest.dto.AdminUserSummary;
import com.aetherquest.dto.DistributionDaysUpdateRequest;
import com.aetherquest.dto.GameLedgerResponse;
import com.aetherquest.dto.GameSettingsResponse;
import com.aetherquest.dto.InactivityTimeoutUpdateRequest;
import com.aetherquest.service.AdminAccessService;
import com.aetherquest.service.GameSettingsService;
import com.aetherquest.service.GameSettingsViewService;
import com.aetherquest.service.KeycloakAdminService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminAccessService adminAccessService;
    private final KeycloakAdminService keycloakAdminService;
    private final GameSettingsService gameSettingsService;
    private final GameSettingsViewService gameSettingsViewService;

    public AdminController(
            AdminAccessService adminAccessService,
            KeycloakAdminService keycloakAdminService,
            GameSettingsService gameSettingsService,
            GameSettingsViewService gameSettingsViewService
    ) {
        this.adminAccessService = adminAccessService;
        this.keycloakAdminService = keycloakAdminService;
        this.gameSettingsService = gameSettingsService;
        this.gameSettingsViewService = gameSettingsViewService;
    }

    @GetMapping("/users")
    public List<AdminUserSummary> users(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "") String query,
            @RequestParam(defaultValue = "all") String status
    ) {
        adminAccessService.requireAdmin(jwt);
        return keycloakAdminService.listUsers(query, status);
    }

    @PatchMapping("/users/{userId}/status")
    public AdminUserSummary updateStatus(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String userId,
            @Valid @RequestBody AdminUserStatusUpdateRequest request
    ) {
        adminAccessService.requireAdmin(jwt);
        return keycloakAdminService.updateUserStatus(userId, request.action());
    }

    @PatchMapping("/users/{userId}/play-time")
    public AdminUserSummary addPlayTime(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String userId,
            @Valid @RequestBody AdminUserPlayTimeUpdateRequest request
    ) {
        adminAccessService.requireAdmin(jwt);
        return keycloakAdminService.addUserPlayTime(userId, request.minutes());
    }

    @DeleteMapping("/users/{userId}")
    public void deleteUser(@AuthenticationPrincipal Jwt jwt, @PathVariable String userId) {
        adminAccessService.requireAdmin(jwt);
        keycloakAdminService.deleteUser(userId);
    }

    @GetMapping("/tasks")
    public AdminTaskBoardResponse tasks(@AuthenticationPrincipal Jwt jwt) {
        adminAccessService.requireAdmin(jwt);
        return keycloakAdminService.getAdminTaskBoard();
    }

    @GetMapping("/ledger")
    public GameLedgerResponse ledger(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "") String username,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        adminAccessService.requireAdmin(jwt);
        return keycloakAdminService.getAdminLedger(username, startDate, endDate);
    }

    @GetMapping("/settings")
    public GameSettingsResponse settings(@AuthenticationPrincipal Jwt jwt) {
        adminAccessService.requireAdmin(jwt);
        return gameSettingsViewService.buildResponse();
    }

    @PatchMapping("/settings/timeout")
    public GameSettingsResponse updateTimeout(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody InactivityTimeoutUpdateRequest request
    ) {
        adminAccessService.requireAdmin(jwt);
        gameSettingsService.updateInactivityTimeoutSeconds(request.inactivityTimeoutSeconds());
        return gameSettingsViewService.buildResponse();
    }

    @PatchMapping("/settings/distribution-days")
    public GameSettingsResponse updateDistributionDays(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody DistributionDaysUpdateRequest request
    ) {
        adminAccessService.requireAdmin(jwt);
        gameSettingsService.updateDistributionDays(request.distributionDays());
        return gameSettingsViewService.buildResponse();
    }

    @PatchMapping("/coins")
    public GameSettingsResponse addCoins(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AddCoinsRequest request
    ) {
        adminAccessService.requireAdmin(jwt);
        gameSettingsService.addCoins(request.amount());
        return gameSettingsViewService.buildResponse();
    }
}
