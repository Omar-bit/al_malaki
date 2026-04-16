export function Follow() {
  return (
    <section className='bg-cream px-6 mt-5'>
      <div className='mx-auto flex w-full  justify-center'>
        <div className='h-[450px]  w-[35%]  rounded-[66px] bg-[#efe0c9] px-6  text-center shadow-[0_14px_10.8px_rgba(0,0,0,0.25)]'>
          <p className=' text-dark-red font-italic font-extralight tracking-wide text-[55px] leading-[1.07]'>
            Follow us
          </p>
          <a
            href='https://instagram.com/almalaki'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-2 font-[var(--font-abhaya)] text-[50px] leading-[1.05] text-dark-red transition-colors hover:text-[#7d2b35] lg:text-[30px]'
          >
            @almalaki
            <span aria-hidden='true'>→</span>
          </a>

          <div className='mx-auto mt-[36px] h-[250px] w-[350px]  bg-[#d9d9d9]'></div>
        </div>
      </div>
    </section>
  );
}
