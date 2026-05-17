import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'react-hot-toast';
import {
  LandingPage,
  LoginPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  RegisterPage,
  VerifyEmailPage,
  DashboardPage,
  InviteAcceptPage,
  AdminManagementPage,
  ProductsPage,
} from './pages';

import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminPromoCodesPage } from './pages/admin/AdminPromoCodesPage';
import { AdminRoute, GuestRoute } from './components';

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
        <Route path='/products' element={<ProductsPage />} />

        {/* Guest Routes (Only accessible if NOT logged in) */}
        <Route element={<GuestRoute />}>
          <Route path='/login' element={<LoginPage />} />
          <Route path='/forgot-password' element={<ForgotPasswordPage />} />
          <Route path='/reset-password' element={<ResetPasswordPage />} />
          <Route path='/register' element={<RegisterPage />} />
          <Route path='/verify-email' element={<VerifyEmailPage />} />
        </Route>

        <Route path='/invite/accept' element={<InviteAcceptPage />} />

        <Route path='/dashboard' element={<DashboardPage />} />

        {/* Protected Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path='/admin/dashboard' element={<AdminDashboardPage />} />
          <Route path='/admin/analytics' element={<AdminAnalyticsPage />} />
          <Route path='/admin/management' element={<AdminManagementPage />} />
          <Route path='/admin/promo-codes' element={<AdminPromoCodesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
