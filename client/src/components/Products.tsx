export function Products() {
  const products = [
    { id: '1', name: 'Name of product' },
    { id: '2', name: 'Name of product' },
    { id: '3', name: 'Name of product' },
  ];

  return (
    <section id='products' className='bg-cream px-6 pt-[46px] pb-[72px]'>
      <div className='max-w-[1512px] mx-auto'>
        <h2 className='text-center text-[#451D1D] font-[var(--font-abril)] text-[50px] leading-[1.349] mb-[55px]'>
          PRODUCTS
        </h2>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-[47px] justify-items-center mb-[92px]'>
          {products.map((product) => (
            <article key={product.id} className='w-[406px]'>
              <div className='w-[406px] h-[406px] bg-[#D9D9D9]'></div>
              <h3 className='text-center mt-[23px] text-black font-[var(--font-abhaya)] text-[36px] leading-[1.18]'>
                {product.name}
              </h3>
              <div className='flex justify-center mt-[19px]'>
                <button
                  type='button'
                  className='w-[279px] h-[56px] rounded-[41px] border border-[#3F060F] bg-[#F1E2CB] text-[#370D0F] font-[var(--font-abhaya)] font-extrabold text-[24px] leading-[1.18]'
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
