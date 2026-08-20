package com.aetherquest.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "app_settings")
public class AppSettings {

    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id;

    @Column(name = "inactivity_timeout_seconds", nullable = false)
    private long inactivityTimeoutSeconds;

    @Column(name = "available_coins", nullable = false)
    private long availableCoins;

    @Column(name = "distribution_days", nullable = false)
    private long distributionDays;

    protected AppSettings() {
    }

    public AppSettings(long inactivityTimeoutSeconds, long availableCoins, long distributionDays) {
        this.id = SINGLETON_ID;
        this.inactivityTimeoutSeconds = inactivityTimeoutSeconds;
        this.availableCoins = availableCoins;
        this.distributionDays = distributionDays;
    }

    public Long getId() {
        return id;
    }

    public long getInactivityTimeoutSeconds() {
        return inactivityTimeoutSeconds;
    }

    public void setInactivityTimeoutSeconds(long inactivityTimeoutSeconds) {
        this.inactivityTimeoutSeconds = inactivityTimeoutSeconds;
    }

    public long getAvailableCoins() {
        return availableCoins;
    }

    public void setAvailableCoins(long availableCoins) {
        this.availableCoins = availableCoins;
    }

    public long getDistributionDays() {
        return distributionDays;
    }

    public void setDistributionDays(long distributionDays) {
        this.distributionDays = distributionDays;
    }
}
