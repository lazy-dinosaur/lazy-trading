import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import i18n from '@/lib/i18n';

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'ko',
  setLanguage: () => {}
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState(() => {
    // 저장된 언어 설정이 있다면 가져옴, 없다면 기본값 'ko'
    return localStorage.getItem('language') || 'ko';
  });

  useEffect(() => {
    // 언어 변경 시 i18n 언어도 변경하고 localStorage에 저장
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
