package com.aetherquest.service;

import com.aetherquest.dto.GameSettingsResponse;
import com.aetherquest.entity.AppSettings;
import com.aetherquest.repository.AppSettingsRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GameSettingsService {

    public static final long LOW_COIN_ALERT_THRESHOLD = 100L;

    private final AppSettingsRepository repository;
    private final long defaultInactivityTimeoutSeconds;
    private final long defaultAvailableCoins;
    private final long defaultDistributionDays;

    public GameSettingsService(
            AppSettingsRepository repository,
            @Value("${app.game.inactivity-timeout-seconds:30}") long defaultInactivityTimeoutSeconds,
            @Value("${app.game.initial-available-coins:0}") long defaultAvailableCoins,
            @Value("${app.game.distribution-days:30}") long defaultDistributionDays
    ) {
        this.repository = repository;
        this.defaultInactivityTimeoutSeconds = defaultInactivityTimeoutSeconds;
        this.defaultAvailableCoins = defaultAvailableCoins;
        this.defaultDistributionDays = defaultDistributionDays;
    }

    @Transactional
    public long getInactivityTimeoutSeconds() {
        return getOrCreate().getInactivityTimeoutSeconds();
    }

    @Transactional
    public GameSettingsResponse getSettings() {
        AppSettings settings = getOrCreate();
        return new GameSettingsResponse(settings.getInactivityTimeoutSeconds(), settings.getAvailableCoins(), settings.getDistributionDays(), 0D);
    }

    @Transactional
    public GameSettingsResponse updateInactivityTimeoutSeconds(long inactivityTimeoutSeconds) {
        AppSettings settings = getOrCreate();
        settings.setInactivityTimeoutSeconds(inactivityTimeoutSeconds);
        repository.save(settings);
        return new GameSettingsResponse(settings.getInactivityTimeoutSeconds(), settings.getAvailableCoins(), settings.getDistributionDays(), 0D);
    }

    @Transactional
    public GameSettingsResponse updateDistributionDays(long distributionDays) {
        AppSettings settings = getOrCreate();
        settings.setDistributionDays(distributionDays);
        repository.save(settings);
        return new GameSettingsResponse(settings.getInactivityTimeoutSeconds(), settings.getAvailableCoins(), settings.getDistributionDays(), 0D);
    }

    @Transactional
    public GameSettingsResponse addCoins(long amount) {
        AppSettings settings = getOrCreate();
        settings.setAvailableCoins(settings.getAvailableCoins() + amount);
        repository.save(settings);
        return new GameSettingsResponse(settings.getInactivityTimeoutSeconds(), settings.getAvailableCoins(), settings.getDistributionDays(), 0D);
    }

    @Transactional
    public boolean consumeCoin() {
        AppSettings settings = getOrCreate();
        if (settings.getAvailableCoins() <= 0) {
            return false;
        }

        settings.setAvailableCoins(settings.getAvailableCoins() - 1);
        repository.save(settings);
        return true;
    }

    @Transactional
    public long getAvailableCoins() {
        return getOrCreate().getAvailableCoins();
    }

    @Transactional
    public long getDistributionDays() {
        return getOrCreate().getDistributionDays();
    }

    @Transactional
    public boolean isLowCoinAlertActive() {
        long availableCoins = getAvailableCoins();
        return availableCoins < LOW_COIN_ALERT_THRESHOLD;
    }

    private AppSettings getOrCreate() {
        return repository.findById(AppSettings.SINGLETON_ID)
                .orElseGet(() -> repository.save(new AppSettings(defaultInactivityTimeoutSeconds, defaultAvailableCoins, defaultDistributionDays)));
    }
}
