import { I18n } from 'i18n-js';
import { translations } from './translations';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { getLocales } from 'expo-localization';

// Create i18n instance
const i18n = new I18n(translations);

// Default to French as per project requirements
i18n.defaultLocale = 'FR';
i18n.locale = 'FR';
i18n.enableFallback = true;

// Language storage key
const LANGUAGE_KEY = 'user_language';

// Function to get stored language preference
export const getStoredLanguage = async (): Promise<'FR' | 'EN'> => {
  try {
    const storedLanguage = await SecureStore.getItemAsync(LANGUAGE_KEY);
    if (storedLanguage === 'FR' || storedLanguage === 'EN') {
      return storedLanguage;
    }
    
    // If no stored preference, try to use device locale
    const deviceLocale = getLocales()[0]?.languageCode;
    if (deviceLocale?.toLowerCase().startsWith('fr')) {
      return 'FR';
    }
    
    // Default to French
    return 'FR';
  } catch (error) {
    console.error('Error getting stored language:', error);
    return 'FR';
  }
};

// Function to set language preference
export const setLanguage = async (language: 'FR' | 'EN'): Promise<void> => {
  try {
    await SecureStore.setItemAsync(LANGUAGE_KEY, language);
    i18n.locale = language;
  } catch (error) {
    console.error('Error setting language:', error);
  }
};

// Initialize language from storage
export const initializeLanguage = async (): Promise<void> => {
  const language = await getStoredLanguage();
  i18n.locale = language;
};

// Hook to use translations
export const useTranslation = () => {
  const [language, setLanguageState] = useState<'FR' | 'EN'>(i18n.locale as 'FR' | 'EN');

  useEffect(() => {
    const loadLanguage = async () => {
      const storedLanguage = await getStoredLanguage();
      setLanguageState(storedLanguage);
      i18n.locale = storedLanguage;
    };

    loadLanguage();
  }, []);

  const changeLanguage = async (newLanguage: 'FR' | 'EN') => {
    await setLanguage(newLanguage);
    setLanguageState(newLanguage);
  };

  return {
    t: (key: string, options?: object) => i18n.t(key, options),
    language,
    changeLanguage,
  };
};

export default i18n;
