package com.aetherquest.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "play_time_transaction_record")
public class PlayTimeTransactionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "transaction_type", nullable = false)
    private String transactionType;

    @Column(name = "seconds_amount", nullable = false)
    private long secondsAmount;

    @Column(name = "balance_after_seconds", nullable = false)
    private long balanceAfterSeconds;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    protected PlayTimeTransactionRecord() {
    }

    public PlayTimeTransactionRecord(
            String userId,
            String username,
            String transactionType,
            long secondsAmount,
            long balanceAfterSeconds,
            Instant occurredAt
    ) {
        this.userId = userId;
        this.username = username;
        this.transactionType = transactionType;
        this.secondsAmount = secondsAmount;
        this.balanceAfterSeconds = balanceAfterSeconds;
        this.occurredAt = occurredAt;
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

    public String getTransactionType() {
        return transactionType;
    }

    public long getSecondsAmount() {
        return secondsAmount;
    }

    public long getBalanceAfterSeconds() {
        return balanceAfterSeconds;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }
}
