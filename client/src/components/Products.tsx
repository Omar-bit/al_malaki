export function Products() {
  const products = [
    { id: '1', name: 'Name of product' },
    { id: '2', name: 'Name of product' },
    { id: '3', name: 'Name of product' },
  ];

  return (
    <section id='products' className='bg-cream p-5'>
      <div className='mx-auto w-full  space-y-15 flex items-center justify-center flex-col'>
        <h2 className=' text-center font-[var(--font-abril)] text-[40px] md:text-[50px] font-italic font-extrabold  leading-[1.1] text-dark-red '>
          Products
        </h2>

        <div className=' w-[100%] items-center justify-center  grid grid-cols-1 justify-items-center gap-10 md:grid-cols-3 md:gap-[47px]'>
          {products.map((product) => (
            <article
              key={product.id}
              className='w-full max-w-[400px] md:w-[400px] '
            >
              <div className='h-[300px] md:h-[400px]  w-full  bg-[#d9d9d9] '></div>
              <h3 className='mt-[20px] text-center font-[var(--font-abhaya)] text-3xl md:text-4xl !font-semibold font-italic leading-[1.05] text-black'>
                {product.name}
              </h3>
              <div className='mt-[15px] flex justify-center'>
                <button
                  type='button'
                  className='h-[56px] w-[279px] rounded-[41px]  bg-[#e6d7c2] font-[var(--font-abhaya)] text-lg cursor-pointer leading-[1.05] font-extrabold text-[#370d0f] hover:bg-[#e6d7c2]/90 transition duration-300'
                >
                  Show details
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
