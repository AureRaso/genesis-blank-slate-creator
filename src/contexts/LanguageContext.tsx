import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setDefaultOptions } from 'date-fns';
import { es, enUS, it, type Locale } from 'date-fns/locale';

interface LanguageContextType {
  language: string;
  changeLanguage: (lang: string) => void;
  getDateFnsLocale: () => Locale;
  isDetectingLocation: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Mapeo de países a idiomas
const COUNTRY_TO_LANGUAGE: Record<string, string> = {
  'IT': 'it',  // Italia
  'ES': 'es',  // España
  'MX': 'es',  // México
  'AR': 'es',  // Argentina
  'CO': 'es',  // Colombia
  'CL': 'es',  // Chile
  'PE': 'es',  // Perú
  'US': 'en',  // Estados Unidos
  'GB': 'en',  // Reino Unido
  'CH': 'it',  // Suiza (zona italiana)
  'SM': 'it',  // San Marino
  'VA': 'it',  // Vaticano
};

// Detectar idioma por geolocalización IP
const detectLanguageByIP = async (): Promise<string | null> => {
  try {
    // Usamos ipapi.co que es gratuito hasta 1000 req/día
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(3000) // Timeout de 3 segundos
    });

    if (!response.ok) return null;

    const data = await response.json();
    const countryCode = data.country_code;

    console.log(`[i18n] País detectado: ${countryCode} (${data.country_name})`);

    return COUNTRY_TO_LANGUAGE[countryCode] || null;
  } catch (error) {
    console.warn('[i18n] No se pudo detectar el país por IP:', error);
    return null;
  }
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || 'es');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const getDateFnsLocale = () => {
    if (language === 'en') return enUS;
    if (language === 'it') return it;
    return es;
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
    localStorage.setItem('language', lang);

    // Update date-fns default locale
    const dateFnsLocale = lang === 'en' ? enUS : lang === 'it' ? it : es;
    setDefaultOptions({ locale: dateFnsLocale });
  };

  useEffect(() => {
    // Set initial date-fns locale
    setDefaultOptions({ locale: getDateFnsLocale() });
  }, [language]);

  useEffect(() => {
    // Sync state with i18n language changes
    const handleLanguageChange = (lng: string) => {
      setLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // Detección automática por IP solo si el usuario no ha elegido idioma manualmente
  useEffect(() => {
    const detectAndSetLanguage = async () => {
      const savedLanguage = localStorage.getItem('language');

      // Si el usuario ya eligió un idioma, respetamos su elección
      if (savedLanguage) {
        console.log(`[i18n] Usando idioma guardado: ${savedLanguage}`);
        return;
      }

      setIsDetectingLocation(true);

      try {
        const detectedLang = await detectLanguageByIP();

        if (detectedLang && detectedLang !== language) {
          console.log(`[i18n] Cambiando idioma automáticamente a: ${detectedLang}`);
          changeLanguage(detectedLang);
        }
      } finally {
        setIsDetectingLocation(false);
      }
    };

    detectAndSetLanguage();
  }, []); // Solo al montar el componente

  const value = {
    language,
    changeLanguage,
    getDateFnsLocale,
    isDetectingLocation,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};