import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Header, Footer } from '../components';
import { useCart } from '../contexts/CartContext';
import { getPublicProducts } from '../services/productService';
import type { ProductAnalyticsProduct } from '../types/product';
import type {
  PackCartEntry,
  PackDraft,
  PackSelection,
  PackSizeOption,
} from '../types/pack';
import {
  PACK_DRAFT_STORAGE_KEY,
  PACK_GIFT_NOTE_MAX,
  PACK_SIZE_OPTIONS,
  getNextTier,
} from '../types/pack';

/* ────────────────────────────── helpers ────────────────────────────── */

function generatePackId() {
  return `pack-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function priceOf(product: ProductAnalyticsProduct) {
  return product.discountPrice ?? product.price;
}

function toSelection(product: ProductAnalyticsProduct): PackSelection {
  return {
    productId: product.id,
    name: product.name,
    image: product.images?.[0] ?? '',
    price: priceOf(product),
    slug: product.slug,
  };
}

function loadDraft(): PackDraft | null {
  try {
    const raw = localStorage.getItem(PACK_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as PackDraft;
    if (!PACK_SIZE_OPTIONS.some((o) => o.slots === draft.slots)) return null;
    if (!Array.isArray(draft.selections)) return null;
    return draft;
  } catch {
    return null;
  }
}

function saveDraft(draft: PackDraft | null) {
  try {
    if (draft) {
      localStorage.setItem(PACK_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } else {
      localStorage.removeItem(PACK_DRAFT_STORAGE_KEY);
    }
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/* ────────────────────────────── ornaments ───────────────────────────── */

function CrownMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 16'
      fill='currentColor'
      className={className}
      aria-hidden='true'
    >
      <path d='M2.2 14.4h19.6a.6.6 0 0 0 .59-.71l-1.6-9.2a.5.5 0 0 0-.83-.28l-4.4 3.9-3.13-6.4a.5.5 0 0 0-.9 0L8.4 8.11 4 4.21a.5.5 0 0 0-.83.28l-1.6 9.2a.6.6 0 0 0 .59.71Z' />
    </svg>
  );
}

function JarIcon({
  className = '',
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox='0 0 24 32'
      fill='none'
      className={className}
      style={style}
      aria-hidden='true'
    >
      <rect
        x='7.2'
        y='1.4'
        width='9.6'
        height='3.4'
        rx='1.2'
        fill='currentColor'
        opacity='.75'
      />
      <path
        d='M6.4 7.2h11.2a2.2 2.2 0 0 1 2.2 2.2v17.4a3.4 3.4 0 0 1-3.4 3.4H7.6a3.4 3.4 0 0 1-3.4-3.4V9.4a2.2 2.2 0 0 1 2.2-2.2Z'
        fill='currentColor'
        opacity='.28'
      />
      <path
        d='M6.4 7.2h11.2a2.2 2.2 0 0 1 2.2 2.2v17.4a3.4 3.4 0 0 1-3.4 3.4H7.6a3.4 3.4 0 0 1-3.4-3.4V9.4a2.2 2.2 0 0 1 2.2-2.2Z'
        stroke='currentColor'
        strokeWidth='1.4'
      />
      <path
        d='M8.6 15.4h6.8'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
        opacity='.6'
      />
    </svg>
  );
}

/** Thin gold rule with a centred diamond — used to separate sections. */
function GoldRule({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden='true'>
      <span className='h-px flex-1 bg-gradient-to-r from-transparent to-[#be9d61]/50' />
      <span className='size-1.5 rotate-45 bg-[#be9d61]/70' />
      <span className='h-px flex-1 bg-gradient-to-l from-transparent to-[#be9d61]/50' />
    </div>
  );
}

/* ─────────────────────────── size selection ─────────────────────────── */

function SizeCard({
  option,
  index,
  onSelect,
}: {
  option: PackSizeOption;
  index: number;
  onSelect: (option: PackSizeOption) => void;
}) {
  const { t } = useTranslation();
  return (
    <motion.button
      type='button'
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.55,
        delay: 0.12 * index,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -6 }}
      onClick={() => onSelect(option)}
      className={`group relative flex flex-col items-center overflow-hidden rounded-[28px] border bg-[#fdf8f0] px-6 pb-8 pt-11 text-center transition-shadow duration-300 hover:shadow-[0_18px_44px_-18px_rgba(63,6,15,0.4)] ${
        option.highlight
          ? 'border-[#be9d61] shadow-[0_10px_30px_-16px_rgba(63,6,15,0.35)]'
          : 'border-[#be9d61]/40'
      }`}
    >
      {option.highlight && (
        <span className='absolute right-0 top-0 rounded-bl-2xl bg-[#be9d61] px-4 py-1.5 font-aboreto text-[10px] uppercase tracking-[0.18em] text-[#fdf8f0]'>
          {t('customize_pack.most_gifted')}
        </span>
      )}

      {/* Jar cluster */}
      <div className='mb-6 flex items-end justify-center gap-1.5 text-[#be9d61]'>
        {Array.from({ length: option.slots }).map((_, i) => (
          <JarIcon
            key={i}
            className='w-6 transition-transform duration-300 group-hover:-translate-y-1'
            // stagger the lift so the cluster ripples on hover
            style={{ transitionDelay: `${i * 45}ms` }}
          />
        ))}
      </div>

      <h3 className='font-augent text-[34px] leading-none text-dark-red'>
        {option.label}
      </h3>

      <p className='mt-2.5 font-aboreto text-[11px] uppercase tracking-[0.22em] text-[#8a6f57]'>
        {t('customize_pack.jars', { count: option.slots })}
      </p>

      <p className='mt-4 font-bona text-[15px] italic leading-snug text-[#6f5541]'>
        {t(`customize_pack.size.${option.label.toLowerCase()}.tagline`)}
      </p>

      <GoldRule className='mt-6 w-full' />

      <span className='mt-6 inline-flex items-center gap-2 rounded-full border border-[#be9d61] bg-[#f8e5c6]/50 px-6 py-2 font-aboreto text-[13px] tracking-[0.12em] text-dark-red transition-colors duration-300 group-hover:bg-[#be9d61] group-hover:text-[#fdf8f0]'>
        {t('customize_pack.save_percent', { percent: option.discountPercent })}
      </span>
    </motion.button>
  );
}

function SizeSelectionView({
  onSelect,
  hasDraft,
  onResumeDraft,
}: {
  onSelect: (option: PackSizeOption) => void;
  hasDraft: boolean;
  onResumeDraft: () => void;
}) {
  const { t } = useTranslation();
  return (
    <main className='mx-auto max-w-6xl px-5 pb-10 pt-10 md:pt-20'>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className='text-center'
      >
        <CrownMark className='mx-auto w-9 text-[#be9d61]' />

        <p className='mt-5 font-aboreto text-[11px] uppercase tracking-[0.34em] text-[#8a6f57]'>
          {t('customize_pack.craft_your_own')}
        </p>

        <h1 className='mt-4 font-augent text-[46px] leading-[1.05] text-dark-red md:text-[68px]'>
          {t('customize_pack.the_royal_selection')}
        </h1>

        <p className='mx-auto mt-5 max-w-xl font-bona text-lg leading-relaxed text-[#6f5541]'>
          {t('customize_pack.selection_intro')}
        </p>

        <GoldRule className='mx-auto mt-9 max-w-xs' />
      </motion.div>

      {hasDraft && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className='mx-auto mt-9 flex max-w-md flex-col items-center gap-3 rounded-2xl border border-[#be9d61]/50 bg-[#fdf8f0] px-6 py-5 text-center'
        >
          <p className='font-bona text-[15px] text-[#6f5541]'>
            {t('customize_pack.box_in_progress')}
          </p>
          <button
            type='button'
            onClick={onResumeDraft}
            className='rounded-full bg-dark-red px-7 py-2 font-abhaya text-base font-extrabold tracking-wide text-[#fdf8f0] transition-colors hover:bg-[#5b0814]'
          >
            {t('customize_pack.resume_box')}
          </button>
        </motion.div>
      )}

      <div className='mt-14 grid grid-cols-1 gap-7 sm:grid-cols-3'>
        {PACK_SIZE_OPTIONS.map((option, index) => (
          <SizeCard
            key={option.slots}
            option={option}
            index={index}
            onSelect={onSelect}
          />
        ))}
      </div>
    </main>
  );
}

/* ───────────────────────────── the box tray ─────────────────────────── */

function SlotTray({
  slots,
  selections,
  onRemoveAt,
  onEmptySlotClick,
}: {
  slots: number;
  selections: PackSelection[];
  onRemoveAt: (index: number) => void;
  onEmptySlotClick: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`grid gap-2.5 ${slots === 6 ? 'grid-cols-3' : 'grid-cols-2'}`}
    >
      {Array.from({ length: slots }).map((_, i) => {
        const selection = selections[i];
        const isNext = i === selections.length;

        if (selection) {
          return (
            <motion.div
              key={`${selection.productId}-${i}`}
              initial={{ opacity: 0, scale: 0.86 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className='group relative aspect-square overflow-hidden rounded-2xl bg-[#2a211b] ring-1 ring-[#be9d61]/60'
            >
              {selection.image ? (
                <img
                  src={selection.image}
                  alt={selection.name}
                  className='h-full w-full object-cover'
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center px-2 text-center font-abee text-[10px] text-[#f8e5c6]'>
                  {selection.name}
                </div>
              )}

              <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-2 pb-1.5 pt-5'>
                <p className='truncate font-abee text-[10px] leading-tight text-[#fdf8f0]'>
                  {selection.name}
                </p>
                <p className='font-aboreto text-[10px] text-[#d9c08a]'>
                  {selection.price.toFixed(0)} DT
                </p>
              </div>

              <button
                type='button'
                onClick={() => onRemoveAt(i)}
                aria-label={`Remove ${selection.name}`}
                className='absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/55 opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/80 group-hover:opacity-100 focus-visible:opacity-100'
              >
                <svg
                  className='size-3 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2.4}
                    d='M6 18 18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </motion.div>
          );
        }

        return (
          <button
            key={`empty-${i}`}
            type='button'
            onClick={onEmptySlotClick}
            className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed transition-colors ${
              isNext
                ? 'border-[#be9d61] bg-[#f8e5c6]/40 text-[#be9d61]'
                : 'border-[#be9d61]/35 bg-transparent text-[#be9d61]/45 hover:border-[#be9d61]/60'
            }`}
          >
            <JarIcon className='w-5' />
            <span className='font-aboreto text-[9px] uppercase tracking-[0.14em]'>
              {isNext
                ? t('customize_pack.slot_choose')
                : t('customize_pack.slot_empty')}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ───────────────────────────── product picker ───────────────────────── */

