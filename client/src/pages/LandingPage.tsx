import { Header, Hero, Products, About, Follow, Footer } from '../components';

export function LandingPage() {
  return (
    <div className='relative bg-cream overflow-x-hidden'>
      <Header />
      <main>
        <Hero />
        <Products />
        <About />
        <Follow />
      </main>
      <Footer />
    </div>
  );
}
