import PanelHeader from '../components/common/PanelHeader';
import { useI18n } from '../i18n/I18nProvider';

export default function AdminUsersScreen({
  availableCoins,
  adminLoading,
  coinLoadAmount,
  distributionDays,
  estimatedSuccessProbability,
  inactivityTimeoutSeconds,
  adminQuery,
  adminStatus,
  onAddPlayTime,
  onDelete,
  onAction,
  onCoinLoadAmountChange,
  onCoinLoadSave,
  onDistributionDaysChange,
  onDistributionDaysSave,
  onInactivityTimeoutChange,
  onInactivityTimeoutSave,
  onQueryChange,
  onStatusChange,
  submitting,
  users,
}) {
  const { t } = useI18n();
  const translateStatus = (status) => t(`adminUsers.${String(status || '').toLowerCase()}`);
  const formatPlayTime = (seconds) => {
    const totalMinutes = Math.floor((seconds || 0) / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };
  const formatCoinBalance = (value) => Number(value || 0).toFixed(2);
  return (
    <main className="screen-shell">
      <section className="auth-panel admin-panel single-panel">
        <PanelHeader title={t('adminUsers.panelTitle')} subtitle={t('adminUsers.panelSubtitle')} />
        <div className="admin-settings-bar">
          <div className="admin-setting-group">
            <label className="field compact-field">
              <span>{t('adminUsers.inactivityTimeoutLabel')}</span>
              <input min="5" onChange={(event) => onInactivityTimeoutChange(event.target.value)} type="number" value={inactivityTimeoutSeconds} />
            </label>
            <button className="secondary-button admin-setting-action" disabled={submitting} onClick={onInactivityTimeoutSave} type="button">
              {t('adminUsers.saveTimeout')}
            </button>
          </div>
          <div className="admin-setting-group">
            <label className="field compact-field">
              <span>{t('adminUsers.distributionDaysLabel')}</span>
              <input min="1" onChange={(event) => onDistributionDaysChange(event.target.value)} type="number" value={distributionDays} />
            </label>
            <button className="secondary-button admin-setting-action" disabled={submitting} onClick={onDistributionDaysSave} type="button">
              {t('adminUsers.saveDistributionDays')}
            </button>
          </div>
          <div className="admin-setting-group">
            <label className="field compact-field">
              <span>{t('adminUsers.availableCoinsLabel')}</span>
              <input disabled type="number" value={availableCoins} />
            </label>
          </div>
          <div className="admin-setting-group">
            <label className="field compact-field">
              <span>{t('adminUsers.loadCoinsLabel')}</span>
              <input min="1" onChange={(event) => onCoinLoadAmountChange(event.target.value)} type="number" value={coinLoadAmount} />
            </label>
            <button className="primary-button admin-setting-action" disabled={submitting} onClick={onCoinLoadSave} type="button">
              {t('adminUsers.loadCoinsAction')}
            </button>
          </div>
          <label className="field compact-field">
            <span>{t('adminUsers.currentProbabilityLabel')}</span>
            <input disabled type="text" value={`${(estimatedSuccessProbability * 100).toFixed(4)}%`} />
          </label>
        </div>
        <div className="admin-toolbar">
          <input className="admin-search" onChange={(event) => onQueryChange(event.target.value)} placeholder={t('actions.searchPlaceholder')} type="text" value={adminQuery} />
          <select className="admin-select" onChange={(event) => onStatusChange(event.target.value)} value={adminStatus}>
            <option value="all">{t('adminUsers.all')}</option>
            <option value="pending">{t('adminUsers.pending')}</option>
            <option value="active">{t('adminUsers.active')}</option>
            <option value="blocked">{t('adminUsers.blocked')}</option>
          </select>
        </div>

        <div className="users-table">
          <div className="users-table-head">
            <span>{t('adminUsers.columns.user')}</span>
            <span>{t('adminUsers.columns.contact')}</span>
            <span>{t('adminUsers.columns.state')}</span>
            <span>{t('adminUsers.columns.actions')}</span>
          </div>
          {adminLoading ? (
            <div className="empty-state">{t('actions.loadingUsers')}</div>
          ) : users.length === 0 ? (
            <div className="empty-state">{t('adminUsers.empty')}</div>
          ) : (
            users.map((user) => (
              <div className="users-row" key={user.id}>
                <div>
                  <strong>{user.username}</strong>
                  <p>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || t('fields.noName')}</p>
                </div>
                <div>
                  <strong>{user.email}</strong>
                  <p>{user.phone || t('fields.noPhone')}</p>
                </div>
                <div>
                  <span className={`status-pill status-${user.approvalStatus.toLowerCase()}`}>{translateStatus(user.approvalStatus)}</span>
                  <p>{t('adminUsers.playTimeValue', { time: formatPlayTime(user.playTimeSeconds) })}</p>
                  <p>{t('adminUsers.totalPlayedValue', { time: formatPlayTime(user.totalPlayedSeconds) })}</p>
                  <p>{t('adminUsers.coinBalanceValue', { amount: formatCoinBalance(user.coinBalance) })}</p>
                </div>
                <div className="action-row compact">
                  <button
                    className="primary-button"
                    disabled={submitting || user.approvalStatus === 'ACTIVE'}
                    onClick={() => onAction(user.id, 'activate')}
                    type="button"
                  >
                    {t('actions.activate')}
                  </button>
                  <button
                    className="ghost-button"
                    disabled={submitting || user.approvalStatus === 'BLOCKED'}
                    onClick={() => onAction(user.id, 'block')}
                    type="button"
                  >
                    {t('actions.block')}
                  </button>
                  <button className="secondary-button" disabled={submitting} onClick={() => onAddPlayTime(user)} type="button">
                    {t('actions.addTime')}
                  </button>
                  <button className="ghost-button" disabled={submitting} onClick={() => onDelete(user)} type="button">
                    {t('actions.delete')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
