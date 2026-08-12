import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, CornerDownLeft, Sparkles } from 'lucide-react';
import { usePublicProducts } from '../hooks/usePublicProducts';
import type { ProductAnalyticsProduct } from '../types/product';
import { formatCurrency } from '../utils/format';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const MAX_RESULTS = 6;

/** Highlight the matched substring inside a product name. */
function HighlightedText({ text, query }: { text: string; query: string }) {
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;
  const index = text.toLowerCase().indexOf(trimmed.toLowerCase());
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className='bg-gold/30 text-dark-red rounded px-0.5'>
        {text.slice(index, index + trimmed.length)}
      </mark>
      {text.slice(index + trimmed.length)}
    </>
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

  if (!open) return null;

  const hasQuery = query.trim().length > 0;

  return (
    <div
      className='fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh] md:pt-[15vh]'
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-dark-red/30 backdrop-blur-md animate-in fade-in duration-200'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Command card */}
      <div className='relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[#e2cdae] bg-[#fdf8f0] shadow-2xl shadow-dark-red/20 animate-in fade-in slide-in-from-top-4 duration-300'>
        {/* Search input row */}
        <div className='flex items-center gap-3 border-b border-[#ecdcc4] px-5 py-4'>
          <Search className='h-5 w-5 shrink-0 text-dark-red' />
          <input
            ref={inputRef}
            type='text'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search for honey, packs, flavors…'
            className='flex-1 bg-transparent text-[17px] font-bona text-[#3f060f] outline-none placeholder:text-[#b09080]'
            aria-label='Search products'
          />
          {hasQuery && (
            <button
              type='button'
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className='rounded-full p-1 text-[#b09080] transition hover:bg-[#f0e4d2] hover:text-dark-red'
              aria-label='Clear search'
            >
              <X className='h-4 w-4' />
            </button>
          )}
          <button
            type='button'
            onClick={onClose}
            className='hidden shrink-0 rounded-lg border border-[#e2cdae] px-2 py-1 text-[11px] font-semibold text-[#8a745e] transition hover:bg-[#f0e4d2] md:block'
            aria-label='Close search'
          >
            ESC
          </button>
        </div>

        {/* Body */}
        <div
          ref={listRef}
          className='max-h-[52vh] overflow-y-auto overflow-x-hidden custom-scrollbar p-2'
        >
          {/* Results */}
          {hasQuery ? (
            results.length > 0 ? (
              <>
                <p className='px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[#a58a6f]'>
                  Products
                </p>
                {results.map((product, index) => (
                  <button
                    key={product.id}
                    data-index={index}
                    type='button'
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => goToProduct(product)}
                    className={`flex w-full items-center gap-4 rounded-2xl px-3 py-2.5 text-left transition ${
                      activeIndex === index
                        ? 'bg-[#f3e3cd]'
                        : 'hover:bg-[#f7ecd9]'
                    }`}
                  >
                    <div className='h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#e2cdae] bg-white'>
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <div className='flex h-full w-full items-center justify-center text-[#d8c3a6]'>
                          <Search className='h-4 w-4' />
                        </div>
                      )}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate font-bona text-[15px] font-semibold text-[#3f060f]'>
                        <HighlightedText text={product.name} query={query} />
                      </p>
                      <p className='truncate text-xs text-[#a58a6f]'>
                        {product.category}
                      </p>
                    </div>
                    <div className='shrink-0 font-aboreto text-sm text-dark-red'>
                      {formatCurrency(
                        product.discountPrice ?? product.price,
                        'TND',
                      )}
                    </div>
                    <ArrowRight
                      className={`h-4 w-4 shrink-0 transition ${
                        activeIndex === index
                          ? 'translate-x-0 text-dark-red opacity-100'
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
                  className={`mt-1 flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-3 text-left transition ${
                    activeIndex === results.length
                      ? 'bg-[#f3e3cd]'
                      : 'hover:bg-[#f7ecd9]'
                  }`}
                >
                  <span className='flex items-center gap-2 font-bona text-sm font-semibold text-dark-red'>
                    <Search className='h-4 w-4' />
                    See all results for “{query.trim()}”
                  </span>
                  <ArrowRight className='h-4 w-4 text-dark-red' />
                </button>
              </>
            ) : (
              <div className='flex flex-col items-center justify-center gap-2 px-6 py-12 text-center'>
                <div className='flex h-14 w-14 items-center justify-center rounded-full bg-[#f3e3cd]'>
                  <Search className='h-6 w-6 text-[#c9a77f]' />
                </div>
                <p className='font-bona text-[15px] font-semibold text-[#3f060f]'>
                  {isLoading ? 'Searching…' : `No results for “${query.trim()}”`}
                </p>
                {!isLoading && (
                  <p className='max-w-xs text-sm text-[#a58a6f]'>
                    Try a different keyword, or browse the full collection.
                  </p>
                )}
                {!isLoading && (
                  <button
                    type='button'
                    onClick={goToAllResults}
                    className='mt-2 inline-flex items-center gap-2 rounded-full bg-dark-red px-5 py-2 text-sm font-semibold text-white transition hover:bg-dark-red/90'
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
                  <p className='mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#a58a6f]'>
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
                        className='rounded-full border border-[#e2cdae] bg-white px-4 py-1.5 text-sm font-bona text-[#5a3d2b] transition hover:border-dark-red hover:bg-[#f7ecd9] hover:text-dark-red'
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.length > 0 && (
                <>
                  <p className='flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[#a58a6f]'>
                    <Sparkles className='h-3.5 w-3.5 text-gold' />
                    Popular right now
                  </p>
                  {suggestions.map((product) => (
                    <button
                      key={product.id}
                      type='button'
                      onClick={() => goToProduct(product)}
                      className='flex w-full items-center gap-4 rounded-2xl px-3 py-2.5 text-left transition hover:bg-[#f7ecd9]'
                    >
                      <div className='h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#e2cdae] bg-white'>
                        {product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className='h-full w-full object-cover'
                          />
                        ) : (
                          <div className='flex h-full w-full items-center justify-center text-[#d8c3a6]'>
                            <Search className='h-4 w-4' />
                          </div>
                        )}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate font-bona text-[15px] font-semibold text-[#3f060f]'>
                          {product.name}
                        </p>
                        <p className='truncate text-xs text-[#a58a6f]'>
                          {product.category}
                        </p>
                      </div>
                      <div className='shrink-0 font-aboreto text-sm text-dark-red'>
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
                <div className='px-6 py-10 text-center text-sm text-[#a58a6f]'>
                  Start typing to search our products.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer hint bar */}
        <div className='hidden items-center justify-between gap-4 border-t border-[#ecdcc4] bg-[#f9f0e2] px-5 py-2.5 text-[11px] text-[#8a745e] md:flex'>
          <div className='flex items-center gap-4'>
            <span className='flex items-center gap-1.5'>
              <kbd className='rounded border border-[#e2cdae] bg-white px-1.5 py-0.5 font-sans'>
                ↑
              </kbd>
              <kbd className='rounded border border-[#e2cdae] bg-white px-1.5 py-0.5 font-sans'>
                ↓
              </kbd>
              to navigate
            </span>
            <span className='flex items-center gap-1.5'>
              <kbd className='flex items-center rounded border border-[#e2cdae] bg-white px-1.5 py-0.5 font-sans'>
                <CornerDownLeft className='h-3 w-3' />
              </kbd>
              to select
            </span>
          </div>
          <span className='font-bona'>Al Malaki</span>
        </div>
      </div>
    </div>
  );
}
