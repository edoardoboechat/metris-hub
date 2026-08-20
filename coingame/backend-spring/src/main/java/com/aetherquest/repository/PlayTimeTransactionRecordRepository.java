package com.aetherquest.repository;

import com.aetherquest.entity.PlayTimeTransactionRecord;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlayTimeTransactionRecordRepository extends JpaRepository<PlayTimeTransactionRecord, Long> {

    List<PlayTimeTransactionRecord> findAllByUserIdOrderByOccurredAtDesc(String userId);

    void deleteAllByUserId(String userId);
}
