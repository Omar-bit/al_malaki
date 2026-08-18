import { lazy, Suspense, useEffect } from 'react';
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
  ProductsPage,
  ProductDetailsPage,
  OrderPage,
  OrderConfirmationPage,
  NotificationsPage,
  CustomizePackPage,
} from './pages';

// Admin pages are code-split so customers never download the admin bundle
// (which pulls in chart.js and the analytics dashboards).
const AdminManagementPage = lazy(() =>
  import('./pages/admin/AdminManagementPage').then((m) => ({
    default: m.AdminManagementPage,
  })),
);
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  })),
);
const AdminAnalyticsPage = lazy(() =>
  import('./pages/admin/AdminAnalyticsPage').then((m) => ({
    default: m.AdminAnalyticsPage,
  })),
);
const AdminInfluencerTrackingPage = lazy(() =>
  import('./pages/admin/AdminInfluencerTrackingPage').then((m) => ({
    default: m.AdminInfluencerTrackingPage,
  })),
);
const AdminPromoCodesPage = lazy(() =>
  import('./pages/admin/AdminPromoCodesPage').then((m) => ({
    default: m.AdminPromoCodesPage,
  })),
);
const AdminAddProductPage = lazy(() =>
  import('./pages/admin/AdminAddProductPage').then((m) => ({
    default: m.AdminAddProductPage,
  })),
);
const AdminOrdersPage = lazy(() =>
  import('./pages/admin/AdminOrdersPage').then((m) => ({
    default: m.AdminOrdersPage,
  })),
);
const AdminLoyaltyPage = lazy(() =>
  import('./pages/admin/AdminLoyaltyPage').then((m) => ({
    default: m.AdminLoyaltyPage,
  })),
);
const AdminMessagesPage = lazy(() =>
  import('./pages/admin/AdminMessagesPage').then((m) => ({
    default: m.AdminMessagesPage,
  })),
);
const AdminHistoryPage = lazy(() =>
  import('./pages/admin/AdminHistoryPage').then((m) => ({
    default: m.AdminHistoryPage,
  })),
);
import {
  AdminRoute,
  CartModal,
  CustomerChatWidget,
  GuestRoute,
  InfluencerTrackingBootstrap,
  ProductTour,
} from './components';
import { FullPageSpinner } from './components/ui/Spinner';

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.dir = 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <BrowserRouter>
      <InfluencerTrackingBootstrap />
      <Toaster
        position='bottom-left'
        toastOptions={{
          duration: 3000,
          style: {
            background: '#3f060f',
            color: '#fdf8f0',
            fontFamily: 'ABeeZee, sans-serif',
          },
        }}
      />
      <CartModal />
      <CustomerChatWidget />
      <ProductTour />
      <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/products' element={<ProductsPage />} />
        <Route path='/products/:slug' element={<ProductDetailsPage />} />
        <Route path='/customize-pack' element={<CustomizePackPage />} />
        <Route path='/checkout' element={<OrderPage />} />
        <Route path='/order' element={<OrderPage />} />
        <Route path='/order-confirmation' element={<OrderConfirmationPage />} />

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
        <Route path='/notifications' element={<NotificationsPage />} />

        {/* Protected Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path='/admin/dashboard' element={<AdminDashboardPage />} />
          <Route path='/admin/analytics' element={<AdminAnalyticsPage />} />
          <Route
            path='/admin/influencers'
            element={<AdminInfluencerTrackingPage />}
          />
          <Route path='/admin/products/new' element={<AdminAddProductPage />} />
          <Route path='/admin/management' element={<AdminManagementPage />} />
          <Route path='/admin/loyalty' element={<AdminLoyaltyPage />} />
          <Route path='/admin/promo-codes' element={<AdminPromoCodesPage />} />
          <Route path='/admin/orders' element={<AdminOrdersPage />} />
          <Route path='/admin/messages' element={<AdminMessagesPage />} />
          <Route path='/admin/history' element={<AdminHistoryPage />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
