import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../contexts';
import { authService } from '../services';

export function DashboardPage() {
  const { t } = useTranslation();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      navigate('/login', { replace: true });
    } catch {
      setUser(null);
      navigate('/login', { replace: true });
    }
  };
  return (
    <div className='min-h-screen bg-cream'>
      <Header />

      <main className='mx-auto max-w-4xl px-4 py-16'>
        <section className='rounded-3xl border border-dark-red/10 bg-white p-8 md:p-12 shadow-lg'>
          <h1 className='text-4xl font-(--font-abhaya) font-bold text-dark-red'>
            {t('dashboard.title')}
          </h1>
          <p className='mt-4 text-lg text-dark-red/80 font-(--font-abee)'>
            {t('dashboard.subtitle')}
          </p>
          <p className='mt-2 text-dark-red/70 font-(--font-abee)'>
            {t('dashboard.coming_soon')}
          </p>

          <button onClick={handleLogout}>sign out</button>
          <Link
            to='/'
            className='inline-flex mt-8 rounded-full bg-[#EEDCC1] px-6 py-3 text-dark-red font-semibold hover:scale-105 transition-transform'
          >
            {t('header.home')}
          </Link>
        </section>
      </main>
    </div>
  );
}
