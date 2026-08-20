import { useI18n } from '../../i18n/I18nProvider';

export default function LoadingShell() {
  const { t } = useI18n();
  return (
    <div className="shell shell-loading">
      <div className="pulse-orb" />
      <p className="eyebrow">{t('app.loading')}</p>
    </div>
  );
}
