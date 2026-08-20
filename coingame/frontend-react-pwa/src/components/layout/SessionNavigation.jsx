import { useI18n } from '../../i18n/I18nProvider';

export default function SessionNavigation({ collapsed, isAdmin, onToggle, screen, setScreen }) {
  const { t } = useI18n();
  const items = isAdmin
    ? [
        {
          id: 'tasks',
          label: t('nav.tasks'),
          icon: <path d="M7 3h10v2H7V3Zm-2 4h14v2H5V7Zm2 4h10v2H7v-2Zm-2 4h14v2H5v-2Zm2 4h10v2H7v-2Z" />,
        },
        {
          id: 'users',
          label: t('nav.users'),
          icon: <path d="M16 11a4 4 0 1 0-3.2-6.4A4 4 0 0 0 16 11Zm-8 1a3 3 0 1 0-2.4-4.8A3 3 0 0 0 8 12Zm8 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Zm-8 1c-2.33 0-7 1.17-7 3.5V20h5v-2c0-1.17.61-2.18 1.64-3H8Z" />,
        },
        {
          id: 'ledger',
          label: t('nav.ledger'),
          icon: <path d="M5 4h14a1 1 0 0 1 1 1v14H4V5a1 1 0 0 1 1-1Zm1 3v2h12V7H6Zm0 4v2h8v-2H6Zm0 4v2h12v-2H6Z" />,
        },
        {
          id: 'profile',
          label: t('nav.profile'),
          icon: <path d="M12 12a4 4 0 1 0-3.2-6.4A4 4 0 0 0 12 12Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" />,
        },
      ]
    : [
        {
          id: 'home',
          label: t('nav.home'),
          icon: <path d="M4 10.5 12 4l8 6.5V20h-5v-5H9v5H4v-9.5Z" />,
        },
        {
          id: 'play',
          label: t('nav.play'),
          icon: <path d="M8 5.5 18.5 12 8 18.5v-13Z" />,
        },
        {
          id: 'ledger',
          label: t('nav.ledger'),
          icon: <path d="M5 4h14a1 1 0 0 1 1 1v14H4V5a1 1 0 0 1 1-1Zm1 3v2h12V7H6Zm0 4v2h8v-2H6Zm0 4v2h12v-2H6Z" />,
        },
        {
          id: 'profile',
          label: t('nav.profile'),
          icon: <path d="M12 12a4 4 0 1 0-3.2-6.4A4 4 0 0 0 12 12Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" />,
        },
      ];

  return (
    <nav className={`session-nav ${collapsed ? 'collapsed' : ''}`}>
      {!collapsed ? (
        <div className="session-nav-group">
          {items.map((item) => (
            <button
              aria-label={item.label}
              className={screen === item.id ? 'active' : ''}
              key={item.id}
              onClick={() => setScreen(item.id)}
              title={item.label}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                {item.icon}
              </svg>
            </button>
          ))}
        </div>
      ) : null}
      <button
        aria-label={collapsed ? t('actions.expandNav') : t('actions.collapseNav')}
        className="session-nav-toggle"
        onClick={onToggle}
        title={collapsed ? t('actions.expandNav') : t('actions.collapseNav')}
        type="button"
      >
        {collapsed ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M5 6h10v2H5V6Zm0 5h10v2H5v-2Zm0 5h10v2H5v-2Zm12-8 4 4-4 4v-3h-6v-2h6V8Z" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M5 6h14v2H5V6Zm0 5h14v2H5v-2Zm0 5h14v2H5v-2Zm0-4 4-4v3h6v2H9v3l-4-4Z" />
          </svg>
        )}
      </button>
    </nav>
  );
}
