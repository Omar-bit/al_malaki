import crown from './../assets/crown.svg';
import honeyPattern from './../assets/honey_pattern.png';
export function About() {
  return (
    <section id='about' className='bg-cream px-6 '>
      <div className='mx-auto w-full '>
        <div className='relative flex items-center justify-center'>
          <div className='absolute left-0 h-[2px] w-[45%] bg-dark-red'></div>
          <div className='absolute right-0 h-[2px] w-[45%] bg-dark-red'></div>
          <img src={crown} alt='crown' className='z-10 ' />
        </div>

        <h2 className=' text-center font-[var(--font-abril)] font-italic text-[36px] md:text-[55px] font-bold leading-[1] tracking-wide text-dark-red  uppercase'>
          About us
        </h2>

        <p className='mx-auto max-w-[1100px] text-center font-[var(--font-abhaya)] text-xl md:text-3xl leading-[1.5] text-black mt-10 tracking-wide'>
          Our project emphasizes a return to nature, purity, and authentic
          flavor. Each product is carefully crafted to be healthy, nutritious,
          and valuable, supporting your daily energy, well-being, and beauty.
          More than just a product, it offers a delightful taste experience, a
          source of positive energy, and a natural elegance that reconnects you
          with the benefits of nature.
        </p>

        <div className='mt-5 flex justify-center'>
          <button
            type='button'
            className='px-13 tracking-wide py-4 cursor-pointer rounded-[41px] border border-[#e4d8c8] font-[var(--font-abhaya)] text-2xl leading-[1.02] font-extrabold text-dark-red shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] '
            style={{
              backgroundImage: 'url(/honey_pattern.png)',
              backgroundSize: 'cover',
            }}
          >
            See more
          </button>
        </div>
      </div>
    </section>
  );
}
