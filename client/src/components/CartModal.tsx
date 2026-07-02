import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

export function CartModal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    items,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    totalPrice,
  } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [points, setPoints] = useState('');
  const [promoDiscount] = useState(0);
  const [pointsDiscount] = useState(0);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCartOpen) {
      contentRef.current?.scrollTo(0, 0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const initialTotal = totalPrice;
  const totalWithPromo = initialTotal - promoDiscount;
  const finalTotal = totalWithPromo - pointsDiscount;

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0  backdrop-blur-[10px] z-40'
        onClick={closeCart}
      />

      {/* Modal Panel */}
      <div className='fixed top-0 right-0 z-50 h-full w-full max-w-105 shadow-2xl flex flex-col overflow-hidden cart-modal-slide-in cart-container'>
        {/* Warm tint overlay so pattern doesn't overpower */}
        <div className='absolute inset-0 pointer-events-none' />

        {/* Close button */}
        <button
          onClick={closeCart}
          className='absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors'
          aria-label='Close cart'
        >
          <svg
            className='w-5 h-5'
            style={{ color: '#5a3a1a' }}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>

        {/* Scrollable content */}
        <div ref={contentRef} className='relative z-10 flex flex-col h-full  '>
          {/* ── Cart Items ── */}
          <div className=' px-5 pt-8  space-y-1 max-h-[55vh]! overflow-y-auto custom-scrollbar'>
            {items.length === 0 ? (
              <div
                className='flex flex-col items-center justify-center h-48'
                style={{ color: '#7a5c3a' }}
              >
                <svg
                  className='w-14 h-14 mb-3 opacity-40'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.5}
                    d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z'
                  />
                </svg>
                <p className='font-abee text-base'>
                  {t('cart.empty', 'Your cart is empty')}
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className='flex items-center gap-4 py-4 relative group'
                  style={{ borderBottom: '1px solid rgba(120,80,30,0.15)' }}
                >
                  {/* Product Image */}
                  <div
                    className='shrink-0 overflow-hidden'
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 8,
                      background: '#c8b89a',
                    }}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <div
                        className='w-full h-full flex items-center justify-center font-abee text-xs'
                        style={{ color: '#fff' }}
                      >
                        No img
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className='flex-1 min-w-0'>
                    {/* Name */}
                    <h4 className='font-abhaya font-semibold text-black text-xl leading-tight mb-2'>
                      {item.name}
                    </h4>

                    {/* Quantity controls — bordered, no fill */}
                    <div className='flex items-center w-fit mb-2 border-dark-red border bg-[#F8E5C6] '>
                      <button
                        onClick={() => {
                          if (item.quantity <= 1) removeFromCart(item.id);
                          else updateQuantity(item.id, item.quantity - 1);
                        }}
                        className='size-7 flex items-center justify-center font-abhaya text-2xl font-semibold hover:bg-black/5 transition-colors text-black'
                      >
                        -
                      </button>
                      <div
                        className='flex items-center justify-center font-abhaya text-black text-xl font-semibold border-r border-l border-dark-red px-3'
                        style={{ minWidth: 32 }}
                      >
                        {item.quantity}
                      </div>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className='size-7 flex items-center justify-center font-abhaya text-xl font-semibold hover:bg-black/5 transition-colors text-black'
                      >
                        +
                      </button>
                    </div>

                    {/* Price */}
                    <p className='font-abhaya  text-lg font-semibold text-black'>
                      {t('cart.price', 'Price')} :{' '}
                      <span className='font-normal'>
                        {' '}
                        {(item.price * item.quantity).toFixed(0)} dt
                      </span>
                    </p>
                  </div>

                  {/* Remove (hover) */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className='absolute top-2 right-1 w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10'
                    aria-label='Remove item'
                    style={{ color: '#7a5230' }}
                  >
                    <svg
                      className='w-3 h-3'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M6 18L18 6M6 6l12 12'
                      />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* ── Bottom Section ── */}
          {items.length > 0 && (
            <div className='px-5 py-3 space-y-2'>
              {/* Promo Code */}
              <div className='flex gap-3'>
                <input
                  type='text'
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder={t('cart.promoPlaceholder', 'Code promo')}
                  className='flex-1 px-4 py-2.5 font-nova text-base focus:outline-none border border-dark-red rounded-lg text-[#000000]/68 bg-[#FCF8F2]/35'
                />
                <button className='px-7 py-2.5 font-nova text-sm font-semibold bg-[#BE9D61] text-white rounded-lg transition-opacity hover:opacity-90'>
                  {t('cart.apply', 'Apply')}
                </button>
              </div>

              {/* Points */}
              <div className='flex gap-3'>
                <input
                  type='text'
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder={t('cart.pointsPlaceholder', 'Points')}
                  className='flex-1 px-4 py-2.5 font-nova text-base focus:outline-none border border-dark-red rounded-lg text-[#000000]/68 bg-[#FCF8F2]/35'
                />
                <button className='px-7 py-2.5 font-nova text-sm font-semibold bg-[#BE9D61] text-white rounded-lg transition-opacity hover:opacity-90'>
                  {t('cart.apply', 'Apply')}
                </button>
              </div>

              {/* Total basket heading */}
              <h3 className='text-center text-2xl pt-2 text-[#000000] font-abhaya font-semibold'>
                {t('cart.totalBasket', 'Total basket')}
              </h3>

              {/* Rows */}
              <div className='space-y-0 px-5'>
                {/* Initial total */}
                <div className='flex justify-between items-center py-3 text-black font-bona text-base'>
                  <span>{t('cart.initialTotal', 'Initial total')}</span>
                  <span className='text-lg font-aboreto text-black'>
                    {initialTotal.toFixed(3)} DT
                  </span>
                </div>

                <hr className='border-t border-black' />

                {/* Total with promo */}
                <div
                  className='flex justify-between items-center py-3 text-black font-bona text-base'
                  style={{
                    color: '#3a1a05',
                  }}
                >
                  <span>{t('cart.totalWithPromo', 'Total with promo')}</span>
                  <span className='text-lg font-aboreto text-black'>
                    {totalWithPromo.toFixed(3)} DT
                  </span>
                </div>

                {/* Points */}
                <div
                  className='flex justify-between items-center py-3 text-black font-bona text-base'
                  style={{
                    color: '#3a1a05',
                  }}
                >
                  <span>{t('cart.points', 'Points')}</span>
                  <span className='text-lg font-aboreto text-black'>
                    {pointsDiscount.toFixed(3)} DT
                  </span>
                </div>
                <hr className='border-t border-black' />

                {/* Total */}
                <div className='flex justify-between items-center pt-3 font-abee'>
                  <span className='font-bold text-lg font-nova text-black'>
                    {t('cart.total', 'Total')}
                  </span>
                  <span className='font-bold text-lg font-aboreto text-black'>
                    {finalTotal.toFixed(3)} DT
                  </span>
                </div>
              </div>

              {/* Checkout button — centered pill, not full-width */}
              <div className='flex justify-center pt-2'>
                <button
                  type='button'
                  onClick={() => {
                    if (items.length === 0) {
                      return;
                    }

                    closeCart();
                    navigate('/checkout');
                  }}
                  className='px-16 py-2 font-abhaya text-base font-extrabold transition-opacity hover:opacity-90'
                  style={{
                    background: '#3f060f',
                    color: '#fdf8f0',
                    borderRadius: 9999,
                    letterSpacing: '0.02em',
                  }}
                >
                  {t('cart.checkout', 'Checkout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
