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

// Initialize i18next with enhanced configuration
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
    ns: ['common', 'auth', 'settings', 'tabs', 'profile', 'notifications'],
    // Enhanced configuration for better fallback handling
    saveMissing: true,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      console.warn(`Missing translation key: ${key} for language: ${lng}`);
      return fallbackValue || key;
    },
    // Ensure proper plural handling
    pluralSeparator: '_',
    contextSeparator: '_'
  });

// Add custom plural rule handler
i18next.services.pluralResolver.addRule('en', (n: number) => getPluralForm('en', n));
i18next.services.pluralResolver.addRule('de', (n: number) => getPluralForm('de', n));

type Language = 'en' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TFunction;
  // Enhanced translation function with better fallback handling
  tSafe: (key: string, options?: any) => string;
  // Function to check if a translation key exists
  hasTranslation: (key: string) => boolean;
  // Function to get text length for layout calculations
  getTextLength: (key: string, options?: any) => number;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');
  const { t } = useTranslation(['common', 'auth', 'settings', 'tabs', 'profile', 'notifications']);

  // Enhanced translation function with better fallback handling
  const tSafe = (key: string, options?: any): string => {
    try {
      const translation = t(key, options);
      // If the translation is the same as the key, it means the key wasn't found
      if (translation === key) {
        console.warn(`Translation key not found: ${key}, falling back to English`);
        // Try to get the English translation as fallback
        const englishTranslation = i18next.t(key, { ...options, lng: 'en' });
        return englishTranslation !== key ? englishTranslation : key;
      }
      return translation;
    } catch (error) {
      console.error(`Error translating key: ${key}`, error);
      return key;
    }
  };

  // Check if a translation key exists
  const hasTranslation = (key: string): boolean => {
    try {
      const translation = t(key);
      return translation !== key;
    } catch {
      return false;
    }
  };

  // Get text length for layout calculations
  const getTextLength = (key: string, options?: any): number => {
    try {
      const translation = tSafe(key, options);
      return translation.length;
    } catch {
      return key.length;
    }
  };

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
    t,
    tSafe,
    hasTranslation,
    getTextLength
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