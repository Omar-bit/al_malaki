import { Header, Hero, Products, About, Follow, Footer } from '../components';

export function LandingPage() {
  return (
    <div className='relative bg-cream '>
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
