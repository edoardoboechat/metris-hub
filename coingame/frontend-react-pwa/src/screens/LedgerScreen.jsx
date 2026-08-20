import PanelHeader from '../components/common/PanelHeader';
import { useI18n } from '../i18n/I18nProvider';

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value));
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(totalSeconds || 0, 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function formatAmount(value) {
  return Number(value || 0).toFixed(2);
}

function formatSignedDuration(seconds, type) {
  const prefix = type === 'DEBIT' ? '-' : '+';
  return `${prefix}${formatDuration(seconds)}`;
}

export default function LedgerScreen({
  endDate,
  isAdmin,
  ledger,
  loading,
  onEndDateChange,
  onStartDateChange,
  onUsernameChange,
  startDate,
  username,
}) {
  const { t } = useI18n();
  const coinEntries = ledger?.coinEntries || [];
  const playSessions = ledger?.playSessions || [];
  const playTimeEntries = ledger?.playTimeEntries || [];

  return (
    <main className="screen-shell">
      <section className="auth-panel admin-panel ledger-panel single-panel">
        <PanelHeader title={t('ledger.panelTitle')} subtitle={t('ledger.panelSubtitle')} />

        <div className="ledger-toolbar">
          {isAdmin ? (
            <input
              className="admin-search"
              onChange={(event) => onUsernameChange(event.target.value)}
              placeholder={t('ledger.filters.usernamePlaceholder')}
              type="text"
              value={username}
            />
          ) : null}
          <div className="ledger-date-range">
            <label className="field compact-field">
              <span>{t('ledger.filters.startDate')}</span>
              <input onChange={(event) => onStartDateChange(event.target.value)} type="date" value={startDate} />
            </label>
            <label className="field compact-field">
              <span>{t('ledger.filters.endDate')}</span>
              <input onChange={(event) => onEndDateChange(event.target.value)} type="date" value={endDate} />
            </label>
          </div>
        </div>

        <div className="ledger-grid">
          <section className="ledger-card">
              <div className="ledger-card-header">
                <h4>{t('ledger.coinTitle')}</h4>
                <span>{coinEntries.length}</span>
              </div>
              <div className="ledger-table">
                {isAdmin ? (
                  <div className={`ledger-table-head ${isAdmin ? 'admin-cols' : ''}`}>
                    {isAdmin ? <span>{t('ledger.columns.username')}</span> : null}
                    <span>{t('ledger.columns.amount')}</span>
                    <span>{t('ledger.columns.dateTime')}</span>
                  </div>
                ) : null}
                {loading ? (
                  <div className="empty-state">{t('ledger.loading')}</div>
                ) : coinEntries.length === 0 ? (
                  <div className="empty-state">{t('ledger.emptyCoins')}</div>
                ) : (
                  coinEntries.map((entry) => (
                    isAdmin ? (
                      <div className={`ledger-row ${isAdmin ? 'admin-cols' : ''}`} key={`coin-${entry.id}`}>
                        <span>{entry.username}</span>
                        <strong>{formatAmount(entry.rewardAmount)}</strong>
                        <span>{formatDateTime(entry.foundAt)}</span>
                      </div>
                    ) : (
                      <div className="ledger-stack-row" key={`coin-${entry.id}`}>
                        <p><strong>{t('ledger.columns.amount')}:</strong> {formatAmount(entry.rewardAmount)}</p>
                        <p><strong>{t('ledger.columns.dateTime')}:</strong> {formatDateTime(entry.foundAt)}</p>
                      </div>
                    )
                  ))
                )}
              </div>
          </section>

          <section className="ledger-card">
              <div className="ledger-card-header">
                <h4>{t('ledger.sessionTitle')}</h4>
                <span>{playSessions.length}</span>
              </div>
              <div className="ledger-table">
                {isAdmin ? (
                  <div className={`ledger-table-head wide ${isAdmin ? 'admin-cols' : ''}`}>
                    <span>{t('ledger.columns.username')}</span>
                    <span>{t('ledger.columns.startedAt')}</span>
                    <span>{t('ledger.columns.endedAt')}</span>
                    <span>{t('ledger.columns.playedTime')}</span>
                    <span>{t('ledger.columns.coinsFound')}</span>
                    <span>{t('ledger.columns.coinAmount')}</span>
                  </div>
                ) : null}
                {loading ? (
                  <div className="empty-state">{t('ledger.loading')}</div>
                ) : playSessions.length === 0 ? (
                  <div className="empty-state">{t('ledger.emptySessions')}</div>
                ) : (
                  playSessions.map((entry) => (
                    isAdmin ? (
                      <div className={`ledger-row wide ${isAdmin ? 'admin-cols' : ''}`} key={`session-${entry.id}`}>
                        <span>{entry.username}</span>
                        <span>{formatDateTime(entry.startedAt)}</span>
                        <span>{formatDateTime(entry.endedAt)}</span>
                        <strong>{formatDuration(entry.playedSeconds)}</strong>
                        <span>{entry.coinsFound}</span>
                        <strong>{formatAmount(entry.coinAmount)}</strong>
                      </div>
                    ) : (
                      <div className="ledger-stack-row" key={`session-${entry.id}`}>
                        <p><strong>{t('ledger.columns.startedAt')}:</strong> {formatDateTime(entry.startedAt)}</p>
                        <p><strong>{t('ledger.columns.endedAt')}:</strong> {formatDateTime(entry.endedAt)}</p>
                        <p><strong>{t('ledger.columns.playedTime')}:</strong> {formatDuration(entry.playedSeconds)}</p>
                        <p><strong>{t('ledger.columns.coinsFound')}:</strong> {entry.coinsFound}</p>
                        <p><strong>{t('ledger.columns.coinAmount')}:</strong> {formatAmount(entry.coinAmount)}</p>
                      </div>
                    )
                  ))
                )}
              </div>
          </section>

          <section className="ledger-card">
              <div className="ledger-card-header">
                <h4>{t('ledger.timeTitle')}</h4>
                <span>{playTimeEntries.length}</span>
              </div>
              <div className="ledger-table">
                <div className={`ledger-table-head wide ${isAdmin ? 'admin-cols time-cols' : 'time-cols'}`}>
                  {isAdmin ? <span>{t('ledger.columns.username')}</span> : null}
                  <span>{t('ledger.columns.transactionType')}</span>
                  <span>{t('ledger.columns.timeAmount')}</span>
                  <span>{t('ledger.columns.balanceAfter')}</span>
                  <span>{t('ledger.columns.dateTime')}</span>
                </div>
                {loading ? (
                  <div className="empty-state">{t('ledger.loading')}</div>
                ) : playTimeEntries.length === 0 ? (
                  <div className="empty-state">{t('ledger.emptyTime')}</div>
                ) : (
                  playTimeEntries.map((entry) => (
                    <div className={`ledger-row wide ${isAdmin ? 'admin-cols time-cols' : 'time-cols'}`} key={`time-${entry.id}`}>
                      {isAdmin ? <span>{entry.username}</span> : null}
                      <span>{t(`ledger.transactionType.${String(entry.transactionType || '').toLowerCase()}`)}</span>
                      <strong>{formatSignedDuration(entry.secondsAmount, entry.transactionType)}</strong>
                      <span>{formatDuration(entry.balanceAfterSeconds)}</span>
                      <span>{formatDateTime(entry.occurredAt)}</span>
                    </div>
                  ))
                )}
              </div>
          </section>
        </div>
      </section>
    </main>
  );
}
