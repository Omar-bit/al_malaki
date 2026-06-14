import { Header, Hero, Products, About, Follow, Footer, GuestModal } from '../components';

export function LandingPage() {
  return (
    <div className='relative bg-cream overflow-x-hidden'>
      <Header withBackground={false} />
      <GuestModal />
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
