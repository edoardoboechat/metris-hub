package com.aetherquest.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "player_game_state")
public class PlayerGameState {

    @Id
    @Column(name = "user_id", nullable = false, updatable = false)
    private String userId;

    @Column(name = "granted_play_time_seconds", nullable = false)
    private long grantedPlayTimeSeconds;

    @Column(name = "consumed_play_time_seconds", nullable = false)
    private long consumedPlayTimeSeconds;

    @Column(name = "active_play_started_at")
    private Instant activePlayStartedAt;

    @Column(name = "active_session_last_seen_at")
    private Instant activeSessionLastSeenAt;

    @Column(name = "active_session_username")
    private String activeSessionUsername;

    @Column(name = "active_session_coins_found_baseline", nullable = false)
    private long activeSessionCoinsFoundBaseline;

    @Column(name = "active_session_coin_balance_baseline", nullable = false, precision = 19, scale = 2)
    private BigDecimal activeSessionCoinBalanceBaseline;

    @Column(name = "total_coins_found", nullable = false)
    private long totalCoinsFound;

    @Column(name = "coin_balance", nullable = false, precision = 19, scale = 2)
    private BigDecimal coinBalance;

    protected PlayerGameState() {
    }

    public PlayerGameState(String userId) {
        this.userId = userId;
        this.grantedPlayTimeSeconds = 0L;
        this.consumedPlayTimeSeconds = 0L;
        this.activeSessionCoinsFoundBaseline = 0L;
        this.activeSessionCoinBalanceBaseline = BigDecimal.ZERO;
        this.totalCoinsFound = 0L;
        this.coinBalance = BigDecimal.ZERO;
    }

    public String getUserId() {
        return userId;
    }

    public long getGrantedPlayTimeSeconds() {
        return grantedPlayTimeSeconds;
    }

    public void setGrantedPlayTimeSeconds(long grantedPlayTimeSeconds) {
        this.grantedPlayTimeSeconds = grantedPlayTimeSeconds;
    }

    public long getConsumedPlayTimeSeconds() {
        return consumedPlayTimeSeconds;
    }

    public void setConsumedPlayTimeSeconds(long consumedPlayTimeSeconds) {
        this.consumedPlayTimeSeconds = consumedPlayTimeSeconds;
    }

    public Instant getActivePlayStartedAt() {
        return activePlayStartedAt;
    }

    public void setActivePlayStartedAt(Instant activePlayStartedAt) {
        this.activePlayStartedAt = activePlayStartedAt;
    }

    public Instant getActiveSessionLastSeenAt() {
        return activeSessionLastSeenAt;
    }

    public void setActiveSessionLastSeenAt(Instant activeSessionLastSeenAt) {
        this.activeSessionLastSeenAt = activeSessionLastSeenAt;
    }

    public String getActiveSessionUsername() {
        return activeSessionUsername;
    }

    public void setActiveSessionUsername(String activeSessionUsername) {
        this.activeSessionUsername = activeSessionUsername;
    }

    public long getActiveSessionCoinsFoundBaseline() {
        return activeSessionCoinsFoundBaseline;
    }

    public void setActiveSessionCoinsFoundBaseline(long activeSessionCoinsFoundBaseline) {
        this.activeSessionCoinsFoundBaseline = activeSessionCoinsFoundBaseline;
    }

    public BigDecimal getActiveSessionCoinBalanceBaseline() {
        return activeSessionCoinBalanceBaseline;
    }

    public void setActiveSessionCoinBalanceBaseline(BigDecimal activeSessionCoinBalanceBaseline) {
        this.activeSessionCoinBalanceBaseline = activeSessionCoinBalanceBaseline;
    }

    public long getTotalCoinsFound() {
        return totalCoinsFound;
    }

    public void setTotalCoinsFound(long totalCoinsFound) {
        this.totalCoinsFound = totalCoinsFound;
    }

    public BigDecimal getCoinBalance() {
        return coinBalance;
    }

    public void setCoinBalance(BigDecimal coinBalance) {
        this.coinBalance = coinBalance;
    }
}
