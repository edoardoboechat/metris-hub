import { useI18n } from '../../i18n/I18nProvider';

export default function AppModal({ cancelLabel, confirmLabel, description, onCancel, onConfirm, open, title, variant = 'default', children }) {
  const { t } = useI18n();

  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div aria-modal="true" className={`modal-card modal-${variant}`} role="dialog">
        <div className="modal-body">
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
          {children}
        </div>
        <div className="modal-actions">
          <button className="ghost-button" onClick={onCancel} type="button">
            {cancelLabel || t('actions.cancel')}
          </button>
          <button className={variant === 'danger' ? 'secondary-button' : 'primary-button'} onClick={onConfirm} type="button">
            {confirmLabel || t('actions.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
