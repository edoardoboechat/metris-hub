import PanelHeader from '../components/common/PanelHeader';
import SummaryLine from '../components/common/SummaryLine';
import { useI18n } from '../i18n/I18nProvider';

export default function AuthenticatedHome({ isAdmin, onOpenPlay, onOpenProfile, user }) {
  const { t } = useI18n();
  const displayName = user.firstName || user.username;
  const translatedStatus = t(`adminUsers.${String(user.approvalStatus || 'active').toLowerCase()}`);

  return (
    <main className="screen-shell">
      <section className="auth-panel connected-card single-panel">
        <PanelHeader
          title={t('authenticatedHome.connectedTitle')}
          subtitle={isAdmin ? t('authenticatedHome.adminTitle', { name: displayName }) : t('authenticatedHome.playerTitle', { name: displayName })}
        />
        <div className="connected-summary">
          <SummaryLine label={t('authenticatedHome.summaryUsername')} value={user.username} />
          <SummaryLine label={t('authenticatedHome.summaryEmail')} value={user.email} />
          <SummaryLine label={t('authenticatedHome.summaryPhone')} value={user.phone || t('fields.undefined')} />
          <SummaryLine label={t('authenticatedHome.summaryName')} value={`${user.firstName || ''} ${user.lastName || ''}`.trim() || t('fields.undefined')} />
          <SummaryLine label={t('authenticatedHome.summaryStatus')} value={translatedStatus} />
        </div>
        <div className="icon-action-row">
          {!isAdmin ? (
            <button aria-label={t('actions.openScanner')} className="icon-action-button primary-button" onClick={onOpenPlay} title={t('actions.openScanner')} type="button">
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                <path d="M8 5.5 18.5 12 8 18.5v-13Z" />
              </svg>
            </button>
          ) : (
            <button aria-label={t('actions.openProfile')} className="icon-action-button primary-button" onClick={onOpenProfile} title={t('actions.openProfile')} type="button">
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                <path d="M12 12a4 4 0 1 0-3.2-6.4A4 4 0 0 0 12 12Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" />
              </svg>
            </button>
          )}
          <button
            aria-label={isAdmin ? t('actions.openProfile') : t('actions.reviewProfile')}
            className="icon-action-button secondary-button"
            onClick={onOpenProfile}
            title={isAdmin ? t('actions.openProfile') : t('actions.reviewProfile')}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
              <path d="M12 12a4 4 0 1 0-3.2-6.4A4 4 0 0 0 12 12Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" />
            </svg>
          </button>
        </div>
      </section>
    </main>
  );
}
