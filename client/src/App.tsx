import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LandingPage } from './pages';

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return <LandingPage />;
}
