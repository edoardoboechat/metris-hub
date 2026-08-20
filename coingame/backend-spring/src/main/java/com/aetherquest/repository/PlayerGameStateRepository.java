package com.aetherquest.repository;

import com.aetherquest.entity.PlayerGameState;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlayerGameStateRepository extends JpaRepository<PlayerGameState, String> {
}
