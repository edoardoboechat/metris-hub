import { useRef, useState } from 'react';
import Field from '../common/Field';
import { useI18n } from '../../i18n/I18nProvider';

const PASSWORD_RECOVERY_URL = process.env.REACT_APP_PASSWORD_RECOVERY_URL || '';

export default function AuthDialog({
  authMessage,
  fieldErrors,
  loginForm,
  mode,
  onClose,
  onLoginChange,
  onLoginSubmit,
  onModeChange,
  onRegisterChange,
  onRegisterSubmit,
  open,
  registerForm,
  submitting,
}) {
  const { t } = useI18n();
  const loginFormRef = useRef(null);
  const registerFormRef = useRef(null);
  const recoverFormRef = useRef(null);
  const [recoveryForm, setRecoveryForm] = useState({ identifier: '', method: 'email' });
  const [recoveryMessage, setRecoveryMessage] = useState('');

  if (!open) {
    return null;
  }

  function submitCurrentMode(currentMode) {
    if (currentMode === 'login') {
      loginFormRef.current?.requestSubmit();
      return;
    }

    if (currentMode === 'register') {
      registerFormRef.current?.requestSubmit();
      return;
    }

    recoverFormRef.current?.requestSubmit();
  }

  function handleModeAction(nextMode) {
    if (mode === nextMode) {
      submitCurrentMode(nextMode);
      return;
    }

    setRecoveryMessage('');
    onModeChange(nextMode);
  }

  function handleRecoverSubmit(event) {
    event.preventDefault();

    const identifier = recoveryForm.identifier.trim();
    if (!identifier) {
      setRecoveryMessage(t('authDialog.recoverValidation'));
      return;
    }

    if (PASSWORD_RECOVERY_URL) {
      const recoveryUrl = new URL(PASSWORD_RECOVERY_URL, window.location.origin);
      recoveryUrl.searchParams.set(recoveryForm.method, identifier);
      window.open(recoveryUrl.toString(), '_blank', 'noopener,noreferrer');
      setRecoveryMessage(t('authDialog.recoverOpened'));
      return;
    }

    setRecoveryMessage(t('authDialog.recoverFallback'));
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div aria-modal="true" className="modal-card auth-dialog" role="dialog">
        <div className="modal-body">
          <div className="auth-dialog-header">
            <div className="auth-dialog-spacer" />
            <button aria-label={t('actions.close')} className="ghost-button auth-dialog-close" onClick={onClose} type="button">
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                <path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4 6.4 5Z" />
              </svg>
            </button>
          </div>

          {authMessage ? <div className={`auth-dialog-alert ${authMessage.type || 'info'}`}>{authMessage.text}</div> : null}

          {mode === 'login' ? (
            <form className="form-grid auth-dialog-form" onSubmit={onLoginSubmit} ref={loginFormRef}>
              <Field
                error={fieldErrors.identifier}
                label={t('fields.identifier')}
                name="identifier"
                onChange={onLoginChange}
                placeholder="pilot01 ou pilot01@aetherquest.com"
                value={loginForm.identifier}
              />
              <Field
                error={fieldErrors.password}
                label={t('fields.password')}
                name="password"
                onChange={onLoginChange}
                placeholder="********"
                type="password"
                value={loginForm.password}
              />
            </form>
          ) : null}

          {mode === 'register' ? (
            <form className="form-grid auth-dialog-form" onSubmit={onRegisterSubmit} ref={registerFormRef}>
              <div className="two-columns">
                <Field error={fieldErrors.username} label={t('fields.username')} name="username" onChange={onRegisterChange} value={registerForm.username} />
                <Field error={fieldErrors.email} label={t('fields.email')} name="email" onChange={onRegisterChange} type="email" value={registerForm.email} />
              </div>
              <Field error={fieldErrors.phone} label={t('fields.phone')} name="phone" onChange={onRegisterChange} value={registerForm.phone} />
              <div className="two-columns">
                <Field error={fieldErrors.firstName} label={t('fields.firstName')} name="firstName" onChange={onRegisterChange} value={registerForm.firstName} />
                <Field error={fieldErrors.lastName} label={t('fields.lastName')} name="lastName" onChange={onRegisterChange} value={registerForm.lastName} />
              </div>
              <div className="two-columns">
                <Field error={fieldErrors.password} label={t('fields.password')} name="password" onChange={onRegisterChange} type="password" value={registerForm.password} />
                <Field
                  error={fieldErrors.confirmPassword}
                  label={t('fields.confirmPassword')}
                  name="confirmPassword"
                  onChange={onRegisterChange}
                  type="password"
                  value={registerForm.confirmPassword}
                />
              </div>
            </form>
          ) : null}

          {mode === 'recover' ? (
            <form className="form-grid auth-dialog-form auth-recovery-panel" onSubmit={handleRecoverSubmit} ref={recoverFormRef}>
              <div className="auth-recovery-methods" role="radiogroup" aria-label={t('actions.recoverPassword')}>
                <button
                  className={recoveryForm.method === 'username' ? 'active' : ''}
                  onClick={() => setRecoveryForm((current) => ({ ...current, method: 'username' }))}
                  type="button"
                >
                  {t('fields.username')}
                </button>
                <button
                  className={recoveryForm.method === 'email' ? 'active' : ''}
                  onClick={() => setRecoveryForm((current) => ({ ...current, method: 'email' }))}
                  type="button"
                >
                  {t('fields.email')}
                </button>
              </div>
              <Field
                label={t(recoveryForm.method === 'username' ? 'fields.username' : 'fields.email')}
                name="identifier"
                onChange={setRecoveryForm}
                placeholder={recoveryForm.method === 'username' ? 'pilot01' : 'pilot01@aetherquest.com'}
                type={recoveryForm.method === 'email' ? 'email' : 'text'}
                value={recoveryForm.identifier}
              />
              {recoveryMessage ? <div className="auth-recovery-note">{recoveryMessage}</div> : null}
            </form>
          ) : null}

          <div className="auth-dialog-footer">
            <button
              aria-label={t('actions.login')}
              className={mode === 'login' ? 'primary-button auth-dialog-icon' : 'ghost-button auth-dialog-icon'}
              disabled={submitting}
              onClick={() => handleModeAction('login')}
              title={t('actions.login')}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                <path d="M14 4v2h4v12h-4v2h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-4Zm-1.4 3.4L11.2 8.8l2.2 2.2H4v2h9.4l-2.2 2.2 1.4 1.4L17.2 12l-4.6-4.6Z" />
              </svg>
            </button>
            <button
              aria-label={t('actions.register')}
              className={mode === 'register' ? 'primary-button auth-dialog-icon' : 'ghost-button auth-dialog-icon'}
              disabled={submitting}
              onClick={() => handleModeAction('register')}
              title={t('actions.register')}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                <path d="M15 12a4 4 0 1 0-3-6.7A4 4 0 0 0 15 12Zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Zm-8 1c-2.33 0-7 1.17-7 3.5V20h5v-2c0-1.17.6-2.17 1.63-3H7Zm11-8h-2V5h-2v2h-2v2h2v2h2V9h2V7Z" />
              </svg>
            </button>
            <button
              aria-label={t('actions.recoverPassword')}
              className={mode === 'recover' ? 'primary-button auth-dialog-icon' : 'ghost-button auth-dialog-icon'}
              disabled={submitting}
              onClick={() => handleModeAction('recover')}
              title={t('actions.recoverPassword')}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                <path d="M12 2a7 7 0 0 0-7 7h2a5 5 0 1 1 5 5 1 1 0 0 0-1 1v3h2v-2.13A7 7 0 0 0 12 2Zm-1 17h2v2h-2v-2Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
