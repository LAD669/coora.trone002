import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { getPluralForm } from '@/lib/i18n-polyfills';
import { TranslationKeys } from '@/types/translations';

// Import translations
import en from '../translations/en.json';
import de from '../translations/de.json';

const LANGUAGE_STORAGE_KEY = '@app_language';

// Initialize i18next
i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de }
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    },
    compatibilityJSON: 'v3',
    defaultNS: 'common',
    ns: ['common', 'auth', 'settings', 'tabs', 'profile', 'notifications']
  });

// Add custom plural rule handler
i18next.services.pluralResolver.addRule('en', (n: number) => getPluralForm('en', n));
i18next.services.pluralResolver.addRule('de', (n: number) => getPluralForm('de', n));

type Language = 'en' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TFunction;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');
  const { t } = useTranslation(['common', 'auth', 'settings', 'tabs', 'profile', 'notifications']);

  // Load saved language on app start
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'de')) {
          setLanguageState(savedLanguage as Language);
          await i18next.changeLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (newLanguage: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
      setLanguageState(newLanguage);
      await i18next.changeLanguage(newLanguage);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}