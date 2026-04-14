export function Follow() {
  return (
    <section className='px-6 pb-[54px] bg-cream'>
      <div className='max-w-[1512px] mx-auto flex justify-center'>
        <div className='w-[663px] h-[603px] rounded-[66px] bg-[#EFE0C9] shadow-[0_14px_10.8px_rgba(0,0,0,0.25)] pt-[22px] px-6 text-center'>
          <p className='text-dark-red font-italic text-[64px] leading-[1.178] mb-[6px]'>
            Follow us
          </p>
          <a
            href='https://instagram.com/almalaki'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-2 text-dark-red font-[var(--font-abhaya)] text-[40px] leading-[1.18] hover:text-[#7d2b35] transition-colors'
          >
            @almalaki
            <span aria-hidden='true'>→</span>
          </a>

          <div className='w-[478px] h-[337px] bg-[#D9D9D9] mx-auto mt-[41px]'></div>
        </div>
      </div>
    </section>
  );
}
