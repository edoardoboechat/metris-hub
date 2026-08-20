package com.aetherquest.service;

import com.aetherquest.dto.CoinLedgerEntryResponse;
import com.aetherquest.dto.GameLedgerResponse;
import com.aetherquest.dto.InspectionResponse;
import com.aetherquest.dto.PlayerGameStats;
import com.aetherquest.dto.PlaySessionLedgerEntryResponse;
import com.aetherquest.dto.PlayTimeTransactionEntryResponse;
import com.aetherquest.entity.CoinFindRecord;
import com.aetherquest.entity.PlaySessionRecord;
import com.aetherquest.entity.PlayTimeTransactionRecord;
import com.aetherquest.entity.PlayerGameState;
import com.aetherquest.exception.ApiException;
import com.aetherquest.repository.CoinFindRecordRepository;
import com.aetherquest.repository.PlaySessionRecordRepository;
import com.aetherquest.repository.PlayTimeTransactionRecordRepository;
import com.aetherquest.repository.PlayerGameStateRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlayerGameStateService {

    private static final String TIME_CREDIT = "CREDIT";
    private static final String TIME_DEBIT = "DEBIT";
    private static final BigDecimal COIN_REWARD = BigDecimal.ONE.setScale(2, RoundingMode.HALF_UP);

    private final PlayerGameStateRepository repository;
    private final CoinFindRecordRepository coinFindRecordRepository;
    private final PlaySessionRecordRepository playSessionRecordRepository;
    private final PlayTimeTransactionRecordRepository playTimeTransactionRecordRepository;
    private final GameSettingsService gameSettingsService;

    public PlayerGameStateService(
            PlayerGameStateRepository repository,
            CoinFindRecordRepository coinFindRecordRepository,
            PlaySessionRecordRepository playSessionRecordRepository,
            PlayTimeTransactionRecordRepository playTimeTransactionRecordRepository,
            GameSettingsService gameSettingsService
    ) {
        this.repository = repository;
        this.coinFindRecordRepository = coinFindRecordRepository;
        this.playSessionRecordRepository = playSessionRecordRepository;
        this.playTimeTransactionRecordRepository = playTimeTransactionRecordRepository;
        this.gameSettingsService = gameSettingsService;
    }

    @Transactional
    public long startPlaySession(String userId, String username) {
        PlayerGameState state = getOrCreate(userId);
        Instant now = Instant.now();
        expireStaleSessionIfNeeded(state, now);
        ensureActiveSession(state, username, now);
        return computeRemainingSeconds(state, now);
    }

    @Transactional
    public long stopPlaySession(String userId) {
        PlayerGameState state = getOrCreate(userId);
        normalizeElapsedPlay(state, Instant.now());
        return computeRemainingSeconds(state, Instant.now());
    }

    @Transactional
    public void touchActiveSession(String userId) {
        PlayerGameState state = getOrCreate(userId);
        Instant now = Instant.now();
        if (expireStaleSessionIfNeeded(state, now) || state.getActivePlayStartedAt() == null) {
            return;
        }

        state.setActiveSessionLastSeenAt(now);
        repository.save(state);
    }

    @Transactional
    public long getRemainingPlayTimeSeconds(String userId) {
        PlayerGameState state = repository.findById(userId).orElse(null);
        if (state == null) {
            return 0L;
        }

        Instant now = Instant.now();
        expireStaleSessionIfNeeded(state, now);
        return computeRemainingSeconds(state, now);
    }

    @Transactional
    public long getTotalRemainingPlayTimeSecondsAllPlayers() {
        Instant now = Instant.now();
        long total = 0L;
        for (PlayerGameState state : repository.findAll()) {
            expireStaleSessionIfNeeded(state, now);
            total += computeRemainingSeconds(state, now);
        }
        return total;
    }

    @Transactional(readOnly = true)
    public long getCoinsFoundToday() {
        ZoneId zoneId = ZoneId.systemDefault();
        Instant startOfDay = LocalDate.now(zoneId).atStartOfDay(zoneId).toInstant();
        Instant endOfDay = LocalDate.now(zoneId).plusDays(1).atStartOfDay(zoneId).toInstant();
        return coinFindRecordRepository.countByFoundAtGreaterThanEqualAndFoundAtLessThan(startOfDay, endOfDay);
    }

    @Transactional(readOnly = true)
    public double calculateCurrentSuccessProbability(long availableCoins, long distributionDays) {
        long effectiveDistributionDays = Math.max(distributionDays, 1L);
        long dailyCoinQuota = Math.max((long) Math.ceil(availableCoins / (double) effectiveDistributionDays), 0L);
        long dailyCoinsRemaining = Math.max(dailyCoinQuota - getCoinsFoundToday(), 0L);
        long totalRemainingSecondsAllPlayers = getTotalRemainingPlayTimeSecondsAllPlayers();
        if (dailyCoinsRemaining <= 0 || totalRemainingSecondsAllPlayers <= 0) {
            return 0D;
        }

        return Math.min((double) dailyCoinsRemaining / (double) totalRemainingSecondsAllPlayers, 1D);
    }

    @Transactional
    public long addPlayTime(String userId, String username, long minutes) {
        PlayerGameState state = getOrCreate(userId);
        Instant now = Instant.now();
        expireStaleSessionIfNeeded(state, now);
        long creditedSeconds = minutes * 60;
        state.setGrantedPlayTimeSeconds(state.getGrantedPlayTimeSeconds() + creditedSeconds);
        repository.save(state);
        recordPlayTimeTransaction(state, username, TIME_CREDIT, creditedSeconds, computeRemainingSeconds(state, now), now);
        return computeRemainingSeconds(state, now);
    }

    @Transactional
    public InspectionResponse inspect(String userId, String username) {
        PlayerGameState state = getOrCreate(userId);
        Instant now = Instant.now();
        expireStaleSessionIfNeeded(state, now);
        ensureActiveSession(state, username, now);

        long remaining = computeRemainingSeconds(state, now);
        if (remaining <= 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Nao existe tempo de jogo disponivel.");
        }

        long availableCoins = gameSettingsService.getAvailableCoins();
        long distributionDays = gameSettingsService.getDistributionDays();
        long dailyCoinQuota = Math.max((long) Math.ceil(availableCoins / (double) Math.max(distributionDays, 1L)), 0L);
        long dailyCoinsRemaining = Math.max(dailyCoinQuota - getCoinsFoundToday(), 0L);
        long totalRemainingSecondsAllPlayers = getTotalRemainingPlayTimeSecondsAllPlayers();
        double successProbability = dailyCoinsRemaining <= 0 || totalRemainingSecondsAllPlayers <= 0
                ? 0D
                : Math.min((double) dailyCoinsRemaining / (double) totalRemainingSecondsAllPlayers, 1D);
        boolean success = availableCoins > 0 && dailyCoinsRemaining > 0 && ThreadLocalRandom.current().nextDouble() < successProbability;
        String rewardAmount = success ? COIN_REWARD.toPlainString() : null;

        if (success) {
            if (!gameSettingsService.consumeCoin()) {
                success = false;
                rewardAmount = null;
            }
        }

        if (success) {
            BigDecimal reward = COIN_REWARD;
            state.setTotalCoinsFound(state.getTotalCoinsFound() + 1);
            state.setCoinBalance(state.getCoinBalance().add(reward));
            state.setActiveSessionLastSeenAt(now);
            repository.save(state);
            coinFindRecordRepository.save(new CoinFindRecord(userId, username, reward, now));
        } else {
            state.setActiveSessionLastSeenAt(now);
            repository.save(state);
        }

        PlayerGameStats stats = buildStats(state, now);
        return new InspectionResponse(
                success,
                rewardAmount,
                stats.remainingPlayTimeSeconds(),
                stats.totalPlayedSeconds(),
                stats.totalCoinsFound(),
                stats.coinBalance(),
                gameSettingsService.getInactivityTimeoutSeconds()
        );
    }

    @Transactional
    public void deleteUserState(String userId) {
        coinFindRecordRepository.deleteAllByUserId(userId);
        playSessionRecordRepository.deleteAllByUserId(userId);
        playTimeTransactionRecordRepository.deleteAllByUserId(userId);
        repository.deleteById(userId);
    }

    @Transactional(readOnly = true)
    public GameLedgerResponse getUserLedger(String userId, LocalDate startDate, LocalDate endDate) {
        List<CoinLedgerEntryResponse> coinEntries = coinFindRecordRepository.findAllByUserIdOrderByFoundAtDesc(userId).stream()
                .filter(record -> isWithinDateRange(record.getFoundAt(), startDate, endDate))
                .map(this::toCoinLedgerEntry)
                .toList();

        List<PlaySessionLedgerEntryResponse> playSessions = playSessionRecordRepository.findAllByUserIdOrderByStartedAtDesc(userId).stream()
                .filter(record -> isWithinDateRange(record.getStartedAt(), startDate, endDate))
                .map(this::toPlaySessionLedgerEntry)
                .toList();

        List<PlayTimeTransactionEntryResponse> playTimeEntries = playTimeTransactionRecordRepository.findAllByUserIdOrderByOccurredAtDesc(userId).stream()
                .filter(record -> isWithinDateRange(record.getOccurredAt(), startDate, endDate))
                .map(this::toPlayTimeTransactionEntry)
                .toList();

        return new GameLedgerResponse(coinEntries, playSessions, playTimeEntries);
    }

    @Transactional(readOnly = true)
    public GameLedgerResponse getAdminLedger(String username, LocalDate startDate, LocalDate endDate) {
        String normalizedUsername = username == null ? "" : username.trim().toLowerCase(Locale.ROOT);

        List<CoinLedgerEntryResponse> coinEntries = coinFindRecordRepository.findAll().stream()
                .filter(record -> matchesUsername(record.getUsername(), normalizedUsername))
                .filter(record -> isWithinDateRange(record.getFoundAt(), startDate, endDate))
                .sorted(Comparator.comparing(CoinFindRecord::getFoundAt).reversed())
                .map(this::toCoinLedgerEntry)
                .toList();

        List<PlaySessionLedgerEntryResponse> playSessions = playSessionRecordRepository.findAll().stream()
                .filter(record -> matchesUsername(record.getUsername(), normalizedUsername))
                .filter(record -> isWithinDateRange(record.getStartedAt(), startDate, endDate))
                .sorted(Comparator.comparing(PlaySessionRecord::getStartedAt).reversed())
                .map(this::toPlaySessionLedgerEntry)
                .toList();

        List<PlayTimeTransactionEntryResponse> playTimeEntries = playTimeTransactionRecordRepository.findAll().stream()
                .filter(record -> matchesUsername(record.getUsername(), normalizedUsername))
                .filter(record -> isWithinDateRange(record.getOccurredAt(), startDate, endDate))
                .sorted(Comparator.comparing(PlayTimeTransactionRecord::getOccurredAt).reversed())
                .map(this::toPlayTimeTransactionEntry)
                .toList();

        return new GameLedgerResponse(coinEntries, playSessions, playTimeEntries);
    }

    @Transactional
    public PlayerGameStats getStats(String userId) {
        PlayerGameState state = getOrCreate(userId);
        Instant now = Instant.now();
        expireStaleSessionIfNeeded(state, now);
        return buildStats(state, now);
    }

    private PlayerGameState getOrCreate(String userId) {
        return repository.findById(userId).orElseGet(() -> repository.save(new PlayerGameState(userId)));
    }

    private void ensureActiveSession(PlayerGameState state, String username, Instant now) {
        if (state.getActivePlayStartedAt() != null || computeRemainingSeconds(state, now) <= 0) {
            return;
        }

        state.setActivePlayStartedAt(now);
        state.setActiveSessionLastSeenAt(now);
        state.setActiveSessionUsername(resolveUsername(state, username));
        state.setActiveSessionCoinsFoundBaseline(state.getTotalCoinsFound());
        state.setActiveSessionCoinBalanceBaseline(state.getCoinBalance());
        repository.save(state);
    }

    private boolean expireStaleSessionIfNeeded(PlayerGameState state, Instant now) {
        if (state.getActivePlayStartedAt() == null) {
            return false;
        }

        Duration heartbeatTimeout = Duration.ofSeconds(gameSettingsService.getInactivityTimeoutSeconds());
        Instant lastSeenAt = state.getActiveSessionLastSeenAt() == null ? state.getActivePlayStartedAt() : state.getActiveSessionLastSeenAt();
        if (Duration.between(lastSeenAt, now).compareTo(heartbeatTimeout) <= 0) {
            return false;
        }

        normalizeElapsedPlay(state, lastSeenAt.plus(heartbeatTimeout));
        return true;
    }

    private void normalizeElapsedPlay(PlayerGameState state, Instant endedAt) {
        if (state.getActivePlayStartedAt() == null) {
            return;
        }

        Instant startedAt = state.getActivePlayStartedAt();
        long elapsedSeconds = Math.max(Duration.between(startedAt, endedAt).getSeconds(), 0L);
        if (elapsedSeconds > 0) {
            state.setConsumedPlayTimeSeconds(state.getConsumedPlayTimeSeconds() + elapsedSeconds);
        }

        long sessionCoinsFound = Math.max(state.getTotalCoinsFound() - state.getActiveSessionCoinsFoundBaseline(), 0L);
        BigDecimal sessionCoinAmount = state.getCoinBalance()
                .subtract(state.getActiveSessionCoinBalanceBaseline() == null ? BigDecimal.ZERO : state.getActiveSessionCoinBalanceBaseline())
                .max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);

        playSessionRecordRepository.save(new PlaySessionRecord(
                state.getUserId(),
                resolveUsername(state, state.getActiveSessionUsername()),
                startedAt,
                endedAt,
                elapsedSeconds,
                sessionCoinsFound,
                sessionCoinAmount
        ));

        recordPlayTimeTransaction(state, state.getActiveSessionUsername(), TIME_DEBIT, elapsedSeconds, computeRemainingSecondsAfterStop(state), endedAt);

        state.setActivePlayStartedAt(null);
        state.setActiveSessionLastSeenAt(null);
        state.setActiveSessionUsername(null);
        state.setActiveSessionCoinsFoundBaseline(state.getTotalCoinsFound());
        state.setActiveSessionCoinBalanceBaseline(state.getCoinBalance());
        repository.save(state);
    }

    private void recordPlayTimeTransaction(PlayerGameState state, String username, String type, long secondsAmount, long balanceAfterSeconds, Instant occurredAt) {
        if (secondsAmount <= 0) {
            return;
        }

        playTimeTransactionRecordRepository.save(new PlayTimeTransactionRecord(
                state.getUserId(),
                resolveUsername(state, username),
                type,
                secondsAmount,
                Math.max(balanceAfterSeconds, 0L),
                occurredAt
        ));
    }

    private long computeRemainingSeconds(PlayerGameState state, Instant now) {
        long activeElapsedSeconds = state.getActivePlayStartedAt() == null
                ? 0L
                : Math.max(Duration.between(state.getActivePlayStartedAt(), now).getSeconds(), 0L);
        long remaining = state.getGrantedPlayTimeSeconds() - state.getConsumedPlayTimeSeconds() - activeElapsedSeconds;
        return Math.max(remaining, 0L);
    }

    private long computeRemainingSecondsAfterStop(PlayerGameState state) {
        long remaining = state.getGrantedPlayTimeSeconds() - state.getConsumedPlayTimeSeconds();
        return Math.max(remaining, 0L);
    }

    private PlayerGameStats buildStats(PlayerGameState state, Instant now) {
        long activeElapsedSeconds = state.getActivePlayStartedAt() == null
                ? 0L
                : Math.max(Duration.between(state.getActivePlayStartedAt(), now).getSeconds(), 0L);
        return new PlayerGameStats(
                computeRemainingSeconds(state, now),
                state.getConsumedPlayTimeSeconds() + activeElapsedSeconds,
                state.getTotalCoinsFound(),
                state.getCoinBalance().setScale(2, RoundingMode.HALF_UP).toPlainString()
        );
    }

    private CoinLedgerEntryResponse toCoinLedgerEntry(CoinFindRecord record) {
        return new CoinLedgerEntryResponse(
                record.getId(),
                record.getUserId(),
                record.getUsername(),
                record.getRewardAmount().setScale(2, RoundingMode.HALF_UP).toPlainString(),
                record.getFoundAt()
        );
    }

    private PlaySessionLedgerEntryResponse toPlaySessionLedgerEntry(PlaySessionRecord record) {
        return new PlaySessionLedgerEntryResponse(
                record.getId(),
                record.getUserId(),
                record.getUsername(),
                record.getStartedAt(),
                record.getEndedAt(),
                record.getPlayedSeconds(),
                record.getCoinsFound(),
                record.getCoinAmount().setScale(2, RoundingMode.HALF_UP).toPlainString()
        );
    }

    private PlayTimeTransactionEntryResponse toPlayTimeTransactionEntry(PlayTimeTransactionRecord record) {
        return new PlayTimeTransactionEntryResponse(
                record.getId(),
                record.getUserId(),
                record.getUsername(),
                record.getTransactionType(),
                record.getSecondsAmount(),
                record.getBalanceAfterSeconds(),
                record.getOccurredAt()
        );
    }

    private String resolveUsername(PlayerGameState state, String username) {
        return username == null || username.isBlank() ? state.getUserId() : username;
    }

    private boolean matchesUsername(String value, String normalizedUsername) {
        return normalizedUsername.isBlank()
                || value != null && value.toLowerCase(Locale.ROOT).contains(normalizedUsername);
    }

    private boolean isWithinDateRange(Instant value, LocalDate startDate, LocalDate endDate) {
        ZoneId zoneId = ZoneId.systemDefault();
        Instant start = startDate == null ? null : startDate.atStartOfDay(zoneId).toInstant();
        Instant endExclusive = endDate == null ? null : endDate.plusDays(1).atStartOfDay(zoneId).toInstant();

        if (start != null && value.isBefore(start)) {
            return false;
        }

        return endExclusive == null || value.isBefore(endExclusive);
    }
}
