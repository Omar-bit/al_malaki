import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import authModel from '../assets/auth-model.jpg';
export function LoginPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <div className="min-h-screen  flex flex-col font-['Abhaya_Libre'] auth-page">
      <div className='bg-transparent'>
        <Header withBackground={false} />
      </div>

      <main className='flex-1 flex items-center justify-center p-4 md:p-8'>
        <div
          className={`bg-white rounded-[32px] shadow-2xl flex flex-col md:flex-row w-full max-w-[95%] sm:max-w-[70%] md:max-w-[55%] overflow-hidden  ${isRtl ? 'md:flex-row-reverse' : ''}`}
        >
          {/* Left / Right Image Section */}
          <div className='w-full md:w-[45%] relative bg-gradient-to-b from-[#FCECD8] to-[#986E58] flex flex-col items-center justify-start p-8 min-h-[350px] md:min-h-[unset] relative'>
            <div className='absolute top-5 left-0 w-full text-center z-10'>
              <h2 className='text-3xl text-dark-red font-(--font-abhaya) mb-1'>
                {t('hero.welcome')}
              </h2>
              <h1 className='text-5xl text-dark-red font-(--font-abhaya) font-bold uppercase tracking-wider'>
                {t('hero.al_malaki')}
              </h1>
            </div>

            {/* Crown Woman Image */}
            <div className='flex-1 w-full flex items-end justify-center  absolute inset-0 z-0'>
              {/* Placeholder that can be easily replaced */}
              <img
                src={authModel}
                alt='Al Malaki'
                className='object-cover w-full  rounded-[32px] md:rounded-none h-full relative inset-0 top-0 '
                style={{
                  objectPosition: 'center top',
                  //   maskImage:
                  //     'linear-gradient(to bottom, transparent, black 20%)',
                }}
              />
            </div>
          </div>

          {/* Form Section */}
          <div className='w-full md:w-[55%] p-6 py-10 sm:p-8 md:p-16 flex flex-col justify-center bg-white relative'>
            <h2 className='text-3xl md:text-4xl text-dark-red font-(--font-abhaya) !font-extrabold text-center mb-4 md:mb-6'>
              {t('login.title')}
            </h2>

            <div className='text-center mb-6 md:mb-8 flex flex-wrap justify-center items-center gap-1 md:gap-2 text-sm md:text-md'>
              <span className='text-dark-red text-center'>
                {t('login.no_account')}
              </span>
              <a
                href='#'
                className='font-bold text-lg md:text-xl text-dark-red font-(--font-abhaya) underline decoration-dark-er underline-offset-5 tracking-wide'
              >
                {t('login.sign_up')}
              </a>
            </div>

            <form className='max-w-md mx-auto w-full space-y-6'>
              <div>
                <label className='block text-xl !font-bold text-dark-red font-(--font-abhaya) mb-2'>
                  {t('login.email')}
                </label>
                <input
                  type='email'
                  placeholder={t('login.email_placeholder')}
                  className='w-full px-6 py-4 rounded-full border border-dark-red bg-transparent text-dark-red placeholder:text-dark-red/50 focus:outline-none focus:ring-2 focus:ring-dark-red transition-all'
                  dir={isRtl ? 'rtl' : 'ltr'}
                />
              </div>

              <div>
                <label className='block text-xl !font-bold text-dark-red font-(--font-abhaya) mb-2'>
                  {t('login.password')}
                </label>
                <input
                  type='password'
                  placeholder={t('login.password_placeholder')}
                  className='w-full px-6 py-4 rounded-full border border-dark-red bg-transparent text-dark-red placeholder:text-dark-red/50 focus:outline-none focus:ring-2 focus:ring-dark-red transition-all'
                  dir={isRtl ? 'rtl' : 'ltr'}
                />
              </div>

              <div className='pt-6 flex justify-center'>
                <button
                  type='submit'
                  className='px-12 py-3 rounded-full font-serif font-bold text-dark-red bg-[#EEDCC1] bg-gradient-to-r from-[#e3caa2] to-[#eedcc1] hover:scale-105 transition-transform shadow-md'
                  style={{
                    backgroundImage: 'url(/honey_pattern.png)',
                    backgroundSize: 'cover',
                  }}
                >
                  {t('login.title')}
                </button>
              </div>

              <div className='text-center mt-4'>
                <a href='#' className='text-sm  text-dark-red hover:underline'>
                  {t('login.forgot_password')}
                </a>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Exclude Footer from standard view maybe? The design doesn't show a footer but I'll add it if it's there, let's omit for exact pixel match of the screen */}
    </div>
  );
}
