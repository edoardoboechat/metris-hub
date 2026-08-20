import { useI18n } from '../../i18n/I18nProvider';

export default function TopBar({ backendConnected, hasSession, isAdmin, pendingTaskCount, onLoginOpen, onLogout, onOpenTasks }) {
  const { locale, setLocale, supportedLocales, t } = useI18n();
  const authLabel = hasSession ? t('actions.logout') : t('actions.login');

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="topbar-title">
          <p className="eyebrow">{t('app.title')}</p>
          <div className="topbar-meta">
            <div className="language-switcher" role="group" aria-label="Language switcher">
              {supportedLocales.map((item) => (
                <button
                  className={locale === item.code ? 'active' : ''}
                  key={item.code}
                  onClick={() => setLocale(item.code)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div
              aria-label={backendConnected ? t('status.online') : t('status.disconnected')}
              className="topbar-status"
              title={backendConnected ? t('status.online') : t('status.disconnected')}
            >
              <span className={`status-dot ${backendConnected ? 'online' : 'disconnected'}`} />
            </div>
            {hasSession ? (
              <button
                aria-label={authLabel}
                className="ghost-button topbar-auth-button"
                onClick={onLogout}
                title={authLabel}
                type="button"
              >
                <span className="topbar-auth-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4v-2H6V6h4V4Zm5.6 3.4-1.4 1.4 2.2 2.2H9v2h7.4l-2.2 2.2 1.4 1.4L20.2 12l-4.6-4.6Z" />
                  </svg>
                </span>
                <span className="topbar-auth-label">{authLabel}</span>
              </button>
            ) : (
              <button
                aria-label={authLabel}
                className="primary-button topbar-auth-button"
                onClick={onLoginOpen}
                title={authLabel}
                type="button"
              >
                <span className="topbar-auth-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M14 4v2h4v12h-4v2h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-4Zm-1.4 3.4L11.2 8.8l2.2 2.2H4v2h9.4l-2.2 2.2 1.4 1.4L17.2 12l-4.6-4.6Z" />
                  </svg>
                </span>
                <span className="topbar-auth-label">{authLabel}</span>
              </button>
            )}
          </div>
        </div>
        {!hasSession ? <h1>{t('app.heroTitle')}</h1> : null}
      </div>
      <div className="topbar-actions">
        {isAdmin ? (
          <button className={`admin-bell ${pendingTaskCount > 0 ? 'has-pending' : ''}`} onClick={onOpenTasks} type="button">
            <span className="bell-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M12 3a4 4 0 0 0-4 4v1.2c0 .9-.3 1.8-.9 2.5L5.6 12.6a3 3 0 0 0 2.3 5h8.2a3 3 0 0 0 2.3-5l-1.5-1.9a4 4 0 0 1-.9-2.5V7a4 4 0 0 0-4-4Zm0 18a2.8 2.8 0 0 0 2.5-1.5h-5A2.8 2.8 0 0 0 12 21Z" />
              </svg>
            </span>
            <span className="bell-count">{pendingTaskCount}</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}
