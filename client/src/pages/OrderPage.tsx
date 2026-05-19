import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, CreditCard } from 'lucide-react';
import { Header, GuestModal } from '../components';
import { useAuth, useCart } from '../contexts';
import type { CartItem } from '../contexts/CartContext';

type Step = 'shipping' | 'payment';
type PaymentMethod = 'cash' | 'card';

interface ShippingFormState {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  postalCode: string;
}

interface PaymentFormState {
  nameOnCard: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}

const INITIAL_SHIPPING_FORM: ShippingFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  address: '',
  city: '',
  postalCode: '',
};

const INITIAL_PAYMENT_FORM: PaymentFormState = {
  nameOnCard: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
};

function formatTotal(value: number) {
  return `${Math.round(value)} dt`;
}

function OrderSummaryItem({ item }: { item: CartItem }) {
  return (
    <div className='flex items-center gap-3 rounded-2xl border border-[#ba8f7b] bg-[#fbf4ea] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]'>
      <div className='h-13 w-13 shrink-0 overflow-hidden rounded-lg bg-[#27221f]'>
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className='h-full w-full object-cover'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-linear-to-br from-[#2f2923] to-[#101010] text-[10px] font-abee text-[#f8e7cf]'>
            No image
          </div>
        )}
      </div>

      <div className='min-w-0 flex-1 font-bona text-dark-red leading-tight'>
        <p className='truncate text-[14px] font-medium'>{item.name}</p>
        <p className='text-[11px] leading-none text-[#8e6f55]'>
          Quantity: {item.quantity}
        </p>
        <p className='text-[12px] leading-tight'>
          Price : {formatTotal(item.price * item.quantity)}
        </p>
      </div>
    </div>
  );
}

