import { createContext, useContext, useMemo, useState } from 'react';
import { defaultLocale, supportedLocales, translations } from './translations';

const LANGUAGE_STORAGE_KEY = 'aether.quest.locale';

const I18nContext = createContext(null);

function resolveInitialLocale() {
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && translations[stored]) {
    return stored;
  }
  return defaultLocale;
}

function resolvePath(locale, key) {
  return key.split('.').reduce((current, part) => current?.[part], translations[locale]);
}

function interpolate(template, values) {
  if (typeof template !== 'string') {
    return template;
  }

  return template.replace(/\{\{(.*?)\}\}/g, (_, token) => values?.[token.trim()] ?? '');
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(resolveInitialLocale);

  const value = useMemo(() => {
    const t = (key, values) => {
      const message = resolvePath(locale, key) ?? resolvePath(defaultLocale, key) ?? key;
      return interpolate(message, values);
    };

    const setLocale = (nextLocale) => {
      if (!translations[nextLocale]) {
        return;
      }
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
      setLocaleState(nextLocale);
    };

    return {
      locale,
      setLocale,
      supportedLocales,
      t,
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
