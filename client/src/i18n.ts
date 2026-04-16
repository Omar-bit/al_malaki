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
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
