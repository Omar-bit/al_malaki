export function Hero() {
  return (
    <section
      id='home'
      className='relative h-screen w-full overflow-hidden bg-cover bg-center bg-no-repeat'
      style={{
        backgroundImage: 'url(/hero-bg.png)',
      }}
    >
      <div className='relative mx-auto h-full w-full '>
        <div className='absolute left-4 top-[150px] md:left-10 md:top-[280px] sm:left-[80px] lg:left-[150px] lg:top-[250px]'>
          <p className='text-[#efe0c9] font-italic text-[40px] md:text-[62px] leading-[1.178] sm:text-[78px] lg:text-[72px]'>
            Welcome to
          </p>
        </div>

        <div className='absolute left-4 top-[220px] md:left-6 md:top-[392px] sm:left-[80px] lg:left-[114px] lg:top-[375px]'>
          <h1
            className='text-[#efe0c9] font-italic text-[48px] md:text-[76px] leading-[1.178] tracking-[0.03em] sm:text-[100px] lg:text-[105px]'
            style={{ WebkitTextStroke: '0.7px #f8e5c6' }}
          >
            AL MALAKI
          </h1>
        </div>
      </div>
    </section>
  );
}
