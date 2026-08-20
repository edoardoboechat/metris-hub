package com.aetherquest.repository;

import com.aetherquest.entity.PlaySessionRecord;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaySessionRecordRepository extends JpaRepository<PlaySessionRecord, Long> {

    List<PlaySessionRecord> findAllByUserIdOrderByStartedAtDesc(String userId);

    void deleteAllByUserId(String userId);
}
