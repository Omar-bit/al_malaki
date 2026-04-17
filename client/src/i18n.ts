import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translations
const resources = {
  en: {
    translation: {
      header: {
        home: 'Home',
        about: 'About us',
        products: 'Products',
        customize: 'Customize pack',
        lang: 'Ar',
      },
      hero: {
        welcome: 'Welcome to',
        al_malaki: 'AL MALAKI',
      },
      products: {
        title: 'Products',
        name: 'Name of product',
        button: 'Show details',
      },
      about: {
        title: 'About us',
        text: 'Our project emphasizes a return to nature, purity, and authentic flavor. Each product is carefully crafted to be healthy, nutritious, and valuable, supporting your daily energy, well-being, and beauty. More than just a product, it offers a delightful taste experience, a source of positive energy, and a natural elegance that reconnects you with the benefits of nature.',
        button: 'See more',
      },
      follow: {
        title: 'Follow us',
      },
      login: {
        title: 'Log in',
        no_account: "Don't you have an account ?",
        sign_up: 'Sign up',
        email: 'Email',
        email_placeholder: 'Enter your email',
        password: 'Password',
        password_placeholder: 'Enter your password',
        show_password: 'Show password',
        hide_password: 'Hide password',
        forgot_password: 'Forgot password?',
        loading: 'Signing in...',
        success: 'Login successful. Welcome back!',
        generic_error: 'Unable to sign in. Please check your credentials.',
      },
      register: {
        title: 'Create an account',
        has_account: 'Already have an account ?',
        login_link: 'Login',
        name: 'Name',
        name_placeholder: 'Enter your name',
        name_required: 'Please enter your name',
        full_name_required: 'Please enter your first and last name',
        phone: 'Phone number',
        phone_placeholder: 'Enter your phone number',
        email: 'Email',
        email_placeholder: 'Enter your email',
        email_required: 'Please enter your email first',
        password: 'Password',
        password_placeholder: 'Enter your password',
        show_password: 'Show password',
        hide_password: 'Hide password',
        confirm_password: 'Confirm Password',
        confirm_password_placeholder: 'Confirm your password',
        password_mismatch: 'Passwords do not match',
        otp: 'OTP code',
        otp_placeholder: 'Enter 6-digit code',
        otp_required: 'Please enter the OTP code',
        request_otp: 'Send OTP',
        resend_otp: 'Resend OTP',
        requesting_otp: 'Sending...',
        otp_sent: 'OTP code sent successfully',
        otp_expiry_notice: 'Code expires in about {{minutes}} minute(s).',
        submit: 'Sign up',
        loading: 'Creating account...',
        success: 'Account created successfully. Welcome!',
        generic_error: 'Unable to create account. Please try again.',
      },
      dashboard: {
        title: 'Dashboard',
        subtitle: 'Welcome to your dashboard.',
        coming_soon:
          'This is a placeholder page. Your account features will appear here soon.',
      },
    },
  },
  ar: {
    translation: {
      header: {
        home: 'الرئيسية',
        about: 'تعرف علينا',
        products: 'منتجاتنا',
        customize: 'تخصيص',
        lang: 'En',
      },
      hero: {
        welcome: 'مرحباً بكم في',
        al_malaki: 'AL MALAKI',
      },
      products: {
        title: 'منتجاتنا',
        name: 'Name of product',
        button: 'Show details',
      },
      about: {
        title: 'تعرف علينا',
        text: 'في مشروعنا الجديد، اخترنا نرجعو للأصل، للطبيعة، للنقي، وللنكهة اللي تحسّها من أول مغرفة. كل منتج نعملوه بنية إنه يكون نظيف، مغذي، وذو قيمة، يعاونك على صحتك، جمالك، طاقتك، وتوازنك اليومي. مشروعنا ماهوش كان بيع، هو تجربة تذوق، طاقة إيجابية، وعودة للطبيعة بنكهة راقية. خلي طاقتك ترتفع، وجمالك يبان، وصحتك تتحسن، من قلب العسل ومن خير الطبيعة.',
        button: 'عرض المزيد',
      },
      follow: {
        title: 'Follow us',
      },
      login: {
        title: 'تسجيل الدخول',
        no_account: 'أليس لديك حساب؟',
        sign_up: 'سجل الآن',
        email: 'البريد الإلكتروني',
        email_placeholder: 'أدخل بريدك الإلكتروني',
        password: 'كلمة المرور',
        password_placeholder: 'أدخل كلمة المرور',
        show_password: 'إظهار كلمة المرور',
        hide_password: 'إخفاء كلمة المرور',
        forgot_password: 'نسيت كلمة المرور ؟',
        loading: 'جاري تسجيل الدخول...',
        success: 'تم تسجيل الدخول بنجاح. أهلاً بعودتك!',
        generic_error: 'تعذر تسجيل الدخول. يرجى التحقق من بياناتك.',
      },
      register: {
        title: 'إنشاء حساب',
        has_account: 'هل لديك حساب بالفعل؟',
        login_link: 'تسجيل الدخول',
        name: 'الاسم',
        name_placeholder: 'أدخل اسمك',
        name_required: 'يرجى إدخال الاسم',
        full_name_required: 'يرجى إدخال الاسم الأول واسم العائلة',
        phone: 'رقم الهاتف',
        phone_placeholder: 'أدخل رقم هاتفك',
        email: 'البريد الإلكتروني',
        email_placeholder: 'أدخل بريدك الإلكتروني',
        email_required: 'يرجى إدخال بريدك الإلكتروني أولاً',
        password: 'كلمة المرور',
        password_placeholder: 'أدخل كلمة المرور',
        show_password: 'إظهار كلمة المرور',
        hide_password: 'إخفاء كلمة المرور',
        confirm_password: 'تأكيد كلمة المرور',
        confirm_password_placeholder: 'أكد كلمة المرور',
        password_mismatch: 'كلمتا المرور غير متطابقتين',
        otp: 'رمز التحقق',
        otp_placeholder: 'أدخل الرمز من 6 أرقام',
        otp_required: 'يرجى إدخال رمز التحقق',
        request_otp: 'إرسال الرمز',
        resend_otp: 'إعادة إرسال الرمز',
        requesting_otp: 'جارٍ الإرسال...',
        otp_sent: 'تم إرسال رمز التحقق بنجاح',
        otp_expiry_notice: 'تنتهي صلاحية الرمز خلال حوالي {{minutes}} دقيقة.',
        submit: 'إنشاء حساب',
        loading: 'جارٍ إنشاء الحساب...',
        success: 'تم إنشاء الحساب بنجاح. أهلاً بك!',
        generic_error: 'تعذر إنشاء الحساب. يرجى المحاولة مرة أخرى.',
      },
      dashboard: {
        title: 'لوحة التحكم',
        subtitle: 'مرحباً بك في لوحة التحكم الخاصة بك.',
        coming_soon: 'هذه صفحة تجريبية مؤقتة. ستظهر ميزات الحساب هنا قريباً.',
      },
    },
  },
};

const savedLanguage = localStorage.getItem('language') || 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage, // default language from localStorage or 'en'
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

// Save language to localStorage whenever it changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
});

export default i18n;
