package com.aetherquest.repository;

import com.aetherquest.entity.CoinFindRecord;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CoinFindRecordRepository extends JpaRepository<CoinFindRecord, Long> {

    List<CoinFindRecord> findAllByUserIdOrderByFoundAtDesc(String userId);

    long countByFoundAtGreaterThanEqualAndFoundAtLessThan(Instant startInclusive, Instant endExclusive);

    void deleteAllByUserId(String userId);
}
