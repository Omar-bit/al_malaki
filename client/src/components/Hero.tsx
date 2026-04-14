export function Hero() {
  return (
    <section
      id='home'
      className='relative w-full h-[874px] bg-cover bg-center bg-no-repeat overflow-hidden'
      style={{
        backgroundImage: 'url(/hero-bg.png)',
      }}
    >
      <div className='max-w-[1512px] mx-auto relative h-full'>
        <div className='absolute left-[134px] top-[322px]'>
          <p className='text-[#EFE0C9] font-italic text-[96px] leading-[1.178]'>
            Welcome to
          </p>
        </div>

        <div className='absolute left-[134px] top-[481px]'>
          <h1
            className='text-[#EFE0C9] font-italic text-[128px] leading-[1.178] tracking-[0.015em]'
            style={{ WebkitTextStroke: '0.75px #F8E5C6' }}
          >
            AL MALAKI
          </h1>
        </div>
      </div>
    </section>
  );
}
