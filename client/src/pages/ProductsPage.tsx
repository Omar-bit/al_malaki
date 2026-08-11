import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Header, Footer, ProductCard } from '../components';
import { FilterBar } from '../components/ui/FilterBar';
import { usePublicProducts } from '../hooks/usePublicProducts';
import featured1 from '../assets/products/featured1.jpg';
import featured2 from '../assets/products/featured2.jpg';

const INITIAL_DISPLAY_COUNT = 6;

export function ProductsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const { products: allProducts, categories, isLoading } = usePublicProducts();
  const products = allProducts.filter((p) => p.status === 'active');

  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const categoryOptions = categories.map((c) => ({
    value: c.name,
    label: c.name,
  }));

  const bestSeller = useMemo(
    () =>
      products.find((p) => p.performance === 'featured') ??
      products.find((p) => p.performance === 'recommended') ??
      products[0],
    [products],
  );


  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = activeCategory
        ? product.category === activeCategory
        : true;
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const displayedProducts = showAll
    ? filteredProducts
    : filteredProducts.slice(0, INITIAL_DISPLAY_COUNT);

  const hasMore = !showAll && filteredProducts.length > INITIAL_DISPLAY_COUNT;

  return (
    <div className='relative bg-[#e5dccb] min-h-screen overflow-x-hidden flex flex-col'>
      <Header />

      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className='products-hero min-h-screen px-10 md:px-16 py-14 md:py-20 relative'>
        <div className='max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-10'>
          {/* Left: headline */}
          <div className='flex-1 max-w-xl absolute top-35 left-15'>
            <h1
              className={`${i18n.language === 'ar' ? 'font-amiri' : 'font-augent'} text-[42px] md:text-5xl leading-[1.1] text-dark-red text-center`}
            >
              {t(
                'productsPage.heroTitle',
                'Born from flowers,\nBottled with care',
              )}
            </h1>
            <p className='mt-5 font-bona text-base md:text-lg text-black leading-relaxed text-center'>
              {t(
                'productsPage.heroSubtitle',
                "Born from nature's finest flowers, our honey brings pure \n sweetness, authenticity, and golden richness to every drop.",
              )
                .split('\n')
                .map((line, index) => (
                  <span key={index}>
                    {line}
                    <br />
                  </span>
                ))}
            </p>
          </div>
        </div>
      </section>

      {/* ── Best Seller Section ───────────────────────────────────── */}
      {bestSeller && (
        <section
          className='bg-white px-10 md:px-16 py-14 md:py-16 min-h-screen'
          onClick={() => navigate(`/products/${bestSeller.slug}`)}
        >
          <div className='max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 cursor-pointer'>
            <div className='flex-1'>
              <h2
                className={`${i18n.language === 'ar' ? 'font-amiri' : 'font-augent'} text-[38px] md:text-[58px] text-dark-red leading-tight text-center`}
              >
                {t('productsPage.bestSellerTitle', 'Our best seller')}
              </h2>
              <p className='mt-5 font-abhaya text-base md:text-lg text-dark-red/60 text-center'>
                {bestSeller.name}
              </p>
              {bestSeller.description && (
                <p className='mt-3 font-bona text-sm md:text-base text-black/60 text-center leading-relaxed max-w-md mx-auto'>
                  {bestSeller.description}
                </p>
              )}
            </div>

            <div className='flex-1 flex justify-center'>
              {bestSeller.images[0] ? (
                <img
                  src={bestSeller.images[0]}
                  alt={bestSeller.name}
                  className='object-cover rounded-tl-[50%] rounded-br-[50%] size-[400px]'
                />
              ) : (
                <div className='size-[400px] animate-pulse rounded-tl-[50%] rounded-br-[50%] bg-[#2a2a2a]' />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Products Grid ─────────────────────────────────────────── */}
      <main className='grow bg-[#f9f4ec] px-10 md:px-16 pt-14 pb-10'>
        {isLoading ? (
          <div className='flex justify-center items-center h-64'>
            <div className='text-dark-red text-xl font-abhaya'>Loading...</div>
          </div>
        ) : (
          <>
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={activeCategory}
              onCategoryChange={(cat) => {
                setActiveCategory(cat);
                setShowAll(false);
              }}
              categoryOptions={categoryOptions}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 justify-items-center'>
              {displayedProducts.map((product) => (
                <div key={product.id} className='w-full max-w-95'>
                  <ProductCard
                    name={product.name}
                    image={product.images[0]}
                    slug={product.slug}
                  />
                </div>
              ))}

              {filteredProducts.length === 0 && (
                <div className='col-span-1 md:col-span-2 lg:col-span-3 text-center text-dark-red py-10 font-abhaya text-lg'>
                  {t(
                    'products.noResults',
                    'No products found matching your criteria.',
                  )}
                </div>
              )}
            </div>

            {hasMore && (
              <div className='flex justify-center mt-10'>
                <button
                  type='button'
                  onClick={() => setShowAll(true)}
                  className='font-abhaya text-dark-red text-lg font-semibold hover:underline underline-offset-4 transition-all'
                >
                  {t('products.seeAll', 'See All')} &rarr;
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Featured Section ──────────────────────────────────────── */}

      <section className='bg-white  w-full  px-5 md:px-16  md:py-16 min-h-screen'>
        <div className=' mx-auto flex flex-col items-center md:flex-row md:items-end gap-10 md:px-30 '>
          {/* Left: title + bio */}
          <div className='flex-1 '>
            {/* <h2
              className={`${i18n.language === 'ar' ? 'font-amiri' : 'font-augent'} text-[38px] md:text-[58px] text-dark-red leading-tight text-center`}
            >
              {t('productsPage.bestSellerTitle', 'Our best seller')}
            </h2>
          */}

            <img
              src={featured1}
              alt=''
              className=' h-[50vh]  md:h-[75vh] w-full md:max-w-[400px]  rounded-2xl ml-auto'
            />
          </div>

          {/* Right: featured product image */}
          <div className='w-[60%] flex  flex-col items-center gap-15 h-full justify-between'>
            <p className='mt-3 font-abhaya text-base md:text-3xl text-black text-center'>
              {t(
                'productsPage.bestSellerBio',
                'A nourishing blend of pure honey and premium\n dried fruits, crafted to deliver natural energy, rich\n flavor, and wholesome goodness in every spoon.',
              )
                .split('\n')
                .map((line, index) => (
                  <span key={index}>
                    {line}
                    <br />
                  </span>
                ))}
            </p>
            {bestSeller?.images[0] ? (
              <img
                src={featured2}
                alt='featured2'
                className=' rounded-2xl max-h-[45vh] w-[75%] object-center '
              />
            ) : (
              <div className='w-full h-full animate-pulse bg-[#2a2a2a]' />
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
