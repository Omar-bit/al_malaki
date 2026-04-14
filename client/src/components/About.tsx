export function About() {
  return (
    <section id='about' className='px-6 pt-[8px] pb-[36px] bg-cream'>
      <div className='max-w-[1512px] mx-auto'>
        <div className='relative flex items-center justify-center mb-[53px]'>
          <div className='h-px bg-[#3F060F] w-[698px] absolute left-0'></div>
          <div className='h-px bg-[#3F060F] w-[698px] absolute right-0'></div>
          <svg
            width='38'
            height='24'
            viewBox='0 0 40 24'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            className='absolute bg-cream px-1'
          >
            <path
              d='M4.09375 19H35.9062V22.5H4.09375V19ZM36.1969 9.0625L28.125 15.65L20 4.3125L11.875 15.65L3.80312 9.0625L5.75 17.25H34.25L36.1969 9.0625Z'
              fill='#BE9D61'
            />
            <circle cx='20' cy='2' r='2' fill='#BE9D61' />
            <circle cx='4' cy='7' r='2' fill='#BE9D61' />
            <circle cx='36' cy='7' r='2' fill='#BE9D61' />
          </svg>
        </div>

        <h2 className='text-center text-[#451D1D] font-[var(--font-abril)] text-[50px] leading-[1.349] mb-[42px]'>
          ABOUT US
        </h2>

        <p className='max-w-[999px] mx-auto text-black font-[var(--font-abhaya)] text-[38px] leading-[1.18] text-center'>
          Our project emphasizes a return to nature, purity, and authentic
          flavor. Each product is carefully crafted to be healthy, nutritious,
          and valuable, supporting your daily energy, well-being, and beauty.
          More than just a product, it offers a delightful taste experience, a
          source of positive energy, and a natural elegance that reconnects you
          with the benefits of nature.
        </p>

        <div className='mt-[17px] flex justify-center'>
          <button
            type='button'
            className='w-[427px] h-[90px] rounded-[41px] text-dark-red font-[var(--font-abhaya)] font-extrabold text-[36px] leading-[1.18] border border-[#e4d8c8] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] bg-[radial-gradient(circle_at_15%_40%,rgba(196,155,92,0.22)_0,rgba(196,155,92,0)_38%),radial-gradient(circle_at_78%_62%,rgba(196,155,92,0.24)_0,rgba(196,155,92,0)_35%),#efe0c8]'
          >
            See more
          </button>
        </div>
      </div>
    </section>
  );
}