function ProductTile({
  product,
  count,
  disabled,
  onAdd,
}: {
  product: ProductAnalyticsProduct;
  count: number;
  disabled: boolean;
  onAdd: (product: ProductAnalyticsProduct) => void;
}) {
  const price = priceOf(product);
  const hasDiscount =
    product.discountPrice != null && product.discountPrice < product.price;

  return (
    <button
      type='button'
      onClick={() => onAdd(product)}
      disabled={disabled}
      className='group relative overflow-hidden rounded-2xl border border-[#be9d61]/40 bg-[#fdf8f0] text-left transition-all duration-300 hover:border-[#be9d61] hover:shadow-[0_14px_30px_-16px_rgba(63,6,15,0.45)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#be9d61]/40 disabled:hover:shadow-none'
    >
      <div className='relative aspect-square overflow-hidden bg-[#2a211b]'>
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center text-[#be9d61]'>
            <JarIcon className='w-10' />
          </div>
        )}

        {hasDiscount && (
          <span className='absolute left-1.5 top-1.5 rounded-full bg-dark-red px-2 py-0.5 font-aboreto text-[9px] tracking-[0.1em] text-[#fdf8f0]'>
            SALE
          </span>
        )}

        {count > 0 && (
          <span className='absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-[#be9d61] font-aboreto text-[11px] text-[#fdf8f0] shadow'>
            {count}
          </span>
        )}

        {!disabled && (
          <span className='pointer-events-none absolute inset-0 flex items-center justify-center bg-dark-red/25 opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100'>
            <span className='flex size-10 items-center justify-center rounded-full border border-[#fdf8f0]/70 bg-[#be9d61]'>
              <svg
                className='size-4 text-[#fdf8f0]'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2.4}
                  d='M12 5v14m7-7H5'
                />
              </svg>
            </span>
          </span>
        )}
      </div>

      <div className='px-3 py-2.5'>
        <p className='line-clamp-1 font-bona text-[15px] leading-snug text-dark-red'>
          {product.name}
        </p>
        <div className='mt-1 flex items-baseline gap-2'>
          <span className='font-aboreto text-[13px] text-dark-red'>
            {price.toFixed(0)} DT
          </span>
          {hasDiscount && (
            <span className='font-abee text-[11px] text-[#a8907c] line-through'>
              {product.price.toFixed(0)} DT
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ──────────────────────────────── page ──────────────────────────────── */

export function CustomizePackPage() {
  const navigate = useNavigate();
  const { addPack } = useCart();
  const { t } = useTranslation();
  const pickerRef = useRef<HTMLDivElement>(null);

  const [selectedSize, setSelectedSize] = useState<PackSizeOption | null>(null);
  const [selections, setSelections] = useState<PackSelection[]>([]);
  const [giftMessage, setGiftMessage] = useState('');
  const [showGiftNote, setShowGiftNote] = useState(false);

  const [products, setProducts] = useState<ProductAnalyticsProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [draft, setDraft] = useState<PackDraft | null>(() => loadDraft());
  const [justAdded, setJustAdded] = useState(false);

  /* ── data ── */
  useEffect(() => {
    let cancelled = false;
    getPublicProducts()
      .then((data) => {
        if (cancelled) return;
        setProducts(data.filter((p) => p.status === 'active'));
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setHasLoadError(true);
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── persist the in-progress box ── */
  useEffect(() => {
    if (!selectedSize) return;
    if (selections.length === 0 && !giftMessage) {
      saveDraft(null);
      return;
    }
    saveDraft({ slots: selectedSize.slots, selections, giftMessage });
  }, [selectedSize, selections, giftMessage]);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean)),
    );
    return ['All', ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === 'All' || product.category === activeCategory;
      const matchesQuery = !query || product.name.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [products, activeCategory, searchQuery]);

  /* ── derived pricing ── */
  const slotCount = selectedSize?.slots ?? 0;
  const remaining = slotCount - selections.length;
  const isComplete = selectedSize != null && remaining === 0;

  const subtotal = selections.reduce((sum, s) => sum + s.price, 0);
  const discountAmount = selectedSize
    ? subtotal * (selectedSize.discountPercent / 100)
    : 0;
  const packTotal = subtotal - discountAmount;

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of selections)
      map.set(s.productId, (map.get(s.productId) ?? 0) + 1);
    return map;
  }, [selections]);

  /** Upsell: only worth showing once the current box is full. */
  const nextTier =
    selectedSize && isComplete ? getNextTier(selectedSize.slots) : null;

  /* ── actions ── */
  const handleSelectSize = (option: PackSizeOption) => {
    setSelectedSize(option);
    // Keep what already fits when moving between sizes.
    setSelections((prev) => prev.slice(0, option.slots));
    setJustAdded(false);
  };

  const handleResumeDraft = () => {
    if (!draft) return;
    const option = PACK_SIZE_OPTIONS.find((o) => o.slots === draft.slots);
    if (!option) return;
    setSelectedSize(option);
    setSelections(draft.selections.slice(0, option.slots));
    setGiftMessage(draft.giftMessage ?? '');
    setShowGiftNote(Boolean(draft.giftMessage));
    setDraft(null);
  };

  const handleAddProduct = useCallback(
    (product: ProductAnalyticsProduct) => {
      setSelections((prev) => {
        if (!selectedSize || prev.length >= selectedSize.slots) return prev;
        return [...prev, toSelection(product)];
      });
    },
    [selectedSize],
  );

  const handleRemoveAt = (index: number) => {
    setSelections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDecrementProduct = (productId: string) => {
    setSelections((prev) => {
      const lastIndex = prev.map((s) => s.productId).lastIndexOf(productId);
      if (lastIndex === -1) return prev;
      return prev.filter((_, i) => i !== lastIndex);
    });
  };

  const handleClearAll = () => {
    setSelections([]);
    setGiftMessage('');
    setShowGiftNote(false);
  };

  /** Fill the remaining slots, favouring featured and recommended jars. */
  const handleSurpriseMe = () => {
    if (!selectedSize || remaining <= 0 || products.length === 0) return;
    const preferred = products.filter(
      (p) => p.performance === 'featured' || p.performance === 'recommended',
    );
    const pool = preferred.length >= remaining ? preferred : products;
    const picks: PackSelection[] = [];
    for (let i = 0; i < remaining; i += 1) {
      picks.push(toSelection(pool[Math.floor(Math.random() * pool.length)]));
    }
    setSelections((prev) => [...prev, ...picks].slice(0, selectedSize.slots));
    toast.success(t('customize_pack.surprise_toast'));
  };

  const handleAddToCart = () => {
    if (!selectedSize || !isComplete) return;

    const entry: PackCartEntry = {
      packId: generatePackId(),
      slots: selectedSize.slots,
      discountPercent: selectedSize.discountPercent,
      selections,
      subtotal,
      discountAmount,
      total: packTotal,
      giftMessage: giftMessage.trim() || undefined,
    };

    addPack(entry);
    toast.success(
      t('customize_pack.added_toast', { amount: discountAmount.toFixed(2) }),
    );
    setSelections([]);
    setGiftMessage('');
    setShowGiftNote(false);
    saveDraft(null);
    setJustAdded(true);
  };

  const scrollToPicker = () => {
    pickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ── size selection screen ── */
  if (!selectedSize) {
    return (
      <div className='flex min-h-screen flex-col overflow-x-hidden bg-[#f7eee1]'>
        <Header withBackground={false} />
        <SizeSelectionView
          onSelect={handleSelectSize}
          hasDraft={draft != null && draft.selections.length > 0}
          onResumeDraft={handleResumeDraft}
        />
        <Footer />
      </div>
    );
  }

  /* ── the summary rail, reused by the desktop sidebar ── */
  const summaryPanel = (
    <div className='rounded-[26px] border border-[#be9d61]/50 bg-[#fdf8f0] p-6 shadow-[0_10px_36px_-24px_rgba(63,6,15,0.5)]'>
      <div className='flex items-baseline justify-between'>
        <h2 className='font-augent text-[26px] leading-none text-dark-red'>
          {t('customize_pack.your_box')}
        </h2>
        <span className='font-aboreto text-[12px] tracking-[0.12em] text-[#8a6f57]'>
          {selections.length}/{slotCount}
        </span>
      </div>

      {/* Progress */}
      <div className='mt-3 h-1 w-full overflow-hidden rounded-full bg-[#be9d61]/20'>
        <motion.div
          className='h-full rounded-full bg-[#be9d61]'
          animate={{ width: `${(selections.length / slotCount) * 100}%` }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <div className='mt-5'>
        <SlotTray
          slots={slotCount}
          selections={selections}
          onRemoveAt={handleRemoveAt}
          onEmptySlotClick={scrollToPicker}
        />
      </div>

      {/* Grouped contents with steppers */}
      {counts.size > 0 && (
        <div className='mt-5 space-y-1.5'>
          {Array.from(counts.entries()).map(([productId, count]) => {
            const selection = selections.find(
              (s) => s.productId === productId,
            )!;
            return (
              <div
                key={productId}
                className='flex items-center justify-between gap-3 font-bona text-[14px] text-[#5c4634]'
              >
                <span className='min-w-0 flex-1 truncate'>
                  {selection.name}
                </span>
                <div className='flex shrink-0 items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => handleDecrementProduct(productId)}
                    aria-label={`Remove one ${selection.name}`}
                    className='flex size-5 items-center justify-center rounded-full border border-[#be9d61]/60 text-[#8a6f57] transition-colors hover:bg-[#be9d61] hover:text-[#fdf8f0]'
                  >
                    <svg
                      className='size-2.5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeWidth={3}
                        d='M5 12h14'
                      />
                    </svg>
                  </button>
                  <span className='w-4 text-center font-aboreto text-[12px] text-dark-red'>
                    {count}
                  </span>
                  <span className='w-14 text-right font-aboreto text-[12px] text-dark-red'>
                    {(selection.price * count).toFixed(0)} DT
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <GoldRule className='mt-5' />

      {/* Pricing */}
      <div className='mt-5 space-y-2'>
        <div className='flex justify-between font-bona text-[15px] text-[#6f5541]'>
          <span>{t('customize_pack.subtotal')}</span>
          <span className='font-aboreto'>{subtotal.toFixed(2)} DT</span>
        </div>
        <div className='flex justify-between font-bona text-[15px] text-[#1a7a3a]'>
          <span>
            {t('customize_pack.bundle_saving', {
              percent: selectedSize.discountPercent,
            })}
          </span>
          <span className='font-aboreto'>−{discountAmount.toFixed(2)} DT</span>
        </div>
        <div className='flex items-baseline justify-between border-t border-[#be9d61]/35 pt-3'>
          <span className='font-augent text-[20px] text-dark-red'>
            {t('customize_pack.total')}
          </span>
          <span className='font-aboreto text-[22px] text-dark-red'>
            {packTotal.toFixed(2)} DT
          </span>
        </div>
      </div>

      {/* Upsell to the next tier */}
      <AnimatePresence>
        {nextTier && (
          <motion.div
            key={`upsell-${nextTier.slots}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='overflow-hidden'
          >
            <button
              type='button'
              onClick={() => handleSelectSize(nextTier)}
              className='mt-4 flex w-full items-center gap-3 rounded-2xl border border-[#be9d61] bg-[#f8e5c6]/45 px-4 py-3 text-left transition-colors hover:bg-[#f8e5c6]'
            >
              <CrownMark className='w-5 shrink-0 text-[#be9d61]' />
              <span className='font-bona text-[13px] leading-snug text-[#5c4634]'>
                {t('customize_pack.upsell', {
                  count: nextTier.slots - selectedSize.slots,
                  percent: nextTier.discountPercent,
                  label: nextTier.label,
                })}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gift note */}
      <div className='mt-4'>
        {!showGiftNote ? (
          <button
            type='button'
            onClick={() => setShowGiftNote(true)}
            className='flex items-center gap-2 font-bona text-[14px] text-[#8a6f57] underline decoration-[#be9d61]/50 underline-offset-4 transition-colors hover:text-dark-red'
          >
            <svg
              className='size-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.6}
                d='M12 8v13m0-13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 0a4 4 0 1 1 4-4 4 4 0 0 1-4 4ZM3 12h18M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7'
              />
            </svg>
            {t('customize_pack.add_gift_note')}
          </button>
        ) : (
          <div>
            <textarea
              value={giftMessage}
              onChange={(e) =>
                setGiftMessage(e.target.value.slice(0, PACK_GIFT_NOTE_MAX))
              }
              rows={3}
              placeholder={t('customize_pack.gift_note_placeholder')}
              className='w-full resize-none rounded-xl border border-[#be9d61]/60 bg-[#f8e5c6]/25 px-3 py-2 font-bona text-[14px] text-dark-red outline-none transition focus:border-[#be9d61] focus:ring-2 focus:ring-[#be9d61]/20'
            />
            <div className='mt-1 flex justify-between font-abee text-[11px] text-[#a8907c]'>
              <button
                type='button'
                onClick={() => {
                  setShowGiftNote(false);
                  setGiftMessage('');
                }}
                className='hover:text-dark-red'
              >
                {t('customize_pack.remove_note')}
              </button>
              <span>
                {giftMessage.length}/{PACK_GIFT_NOTE_MAX}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <button
        type='button'
        onClick={isComplete ? handleAddToCart : scrollToPicker}
        className={`mt-5 w-full rounded-full py-3.5 font-abhaya text-[17px] font-extrabold tracking-wide transition-all duration-300 ${
          isComplete
            ? 'bg-dark-red text-[#fdf8f0] hover:bg-[#5b0814] hover:shadow-[0_12px_28px_-14px_rgba(63,6,15,0.8)]'
            : 'border border-[#be9d61] bg-transparent text-[#8a6f57] hover:bg-[#f8e5c6]/50'
        }`}
      >
        {isComplete
          ? t('customize_pack.add_to_cart_cta', { total: packTotal.toFixed(2) })
          : t('customize_pack.choose_more', { count: remaining })}
      </button>

      {selections.length > 0 && (
        <button
          type='button'
          onClick={handleClearAll}
          className='mt-3 w-full font-abee text-[12px] text-[#a8907c] transition-colors hover:text-dark-red'
        >
          {t('customize_pack.clear_box')}
        </button>
      )}
    </div>
  );

  return (
    <div className='flex min-h-screen flex-col overflow-x-hidden bg-[#f7eee1]'>
      <main className='mx-auto w-full max-w-7xl flex-grow px-5 pb-10 pt-10  lg:pb-20'>
        {/* Title row */}
        <div className='mb-8 flex flex-wrap items-center justify-between gap-4'>
          <div>
            <button
              type='button'
              onClick={() => {
                setSelectedSize(null);
                setJustAdded(false);
              }}
              className='mb-3 inline-flex items-center gap-1.5 font-aboreto text-[11px] uppercase tracking-[0.16em] text-[#8a6f57] transition-colors hover:text-dark-red'
            >
              <svg
                className='size-3'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2.4}
                  d='M15 19l-7-7 7-7'
                />
              </svg>
              {t('customize_pack.all_box_sizes')}
            </button>

            <h1 className='font-augent text-[38px] leading-none text-dark-red md:text-[48px]'>
              {t('customize_pack.the_box', { label: selectedSize.label })}
            </h1>
          </div>

          {/* Size switcher */}
          <div className='flex items-center gap-1.5 rounded-full border border-[#be9d61]/45 bg-[#fdf8f0] p-1.5'>
            {PACK_SIZE_OPTIONS.map((option) => (
              <button
                key={option.slots}
                type='button'
                onClick={() => handleSelectSize(option)}
                className={`rounded-full px-4 py-1.5 font-aboreto text-[11px] tracking-[0.1em] transition-colors ${
                  option.slots === selectedSize.slots
                    ? 'bg-dark-red text-[#fdf8f0]'
                    : 'text-[#8a6f57] hover:bg-[#f8e5c6]/60'
                }`}
              >
                {option.label.toUpperCase()} · {option.discountPercent}%
              </button>
            ))}
          </div>
        </div>

        {/* Just-added confirmation */}
        <AnimatePresence>
          {justAdded && (
            <motion.div
              key='just-added'
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className='mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#be9d61] bg-[#f8e5c6]/50 px-6 py-4'
            >
              <p className='flex items-center gap-2.5 font-bona text-[15px] text-[#5c4634]'>
                <CrownMark className='w-5 text-[#be9d61]' />
                {t('customize_pack.box_in_cart')}
              </p>
              <div className='flex gap-2.5'>
                <button
                  type='button'
                  onClick={() => setJustAdded(false)}
                  className='rounded-full border border-dark-red px-5 py-1.5 font-abhaya text-[15px] font-bold text-dark-red transition-colors hover:bg-dark-red hover:text-[#fdf8f0]'
                >
                  {t('customize_pack.build_another')}
                </button>
                <button
                  type='button'
                  onClick={() => navigate('/checkout')}
                  className='rounded-full bg-dark-red px-5 py-1.5 font-abhaya text-[15px] font-bold text-[#fdf8f0] transition-colors hover:bg-[#5b0814]'
                >
                  {t('customize_pack.checkout')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className='flex flex-col gap-8 lg:flex-row'>
          {/* Desktop sidebar */}
          <aside className='hidden lg:block lg:w-[350px] lg:shrink-0'>
            <div className='sticky top-24'>{summaryPanel}</div>
          </aside>

          {/* Picker */}
          <section ref={pickerRef} className='min-w-0 flex-1 scroll-mt-24'>
            <div className='mb-5 flex flex-wrap items-center justify-between gap-3'>
              <h2 className='font-augent text-[26px] leading-none text-dark-red'>
                {t('customize_pack.the_collection')}
              </h2>

              <div className='flex items-center gap-2.5'>
                {remaining > 0 && products.length > 0 && (
                  <button
                    type='button'
                    onClick={handleSurpriseMe}
                    className='inline-flex items-center gap-1.5 rounded-full border border-[#be9d61] px-4 py-1.5 font-aboreto text-[11px] tracking-[0.1em] text-[#8a6f57] transition-colors hover:bg-[#be9d61] hover:text-[#fdf8f0]'
                  >
                    <CrownMark className='w-3.5' />
                    {t('customize_pack.surprise_me')}
                  </button>
                )}

                <div className='relative'>
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('customize_pack.search_placeholder')}
                    aria-label={t('customize_pack.search_label')}
                    className='h-9 w-44 rounded-full border border-[#be9d61]/50 bg-[#fdf8f0] pl-8 pr-3 font-bona text-[14px] text-dark-red outline-none transition focus:border-[#be9d61] focus:ring-2 focus:ring-[#be9d61]/15'
                  />
                  <svg
                    className='pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8a6f57]'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z'
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Category pills */}
            {categories.length > 2 && (
              <div className='mb-5 flex flex-wrap gap-2'>
                {categories.map((category) => (
                  <button
                    key={category}
                    type='button'
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-full px-4 py-1.5 font-bona text-[13px] transition-colors ${
                      activeCategory === category
                        ? 'bg-dark-red text-[#fdf8f0]'
                        : 'border border-[#be9d61]/45 text-[#8a6f57] hover:border-[#be9d61] hover:text-dark-red'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}

            {/* Grid */}
            {isLoading ? (
              <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4'>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className='animate-pulse overflow-hidden rounded-2xl border border-[#be9d61]/25 bg-[#fdf8f0]'
                  >
                    <div className='aspect-square bg-[#e8dbc8]' />
                    <div className='space-y-2 px-3 py-3'>
                      <div className='h-3 w-3/4 rounded bg-[#e8dbc8]' />
                      <div className='h-3 w-1/3 rounded bg-[#e8dbc8]' />
                    </div>
                  </div>
                ))}
              </div>
            ) : hasLoadError ? (
              <p className='rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-bona text-[15px] text-red-700'>
                {t('customize_pack.load_error')}
              </p>
            ) : filteredProducts.length === 0 ? (
              <div className='rounded-2xl border border-dashed border-[#be9d61]/50 px-6 py-16 text-center'>
                <JarIcon className='mx-auto w-9 text-[#be9d61]/50' />
                <p className='mt-4 font-bona text-[15px] text-[#8a6f57]'>
                  {t('customize_pack.no_results')}
                </p>
              </div>
            ) : (
              <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4'>
                {filteredProducts.map((product) => (
                  <ProductTile
                    key={product.id}
                    product={product}
                    count={counts.get(product.id) ?? 0}
                    disabled={remaining <= 0}
                    onAdd={handleAddProduct}
                  />
                ))}
              </div>
            )}

            {/* Mobile summary lives inline under the grid */}
            <div className='mt-8 lg:hidden'>{summaryPanel}</div>
          </section>
        </div>
      </main>

      {/* Mobile sticky bar */}
      <div className='fixed inset-x-0 bottom-0 z-20 border-t border-[#be9d61]/50 bg-[#fdf8f0]/95 px-5 py-3 backdrop-blur-md lg:hidden'>
        <div className='flex items-center justify-between gap-4'>
          <div className='min-w-0'>
            <p className='font-aboreto text-[10px] uppercase tracking-[0.14em] text-[#8a6f57]'>
              {t('customize_pack.jars_count', {
                selected: selections.length,
                total: slotCount,
              })}
            </p>
            <p className='font-aboreto text-[17px] text-dark-red'>
              {packTotal.toFixed(2)} DT
            </p>
          </div>
          <button
            type='button'
            onClick={isComplete ? handleAddToCart : scrollToPicker}
            className={`shrink-0 rounded-full px-7 py-2.5 font-abhaya text-[15px] font-extrabold tracking-wide transition-colors ${
              isComplete
                ? 'bg-dark-red text-[#fdf8f0]'
                : 'border border-[#be9d61] text-[#8a6f57]'
            }`}
          >
            {isComplete
              ? t('customize_pack.add_to_cart')
              : t('customize_pack.jars_to_go', { count: remaining })}
          </button>
        </div>
      </div>

      <div className='hidden lg:block'>
        <Footer />
      </div>
    </div>
  );
}
