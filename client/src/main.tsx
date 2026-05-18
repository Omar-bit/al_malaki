import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App.tsx';
import { AuthProvider, CartProvider } from './contexts';
import { CartModal } from './components';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <CartProvider>
      <App />
      <CartModal />
    </CartProvider>
  </AuthProvider>,
);
