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
@Table(name = "coin_find_record")
public class CoinFindRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "reward_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal rewardAmount;

    @Column(name = "found_at", nullable = false)
    private Instant foundAt;

    protected CoinFindRecord() {
    }

    public CoinFindRecord(String userId, String username, BigDecimal rewardAmount, Instant foundAt) {
      this.userId = userId;
      this.username = username;
      this.rewardAmount = rewardAmount;
      this.foundAt = foundAt;
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

    public BigDecimal getRewardAmount() {
      return rewardAmount;
    }

    public Instant getFoundAt() {
      return foundAt;
    }
}
