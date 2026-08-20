package com.aetherquest.service;

import com.aetherquest.dto.GameSettingsResponse;
import org.springframework.stereotype.Service;

@Service
public class GameSettingsViewService {

    private final GameSettingsService gameSettingsService;
    private final PlayerGameStateService playerGameStateService;

    public GameSettingsViewService(GameSettingsService gameSettingsService, PlayerGameStateService playerGameStateService) {
        this.gameSettingsService = gameSettingsService;
        this.playerGameStateService = playerGameStateService;
    }

    public GameSettingsResponse buildResponse() {
        long inactivityTimeoutSeconds = gameSettingsService.getInactivityTimeoutSeconds();
        long availableCoins = gameSettingsService.getAvailableCoins();
        long distributionDays = gameSettingsService.getDistributionDays();
        double estimatedSuccessProbability = playerGameStateService.calculateCurrentSuccessProbability(availableCoins, distributionDays);
        return new GameSettingsResponse(inactivityTimeoutSeconds, availableCoins, distributionDays, estimatedSuccessProbability);
    }
}
