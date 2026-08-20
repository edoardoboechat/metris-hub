package com.aetherquest.controller;

import com.aetherquest.dto.GameLedgerResponse;
import com.aetherquest.dto.GameSettingsResponse;
import com.aetherquest.dto.InspectionRequest;
import com.aetherquest.dto.InspectionResponse;
import com.aetherquest.dto.PlayerGameStats;
import com.aetherquest.dto.PlaySessionResponse;
import com.aetherquest.service.PlayerGameStateService;
import com.aetherquest.service.GameSettingsService;
import com.aetherquest.service.GameSettingsViewService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/game")
public class GameController {

    private final PlayerGameStateService playerGameStateService;
    private final GameSettingsService gameSettingsService;
    private final GameSettingsViewService gameSettingsViewService;

    public GameController(
            PlayerGameStateService playerGameStateService,
            GameSettingsService gameSettingsService,
            GameSettingsViewService gameSettingsViewService
    ) {
        this.playerGameStateService = playerGameStateService;
        this.gameSettingsService = gameSettingsService;
        this.gameSettingsViewService = gameSettingsViewService;
    }

    @PostMapping("/session/start")
    public PlaySessionResponse start(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        playerGameStateService.startPlaySession(jwt.getSubject(), username == null ? jwt.getSubject() : username);
        PlayerGameStats stats = playerGameStateService.getStats(jwt.getSubject());
        return new PlaySessionResponse(
                stats.remainingPlayTimeSeconds(),
                stats.totalPlayedSeconds(),
                stats.totalCoinsFound(),
                stats.coinBalance(),
                gameSettingsService.getInactivityTimeoutSeconds()
        );
    }

    @PostMapping("/session/stop")
    public PlaySessionResponse stop(@AuthenticationPrincipal Jwt jwt) {
        playerGameStateService.stopPlaySession(jwt.getSubject());
        PlayerGameStats stats = playerGameStateService.getStats(jwt.getSubject());
        return new PlaySessionResponse(
                stats.remainingPlayTimeSeconds(),
                stats.totalPlayedSeconds(),
                stats.totalCoinsFound(),
                stats.coinBalance(),
                gameSettingsService.getInactivityTimeoutSeconds()
        );
    }

    @PostMapping("/inspect")
    public InspectionResponse inspect(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody InspectionRequest request) {
        String username = jwt.getClaimAsString("preferred_username");
        return playerGameStateService.inspect(jwt.getSubject(), username == null ? jwt.getSubject() : username);
    }

    @GetMapping("/ledger")
    public GameLedgerResponse ledger(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return playerGameStateService.getUserLedger(jwt.getSubject(), startDate, endDate);
    }

    @GetMapping("/settings")
    public GameSettingsResponse settings(@AuthenticationPrincipal Jwt jwt) {
        return gameSettingsViewService.buildResponse();
    }
}
