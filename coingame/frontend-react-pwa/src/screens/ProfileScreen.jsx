import Field from '../components/common/Field';
import PanelHeader from '../components/common/PanelHeader';
import { useI18n } from '../i18n/I18nProvider';

export default function ProfileScreen({ fieldErrors, profileForm, setProfileForm, onBack, onSave, submitting }) {
  const { t } = useI18n();
  return (
    <main className="screen-shell">
      <section className="auth-panel single-panel">
        <form className="form-grid" onSubmit={onSave}>
          <PanelHeader title={t('profile.formTitle')} subtitle={t('profile.formSubtitle')} />
          <div className="two-columns">
            <Field error={fieldErrors.username} label={t('fields.username')} name="username" onChange={setProfileForm} value={profileForm.username} />
            <Field error={fieldErrors.email} label={t('fields.email')} name="email" onChange={setProfileForm} type="email" value={profileForm.email} />
          </div>
          <Field error={fieldErrors.phone} label={t('fields.phone')} name="phone" onChange={setProfileForm} value={profileForm.phone} />
          <div className="two-columns">
            <Field error={fieldErrors.firstName} label={t('fields.firstName')} name="firstName" onChange={setProfileForm} value={profileForm.firstName} />
            <Field error={fieldErrors.lastName} label={t('fields.lastName')} name="lastName" onChange={setProfileForm} value={profileForm.lastName} />
          </div>
          <div className="icon-action-row">
            <button
              aria-label={submitting ? t('actions.saving') : t('actions.saveProfile')}
              className="icon-action-button primary-button"
              disabled={submitting}
              title={submitting ? t('actions.saving') : t('actions.saveProfile')}
              type="submit"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                <path d="M17 3H5a2 2 0 0 0-2 2v14h18V7l-4-4Zm-5 14a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm3-10H5V5h10v2Z" />
              </svg>
            </button>
            <button aria-label={t('actions.back')} className="icon-action-button secondary-button" onClick={onBack} title={t('actions.back')} type="button">
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                <path d="m14 7-5 5 5 5 1.4-1.4L11.8 13H20v-2h-8.2l3.6-3.6L14 7Z" />
              </svg>
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