export function OrderPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { items, totalPrice } = useCart();
  const [step, setStep] = useState<Step>('shipping');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [shippingForm, setShippingForm] = useState<ShippingFormState>(
    INITIAL_SHIPPING_FORM,
  );
  const [paymentForm, setPaymentForm] =
    useState<PaymentFormState>(INITIAL_PAYMENT_FORM);

  useEffect(() => {
    if (!user) {
      setShippingForm(INITIAL_SHIPPING_FORM);
      setPaymentForm(INITIAL_PAYMENT_FORM);
      return;
    }

    setShippingForm((current) => ({
      ...current,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      phoneNumber: user.phoneNumber ?? '',
    }));
  }, [user]);

  const subtotal = totalPrice;
  const promoDiscount = 0;
  const pointsDiscount = 0;
  const totalWithPromo = subtotal - promoDiscount;
  const finalTotal = totalWithPromo - pointsDiscount;

  const handleContinue = () => {
    setStep('payment');
  };

  const handleConfirm = () => {
    navigate('/dashboard');
  };

  const handleShippingFieldChange = (
    field: keyof ShippingFormState,
    value: string,
  ) => {
    setShippingForm((current) => ({ ...current, [field]: value }));
  };

  const handlePaymentFieldChange = (
    field: keyof PaymentFormState,
    value: string,
  ) => {
    setPaymentForm((current) => ({ ...current, [field]: value }));
  };

  const renderShippingForm = () => (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-2.5'>
        <label className='block'>
          <span className='mb-1.5 block font-bona text-[17px] text-[#6d232f]'>
            Full name
          </span>
          <input
            value={shippingForm.firstName}
            onChange={(event) =>
              handleShippingFieldChange('firstName', event.target.value)
            }
            className='h-8.5 w-full rounded-[10px] border border-[#ba8f7b] bg-transparent px-3 font-bona text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10'
          />
        </label>

        <label className='block'>
          <span className='mb-1.5 block font-bona text-[17px] text-[#6d232f]'>
            Last name
          </span>
          <input
            value={shippingForm.lastName}
            onChange={(event) =>
              handleShippingFieldChange('lastName', event.target.value)
            }
            className='h-8.5 w-full rounded-[10px] border border-[#ba8f7b] bg-transparent px-3 font-bona text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10'
          />
        </label>
      </div>

      <label className='block'>
        <span className='mb-1.5 block font-bona text-[17px] text-[#6d232f]'>
          Email
        </span>
        <input
          value={shippingForm.email}
          onChange={(event) =>
            handleShippingFieldChange('email', event.target.value)
          }
          className='h-8.5 w-full rounded-[10px] border border-[#ba8f7b] bg-transparent px-3 font-bona text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10'
        />
      </label>

      <label className='block'>
        <span className='mb-1.5 block font-bona text-[17px] text-[#6d232f]'>
          Phone number
        </span>
        <input
          value={shippingForm.phoneNumber}
          onChange={(event) =>
            handleShippingFieldChange('phoneNumber', event.target.value)
          }
          className='h-8.5 w-full rounded-[10px] border border-[#ba8f7b] bg-transparent px-3 font-bona text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10'
        />
      </label>

      <label className='block'>
        <span className='mb-1.5 block font-bona text-[17px] text-[#6d232f]'>
          Address
        </span>
        <input
          value={shippingForm.address}
          onChange={(event) =>
            handleShippingFieldChange('address', event.target.value)
          }
          className='h-8.5 w-full rounded-[10px] border border-[#ba8f7b] bg-transparent px-3 font-bona text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10'
        />
      </label>

      <div className='grid grid-cols-2 gap-2.5'>
        <label className='block'>
          <span className='mb-1.5 block font-bona text-[17px] text-[#6d232f]'>
            City
          </span>
          <input
            value={shippingForm.city}
            onChange={(event) =>
              handleShippingFieldChange('city', event.target.value)
            }
            className='h-8.5 w-full rounded-[10px] border border-[#ba8f7b] bg-transparent px-3 font-bona text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10'
          />
        </label>

        <label className='block'>
          <span className='mb-1.5 block font-bona text-[17px] text-[#6d232f]'>
            Postal code
          </span>
          <input
            value={shippingForm.postalCode}
            onChange={(event) =>
              handleShippingFieldChange('postalCode', event.target.value)
            }
            className='h-8.5 w-full rounded-[10px] border border-[#ba8f7b] bg-transparent px-3 font-bona text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10'
          />
        </label>
      </div>

      <div className='pt-2 text-center'>
        <button
          type='button'
          onClick={handleContinue}
          className='inline-flex min-w-41 justify-center rounded-full bg-[#5b0814] px-8 py-2.5 font-bona text-[16px] text-[#fdf7ef] transition-transform hover:scale-[1.01]'
        >
          Continue to payment
        </button>
      </div>
    </div>
  );

  const renderPaymentForm = () => (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-2.5'>
        <button
          type='button'
          onClick={() => setPaymentMethod('cash')}
          className={`flex h-12.5 items-center justify-center gap-3 rounded-[14px] border px-4 font-bona text-[16px] transition-colors ${paymentMethod === 'cash' ? 'border-[#ba8f7b] bg-[#f8f1e6] text-dark-red' : 'border-[#ba8f7b] bg-transparent text-dark-red'}`}
        >
          <Banknote className='h-6 w-6' strokeWidth={1.6} />
          Payment on delivery
        </button>

        <button
          type='button'
          onClick={() => setPaymentMethod('card')}
          className={`flex h-12.5 items-center justify-center gap-3 rounded-[14px] border px-4 font-bona text-[16px] transition-colors ${paymentMethod === 'card' ? 'border-[#c9a04d] bg-[#c9a04d] text-[#fdf7ef]' : 'border-[#ba8f7b] bg-transparent text-dark-red'}`}
        >
          <CreditCard className='h-6 w-6' strokeWidth={1.8} />
          Bank card
        </button>
      </div>

      <h2 className='pt-1 text-center font-bona text-[24px] font-bold text-dark-red'>
        Payment details
      </h2>

      <label className='block'>
        <span className='mb-1.5 block font-bona text-[17px] text-[#6d232f]'>
          Name on card
        </span>
        <input
          value={paymentForm.nameOnCard}
          onChange={(event) =>
            handlePaymentFieldChange('nameOnCard', event.target.value)
          }
          className='h-8.5 w-full rounded-[10px] border border-[#ba8f7b] bg-transparent px-3 font-bona text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10'
        />
      </label>

      <label className='block'>
        <span className='mb-1.5 block font-bona text-[17px] text-[#6d232f]'>
          Card number
        </span>
        <input
          value={paymentForm.cardNumber}
          onChange={(event) =>
            handlePaymentFieldChange('cardNumber', event.target.value)
          }
          className='h-8.5 w-full rounded-[10px] border border-[#ba8f7b] bg-transparent px-3 font-bona text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10'
        />
      </label>

      <div className='grid grid-cols-2 gap-2.5'>
        <label className='block'>
          <span className='mb-1.5 block font-bona text-[17px] text-[#6d232f]'>
            Expiry
          </span>
          <input
            value={paymentForm.expiry}
            onChange={(event) =>
              handlePaymentFieldChange('expiry', event.target.value)
            }
            className='h-8.5 w-full rounded-[10px] border border-[#ba8f7b] bg-transparent px-3 font-bona text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10'
          />
        </label>

        <label className='block'>
          <span className='mb-1.5 block font-bona text-[17px] text-[#6d232f]'>
            CVC
          </span>
          <input
            value={paymentForm.cvc}
            onChange={(event) =>
              handlePaymentFieldChange('cvc', event.target.value)
            }
            className='h-8.5 w-full rounded-[10px] border border-[#ba8f7b] bg-transparent px-3 font-bona text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10'
          />
        </label>
      </div>

      <div className='pt-2 text-center'>
        <button
          type='button'
          onClick={handleConfirm}
          className='inline-flex min-w-41 justify-center rounded-full bg-[#5b0814] px-8 py-2.5 font-bona text-[16px] text-[#fdf7ef] transition-transform hover:scale-[1.01]'
        >
          Confirm
        </button>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen bg-[#f7eddc] text-dark-red'>
      <Header withBackground={false} />

      {!isLoading && !user && <GuestModal forceOpen blocking />}

      <main className='mx-auto max-w-272 px-4 pb-10 pt-24 md:pt-28'>
        <div className='grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_360px] lg:items-start'>
          <section className='rounded-[22px] border border-[#ba8f7b] bg-[#f8f1e6] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]'>
            <div className='flex items-center gap-3'>
              <button
                type='button'
                onClick={() => setStep('shipping')}
                className={`flex-1 rounded-xl border border-[#ba8f7b] py-2 text-[16px] font-bona transition-colors ${step === 'shipping' ? 'bg-[#c9a04d] text-[#fdf7ef]' : 'bg-[#f6efe4] text-dark-red'}`}
              >
                Shipping
              </button>
              <button
                type='button'
                onClick={() => setStep('payment')}
                className={`flex-1 rounded-xl border border-[#ba8f7b] py-2 text-[16px] font-bona transition-colors ${step === 'payment' ? 'bg-[#c9a04d] text-[#fdf7ef]' : 'bg-[#f6efe4] text-dark-red'}`}
              >
                Payment
              </button>
            </div>

            <div className='px-2 pb-1 pt-4'>
              <h1 className='text-center font-bona text-[23px] font-bold text-[#5b0814]'>
                {step === 'shipping' ? 'Shipping adress' : 'Payment details'}
              </h1>

              <div className='pt-3'>
                {step === 'shipping'
                  ? renderShippingForm()
                  : renderPaymentForm()}
              </div>
            </div>
          </section>

          <aside className='rounded-[22px] border border-[#ba8f7b] bg-[#f8f1e6] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]'>
            <div className='relative overflow-hidden rounded-[18px] border border-[#ba8f7b] bg-[#f6ecdd] p-3'>
              <div
                className='absolute inset-0 opacity-30'
                style={{
                  backgroundImage: "url('/src/assets/honey-pattern.png')",
                  backgroundRepeat: 'repeat',
                  backgroundSize: '360px auto',
                }}
              />
              <div className='relative z-10'>
                <h2 className='text-center font-bona text-[22px] font-bold text-[#5b0814]'>
                  Your order
                </h2>

                <div className='mt-3 space-y-2'>
                  {items.length > 0 ? (
                    items.map((item) => (
                      <OrderSummaryItem key={item.id} item={item} />
                    ))
                  ) : (
                    <div className='rounded-2xl border border-[#ba8f7b] bg-[#fbf4ea] px-4 py-8 text-center font-bona text-[14px] text-[#6d232f]'>
                      Your cart is empty.
                    </div>
                  )}
                </div>

                <div className='mt-4 border-t border-[#ba8f7b]/55 pt-3 font-bona text-[13px] text-[#5d3f2a]'>
                  <div className='flex items-center justify-between py-1.5'>
                    <span>Initial total</span>
                    <span>{formatTotal(subtotal)}</span>
                  </div>
                  <div className='flex items-center justify-between py-1.5'>
                    <span>Total with promo</span>
                    <span>{formatTotal(totalWithPromo)}</span>
                  </div>
                  <div className='flex items-center justify-between py-1.5'>
                    <span>Points</span>
                    <span>{formatTotal(pointsDiscount)}</span>
                  </div>
                  <div className='mt-2 flex items-center justify-between border-t border-[#ba8f7b]/55 pt-3 text-[14px] font-bold text-dark-red'>
                    <span>Total</span>
                    <span>{formatTotal(finalTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
