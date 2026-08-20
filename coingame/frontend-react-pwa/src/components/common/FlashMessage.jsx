import { useEffect } from 'react';
import { useI18n } from '../../i18n/I18nProvider';

export default function FlashMessage({ message, onClose }) {
  const { t } = useI18n();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onClose();
    }, 10000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [message, onClose]);

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      <div className={`flash ${message.type || 'info'}`}>
        <div className="flash-body">
          <span className="flash-badge">{message.type || 'info'}</span>
          <span>{message.text}</span>
        </div>
        <button onClick={onClose} type="button">
          {t('actions.close')}
        </button>
      </div>
    </div>
  );
}
