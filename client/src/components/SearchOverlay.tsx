import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, ArrowRight, CornerDownLeft, Sparkles } from 'lucide-react';
import { usePublicProducts } from '../hooks/usePublicProducts';
import type { ProductAnalyticsProduct } from '../types/product';
import { formatCurrency } from '../utils/format';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const MAX_RESULTS = 6;

/** Small caps label used above each group of rows. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className='flex items-center gap-1.5 px-3 pb-1.5 pt-2 font-aboreto text-[10px] uppercase tracking-[0.2em] text-[#a58a6f]'>
      {children}
    </p>
  );
}

/** Highlight the matched substring inside a product name. */
function HighlightedText({ text, query }: { text: string; query: string }) {
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;
  const index = text.toLowerCase().indexOf(trimmed.toLowerCase());
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className='rounded-[3px] bg-gold/25 px-0.5 text-dark-red'>
        {text.slice(index, index + trimmed.length)}
      </mark>
      {text.slice(index + trimmed.length)}
    </>
  );
}

/** Product thumbnail with the warm border used across the overlay. */
function Thumbnail({ product }: { product: ProductAnalyticsProduct }) {
  return (
    <div className='h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#e8d5b8] bg-white shadow-[0_2px_6px_rgba(63,6,15,0.06)]'>
      {product.images[0] ? (
        <img
          src={product.images[0]}
          alt={product.name}
          className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
        />
      ) : (
        <div className='flex h-full w-full items-center justify-center text-[#d8c3a6]'>
          <Search className='h-4 w-4' />
        </div>
      )}
    </div>
  );
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const navigate = useNavigate();
  const { products, categories, isLoading } = usePublicProducts();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const activeProducts = useMemo(
    () => products.filter((p) => p.status === 'active'),
    [products],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return activeProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, MAX_RESULTS);
  }, [activeProducts, query]);

  // Suggested products shown when the input is empty (featured first).
  const suggestions = useMemo(() => {
    const featured = activeProducts.filter(
      (p) => p.performance === 'featured' || p.performance === 'recommended',
    );
    return (featured.length ? featured : activeProducts).slice(0, 4);
  }, [activeProducts]);

  // Reset state whenever the overlay opens, and lock body scroll.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    const timer = setTimeout(() => inputRef.current?.focus(), 60);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Keep selection in range as results change.
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const goToProduct = (product: ProductAnalyticsProduct) => {
    onClose();
    navigate(`/products/${product.slug}`);
  };

  const goToAllResults = () => {
    const q = query.trim();
    onClose();
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (results.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        e.preventDefault();
        goToAllResults();
      }
      return;
    }
    // total selectable rows = results + the "see all" row
    const total = results.length + 1;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % total);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + total) % total);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex < results.length) goToProduct(results[activeIndex]);
      else goToAllResults();
    }
  };

  // Scroll the active row into view.
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const activeEl = container.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const hasQuery = query.trim().length > 0;

  return (
    <AnimatePresence>
      {open && (
        <div
          className='fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh] md:pt-[15vh]'
          onKeyDown={handleKeyDown}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className='absolute inset-0 bg-dark-red/35 backdrop-blur-md'
            onClick={onClose}
            aria-hidden='true'
          />

          {/* Command card */}
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.985 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className='relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-[#e8d5b8] bg-[#fdf8f0] shadow-[0_32px_80px_-16px_rgba(63,6,15,0.38)]'
          >
            {/* Gold hairline */}
            <div className='h-px w-full bg-gradient-to-r from-transparent via-gold to-transparent' />

            {/* Search input row */}
            <div className='flex items-center gap-3 border-b border-[#efe0c9] bg-gradient-to-b from-[#fdf6ea] to-[#fdf8f0] px-5 py-4 md:px-6'>
              <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f3e3cd] text-dark-red'>
                <Search className='h-[18px] w-[18px]' />
              </span>

              <input
                ref={inputRef}
                type='text'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Search for honey, packs, flavors…'
                className='flex-1 bg-transparent font-bona text-[17px] text-dark-red outline-none placeholder:text-[#bfa392] md:text-[18px]'
                aria-label='Search products'
              />

              {hasQuery && (
                <button
                  type='button'
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className='rounded-full p-1.5 text-[#b09080] transition-colors hover:bg-[#f0e4d2] hover:text-dark-red'
                  aria-label='Clear search'
                >
                  <X className='h-4 w-4' />
                </button>
              )}

              <button
                type='button'
                onClick={onClose}
                className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e8d5b8] bg-white/70 text-[#8a745e] transition-colors hover:border-gold hover:bg-[#f7ecd9] hover:text-dark-red'
                aria-label='Close search'
              >
                <X className='h-4 w-4' />
              </button>
            </div>

            {/* Body */}
            <div
              ref={listRef}
              className='custom-scrollbar max-h-[52vh] overflow-x-hidden overflow-y-auto p-2'
            >
              {hasQuery ? (
                results.length > 0 ? (
                  <>
                    <SectionLabel>Products</SectionLabel>

                    {results.map((product, index) => (
                      <button
                        key={product.id}
                        data-index={index}
                        type='button'
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => goToProduct(product)}
                        className={`group flex w-full items-center gap-4 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                          activeIndex === index
                            ? 'bg-[#f6e8d2] ring-1 ring-gold/40'
                            : 'hover:bg-[#faf1e2]'
                        }`}
                      >
                        <Thumbnail product={product} />

                        <div className='min-w-0 flex-1'>
                          <p className='truncate font-bona text-[15px] font-semibold text-dark-red'>
                            <HighlightedText
                              text={product.name}
                              query={query}
                            />
                          </p>
                          <p className='truncate font-abhaya text-[13px] text-[#a58a6f]'>
                            {product.category}
                          </p>
                        </div>

                        <div className='shrink-0 font-aboreto text-[15px] text-dark-red'>
                          {formatCurrency(
                            product.discountPrice ?? product.price,
                            'TND',
                          )}
                        </div>

                        <ArrowRight
                          className={`h-4 w-4 shrink-0 transition-all duration-200 ${
                            activeIndex === index
                              ? 'translate-x-0 text-gold opacity-100'
                              : '-translate-x-1 text-transparent opacity-0'
                          }`}
                        />
                      </button>
                    ))}

                    {/* See all results */}
                    <button
                      type='button'
                      data-index={results.length}
                      onMouseEnter={() => setActiveIndex(results.length)}
                      onClick={goToAllResults}
                      className={`mt-1 flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-3 text-left transition-colors ${
                        activeIndex === results.length
                          ? 'bg-[#f6e8d2] ring-1 ring-gold/40'
                          : 'hover:bg-[#faf1e2]'
                      }`}
                    >
                      <span className='flex items-center gap-2 font-bona text-sm font-semibold text-dark-red'>
                        <Search className='h-4 w-4 text-gold' />
                        See all results for “{query.trim()}”
                      </span>
                      <ArrowRight className='h-4 w-4 text-gold' />
                    </button>
                  </>
                ) : (
                  <div className='flex flex-col items-center justify-center gap-2 px-6 py-12 text-center'>
                    <div className='flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-[#f6e8d2] to-[#eeddc0] shadow-inner'>
                      <Search className='h-6 w-6 text-[#c9a77f]' />
                    </div>
                    <p className='mt-1 font-italic text-[20px] text-dark-red'>
                      {isLoading
                        ? 'Searching…'
                        : `No results for “${query.trim()}”`}
                    </p>
                    {!isLoading && (
                      <p className='max-w-xs font-bona text-sm text-[#a58a6f]'>
                        Try a different keyword, or browse the full collection.
                      </p>
                    )}
                    {!isLoading && (
                      <button
                        type='button'
                        onClick={goToAllResults}
                        className='mt-3 inline-flex items-center gap-2 rounded-full bg-dark-red px-6 py-2.5 font-bona text-sm font-semibold text-cream shadow-[0_8px_20px_-6px_rgba(63,6,15,0.5)] transition-all hover:-translate-y-px hover:bg-dark-red/90'
                      >
                        Browse all products
                        <ArrowRight className='h-4 w-4' />
                      </button>
                    )}
                  </div>
                )
              ) : (
                /* Empty state — suggestions */
                <div className='py-1'>
                  {categories.length > 0 && (
                    <div className='px-3 pb-3 pt-2'>
                      <p className='mb-2.5 font-aboreto text-[10px] uppercase tracking-[0.2em] text-[#a58a6f]'>
                        Browse by category
                      </p>
                      <div className='flex flex-wrap gap-2'>
                        {categories.slice(0, 6).map((category) => (
                          <button
                            key={category.id}
                            type='button'
                            onClick={() => {
                              onClose();
                              navigate(
                                `/products?q=${encodeURIComponent(category.name)}`,
                              );
                            }}
                            className='rounded-full border border-[#e8d5b8] bg-white/70 px-4 py-1.5 font-bona text-sm text-[#5a3d2b] transition-colors hover:border-gold hover:bg-[#f9efdf] hover:text-dark-red'
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestions.length > 0 && (
                    <>
                      <SectionLabel>
                        <Sparkles className='h-3 w-3 text-gold' />
                        Popular right now
                      </SectionLabel>

                      {suggestions.map((product) => (
                        <button
                          key={product.id}
                          type='button'
                          onClick={() => goToProduct(product)}
                          className='group flex w-full items-center gap-4 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-[#faf1e2]'
                        >
                          <Thumbnail product={product} />

                          <div className='min-w-0 flex-1'>
                            <p className='truncate font-bona text-[15px] font-semibold text-dark-red'>
                              {product.name}
                            </p>
                            <p className='truncate font-abhaya text-[13px] text-[#a58a6f]'>
                              {product.category}
                            </p>
                          </div>

                          <div className='shrink-0 font-aboreto text-[15px] text-dark-red'>
                            {formatCurrency(
                              product.discountPrice ?? product.price,
                              'TND',
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {suggestions.length === 0 && categories.length === 0 && (
                    <div className='px-6 py-10 text-center font-bona text-sm text-[#a58a6f]'>
                      Start typing to search our products.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer hint bar */}
            <div className='hidden items-center justify-between gap-4 border-t border-[#efe0c9] bg-[#f9f0e2] px-6 py-2.5 text-[11px] text-[#8a745e] md:flex'>
              <div className='flex items-center gap-4'>
                <span className='flex items-center gap-1.5'>
                  <kbd className='rounded-md border border-[#e8d5b8] bg-white px-1.5 py-0.5 font-sans shadow-[0_1px_0_rgba(63,6,15,0.08)]'>
                    ↑
                  </kbd>
                  <kbd className='rounded-md border border-[#e8d5b8] bg-white px-1.5 py-0.5 font-sans shadow-[0_1px_0_rgba(63,6,15,0.08)]'>
                    ↓
                  </kbd>
                  to navigate
                </span>
                <span className='flex items-center gap-1.5'>
                  <kbd className='flex items-center rounded-md border border-[#e8d5b8] bg-white px-1.5 py-0.5 font-sans shadow-[0_1px_0_rgba(63,6,15,0.08)]'>
                    <CornerDownLeft className='h-3 w-3' />
                  </kbd>
                  to select
                </span>
                <span className='flex items-center gap-1.5'>
                  <kbd className='rounded-md border border-[#e8d5b8] bg-white px-1.5 py-0.5 font-sans text-[10px] shadow-[0_1px_0_rgba(63,6,15,0.08)]'>
                    ESC
                  </kbd>
                  to close
                </span>
              </div>
              <span className='font-italic tracking-[0.12em] text-dark-red/70'>
                Al Malaki
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
