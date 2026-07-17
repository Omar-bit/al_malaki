import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App.tsx';
import { AuthProvider, CartProvider, NotificationProvider } from './contexts';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <NotificationProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </NotificationProvider>
  </AuthProvider>,
);
