import { useI18n } from '../i18n/I18nProvider';

export default function LandingScreen({ stats }) {
  const { t } = useI18n();
  return (
    <main className="landing landing-single">
      <section className="hero-panel">
        <p className="eyebrow">{t('landing.eyebrow')}</p>
        <h2>{t('landing.title')}</h2>
        <p className="hero-copy">{t('landing.copy')}</p>

        <div className="stats-grid">
          {stats.map((item) => (
            <div className={`stat-card ${item.tone}`} key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>

        <div className="feature-list">
          <div className="feature-card">
            <span className="feature-kicker">{t('landing.featureHuntTitle')}</span>
            <p>{t('landing.featureHuntText')}</p>
          </div>
          <div className="feature-card">
            <span className="feature-kicker">{t('landing.featureApprovalTitle')}</span>
            <p>{t('landing.featureApprovalText')}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
