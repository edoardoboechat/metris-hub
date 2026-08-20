package com.aetherquest.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "play_session_record")
public class PlaySessionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "ended_at", nullable = false)
    private Instant endedAt;

    @Column(name = "played_seconds", nullable = false)
    private long playedSeconds;

    @Column(name = "coins_found", nullable = false)
    private long coinsFound;

    @Column(name = "coin_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal coinAmount;

    protected PlaySessionRecord() {
    }

    public PlaySessionRecord(
            String userId,
            String username,
            Instant startedAt,
            Instant endedAt,
            long playedSeconds,
            long coinsFound,
            BigDecimal coinAmount
    ) {
        this.userId = userId;
        this.username = username;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.playedSeconds = playedSeconds;
        this.coinsFound = coinsFound;
        this.coinAmount = coinAmount;
    }

    public Long getId() {
        return id;
    }

    public String getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getEndedAt() {
        return endedAt;
    }

    public long getPlayedSeconds() {
        return playedSeconds;
    }

    public long getCoinsFound() {
        return coinsFound;
    }

    public BigDecimal getCoinAmount() {
        return coinAmount;
    }
}
