import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setDefaultOptions } from 'date-fns';
import { es, enUS, type Locale } from 'date-fns/locale';

interface LanguageContextType {
  language: string;
  changeLanguage: (lang: string) => void;
  getDateFnsLocale: () => Locale;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || 'es');

  const getDateFnsLocale = () => {
    return language === 'en' ? enUS : es;
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
    localStorage.setItem('language', lang);
    
    // Update date-fns default locale
    setDefaultOptions({ locale: lang === 'en' ? enUS : es });
  };

  useEffect(() => {
    // Set initial date-fns locale
    setDefaultOptions({ locale: getDateFnsLocale() });
  }, [language]);

  const value = {
    language,
    changeLanguage,
    getDateFnsLocale,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};