import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'react-hot-toast';
import {
  LandingPage,
  LoginPage,
  RegisterPage,
  VerifyEmailPage,
  DashboardPage,
} from './pages';

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.dir = 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <BrowserRouter>
      <Toaster
        position='bottom-right'
        toastOptions={{
          duration: 3000,
          style: {
            background: '#3f060f',
            color: '#fdf8f0',
            fontFamily: 'ABeeZee, sans-serif',
          },
        }}
      />
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/verify-email' element={<VerifyEmailPage />} />
        <Route path='/dashboard' element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
