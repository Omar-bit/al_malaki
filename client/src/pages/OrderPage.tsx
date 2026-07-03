import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, GuestModal } from '../components';
import { useAuth, useCart } from '../contexts';
import type { CartItem } from '../contexts/CartContext';
import { orderService } from '../services';
import { ApiError } from '../services/authService';

type Step = 'shipping' | 'payment';
type PaymentMethod = 'cash' | 'card';

interface ShippingFormState {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  secondPhone: string;
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
  secondPhone: '',
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
    <div className='flex items-center gap-3 rounded-4xl border border-dark-red bg-[#FFFFFF]/43 p-4 px-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]'>
      <div className='size-20 shrink-0 overflow-hidden rounded-lg bg-[#27221f] shadow-lg'>
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

      <div className='min-w-0 flex-1  text-black leading-tight font-abhaya space-y-1'>
        <p className='truncate text-lg font-medium'>{item.name}</p>
        <p className='text-base leading-none text-[#959595]'>
          Quantity: {item.quantity}
        </p>
        <p className='text-base leading-tight'>
          Price : {formatTotal(item.price * item.quantity)}
        </p>
      </div>
    </div>
  );
}

export function OrderPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<Step>('shipping');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [shippingForm, setShippingForm] = useState<ShippingFormState>(
    INITIAL_SHIPPING_FORM,
  );
  const [paymentForm, setPaymentForm] =
    useState<PaymentFormState>(INITIAL_PAYMENT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const handleConfirm = async () => {
    if (items.length === 0) return;

    if (paymentMethod === 'card') {
      // Online payment not yet implemented — placeholder guard
      setSubmitError(
        'Online card payment is not yet available. Please select payment on delivery.',
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const order = await orderService.createOrder({
        paymentMethod: 'CASH_ON_DELIVERY',
        firstName: shippingForm.firstName,
        lastName: shippingForm.lastName,
        email: shippingForm.email,
        phoneNumber: shippingForm.phoneNumber,
        secondPhone: shippingForm.secondPhone || undefined,
        address: shippingForm.address,
        city: shippingForm.city,
        postalCode: shippingForm.postalCode,
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      });

      clearCart();
      navigate('/order-confirmation', { state: { order } });
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
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
          <span className='mb-1.5 block font-bona text-lg text-dark-red'>
            Full name
          </span>
          <input
            value={shippingForm.firstName}
            onChange={(event) =>
              handleShippingFieldChange('firstName', event.target.value)
            }
            className='h-10 w-full rounded-xl border border-dark-red bg-transparent px-3 font-abee text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10 bg-[#F1E2CB21]'
          />
        </label>

        <label className='block'>
          <span className='mb-1.5 block font-bona text-lg text-dark-red'>
            Last name
          </span>
          <input
            value={shippingForm.lastName}
            onChange={(event) =>
              handleShippingFieldChange('lastName', event.target.value)
            }
            className='h-10 w-full rounded-xl border border-dark-red bg-transparent px-3 font-abee text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10 bg-[#F1E2CB21]'
          />
        </label>
      </div>

      <label className='block'>
        <span className='mb-1.5 block font-bona text-lg text-dark-red'>
          Email
        </span>
        <input
          value={shippingForm.email}
          onChange={(event) =>
            handleShippingFieldChange('email', event.target.value)
          }
          className='h-10 w-full rounded-xl border border-dark-red bg-transparent px-3 font-abee text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10 bg-[#F1E2CB21]'
        />
      </label>

      <label className='block'>
        <span className='mb-1.5 block font-bona text-lg text-dark-red'>
          Phone number
        </span>
        <input
          value={shippingForm.phoneNumber}
          onChange={(event) =>
            handleShippingFieldChange('phoneNumber', event.target.value)
          }
          className='h-10 w-full rounded-xl border border-dark-red bg-transparent px-3 font-abee text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10 bg-[#F1E2CB21]'
        />
      </label>
      <label className='block'>
        <span className='mb-1.5 block font-bona text-lg text-dark-red'>
          Second Phone number (optional)
        </span>
        <input
          value={shippingForm.secondPhone}
          onChange={(event) =>
            handleShippingFieldChange('secondPhone', event.target.value)
          }
          className='h-10 w-full rounded-xl border border-dark-red bg-transparent px-3 font-abee text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10 bg-[#F1E2CB21]'
        />
      </label>

      <label className='block'>
        <span className='mb-1.5 block font-bona text-lg text-dark-red'>
          Address
        </span>
        <input
          value={shippingForm.address}
          onChange={(event) =>
            handleShippingFieldChange('address', event.target.value)
          }
          className='h-10 w-full rounded-xl border border-dark-red bg-transparent px-3 font-abee text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10 bg-[#F1E2CB21]'
        />
      </label>

      <div className='grid grid-cols-2 gap-2.5'>
        <label className='block'>
          <span className='mb-1.5 block font-bona text-lg text-dark-red'>
            City
          </span>
          <input
            value={shippingForm.city}
            onChange={(event) =>
              handleShippingFieldChange('city', event.target.value)
            }
            className='h-10 w-full rounded-xl border border-dark-red bg-transparent px-3 font-abee text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10 bg-[#F1E2CB21]'
          />
        </label>

        <label className='block'>
          <span className='mb-1.5 block font-bona text-lg text-dark-red'>
            Postal code
          </span>
          <input
            value={shippingForm.postalCode}
            onChange={(event) =>
              handleShippingFieldChange('postalCode', event.target.value)
            }
            className='h-10 w-full rounded-xl border border-dark-red bg-transparent px-3 font-abee text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10 bg-[#F1E2CB21]'
          />
        </label>
      </div>

      <div className='pt-2 text-center'>
        <button
          type='button'
          onClick={handleContinue}
          className='inline-flex min-w-41 justify-center rounded-full bg-[#5b0814] px-12 py-2 font-bona text-[16px] text-[#fdf7ef] transition-transform hover:scale-[1.01]'
        >
          Continue to payment
        </button>
      </div>
    </div>
  );

  const renderPaymentForm = () => (
    <div className='space-y-4'>
      <div className='flex flex-col items-center justify-between gap-2'>
        <button
          type='button'
          onClick={() => setPaymentMethod('cash')}
          className={`w-[80%] items-center rounded-2xl border  py-3 text-lg  font-bona transition-colors ${paymentMethod === 'cash' ? 'bg-[#BE9D61] text-white ' : 'bg-[#F1ECE4] border-dark-red text-black  '} flex flex-col`}
        >
          <svg
            width='60'
            height='50'
            viewBox='0 0 55 60'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <g clip-path='url(#clip0_239_91)'>
              <path
                d='M28.9689 49.0001C19.7373 49.0001 10.5057 49.0001 1.28114 49.0001C0.262478 49.0001 0.0148865 48.7636 0.0148865 47.7829C0.0148865 39.0332 0.0148865 30.2904 0.0078125 21.5406C0.0078125 21.019 0.191737 20.6782 0.658624 20.4139C12.451 13.7159 24.2505 7.01102 36.0429 0.313081C36.9413 -0.194655 37.295 -0.104237 37.8115 0.77213C39.389 3.45687 40.9735 6.14161 42.5369 8.83331C42.7491 9.19498 42.9331 9.31322 43.3646 9.18803C45.3736 8.63161 47.3968 8.11691 49.4129 7.58831C50.2405 7.3727 50.5801 7.56049 50.8064 8.38122C51.8322 12.1232 52.865 15.8651 53.8554 19.614C54.011 20.2122 54.2303 20.5043 54.9094 20.4278C55.5319 20.3582 56.1686 20.4139 56.7982 20.4139C57.7178 20.4139 57.9937 20.6851 57.9937 21.5963C57.9937 28.8715 57.9937 36.1467 57.9937 43.415C57.9937 44.8478 57.9937 46.2875 57.9937 47.7203C57.9937 48.7497 57.7461 48.9931 56.7133 48.9931C47.4675 49.0001 38.2147 49.0001 28.9689 49.0001ZM56.1969 22.2014C38.0378 22.2014 19.9283 22.2014 1.80462 22.2014C1.80462 30.5616 1.80462 38.8732 1.80462 47.2265C19.9424 47.2265 38.052 47.2265 56.1969 47.2265C56.1969 38.8802 56.1969 30.5686 56.1969 22.2014ZM41.3555 14.3489C33.8005 16.3381 26.2949 18.3203 18.7823 20.2956C18.7894 20.3234 18.8035 20.3513 18.8106 20.3791C28.7921 20.3791 38.7735 20.3791 48.8328 20.3791C48.6772 19.7879 48.5215 19.2523 48.3942 18.7098C48.3235 18.3899 48.1678 18.3273 47.8283 18.2925C46.8591 18.1882 45.8546 18.1117 44.9492 17.7987C43.2726 17.2214 42.1408 15.9973 41.3555 14.3489ZM49.2643 9.43842C35.4912 13.0691 21.7958 16.6789 7.98732 20.3165C9.35969 20.3165 10.6401 20.5251 11.8285 20.2748C14.4459 19.7253 17.0138 18.9533 19.6029 18.2716C26.875 16.3589 34.14 14.4393 41.4121 12.5266C42.2327 12.311 42.5864 12.4848 42.8411 13.2012C43.7253 15.6773 45.8546 16.9084 48.4932 16.4633C49.3421 16.3172 49.618 16.4911 49.8515 17.3257C50.092 18.2021 50.3183 19.0924 50.5801 19.9618C50.6367 20.1357 50.8277 20.3721 50.9904 20.4C51.3724 20.4625 51.7685 20.4208 52.2566 20.4208C51.2521 16.7415 50.2759 13.1386 49.2643 9.43842ZM36.524 2.05886C26.8538 7.54658 17.2472 13.0065 7.6407 18.4594C7.67607 18.5359 7.70436 18.6124 7.73973 18.6959C9.09087 18.209 10.5481 17.8891 11.7861 17.2005C17.799 13.8759 23.7483 10.4469 29.7258 7.05971C30.5252 6.60762 30.8011 6.73281 31.4024 7.44225C31.8976 8.02649 32.4706 8.61074 33.1284 8.98633C34.5715 9.80705 36.0995 9.77227 37.5992 9.04892C38.3703 8.68029 38.7099 8.78462 39.1555 9.50797C39.2475 9.66099 39.3111 9.83487 39.4243 9.95311C39.5163 10.0435 39.6861 10.1339 39.7993 10.1131C40.1954 10.0366 40.5915 9.91138 41.0584 9.78618C39.5304 7.18491 38.0378 4.64622 36.524 2.05886ZM17.9193 15.7747C17.9334 15.8095 17.9476 15.8442 17.9688 15.879C23.5856 14.3975 29.2094 12.9161 34.9535 11.3998C34.7484 11.3094 34.6989 11.2746 34.6494 11.2677C32.9657 11.0868 31.5722 10.3496 30.4615 9.11152C30.1786 8.79853 29.9876 8.90982 29.7117 9.06283C26.7972 10.7251 23.8827 12.3735 20.9611 14.0289C19.9495 14.6132 18.9379 15.1974 17.9193 15.7747Z'
                fill='#521011'
              />
              <path
                d='M28.9693 46.2739C22.7371 46.2739 16.5048 46.2739 10.2726 46.2739C9.2681 46.2739 9.05588 46.0861 8.98514 45.1193C8.80829 42.685 6.88415 40.821 4.40116 40.6888C3.5735 40.6401 3.30469 40.3758 3.30469 39.5829C3.30469 36.3626 3.30469 33.1423 3.30469 29.922C3.30469 29.0248 3.53106 28.7953 4.44361 28.7257C6.99026 28.5379 8.83658 26.6948 8.99221 24.2048C9.04173 23.4049 9.31054 23.1406 10.1382 23.1406C22.7229 23.1406 35.3076 23.1406 47.8923 23.1406C48.7129 23.1406 48.9888 23.4119 49.0242 24.2117C49.1444 26.6391 51.0403 28.531 53.5233 28.7118C54.4924 28.7814 54.7188 29.0178 54.7188 29.9846C54.7188 33.1493 54.7188 36.307 54.7188 39.4716C54.7188 40.4037 54.4853 40.6401 53.5515 40.6888C51.1393 40.821 49.1798 42.7406 49.0312 45.1263C48.9746 46.0513 48.7271 46.2739 47.7933 46.2739C41.5186 46.2739 35.2439 46.2739 28.9693 46.2739ZM47.2698 44.5281C47.9277 41.5721 49.6255 39.7151 52.5824 39.0682C52.9998 38.9778 52.9361 38.7274 52.9361 38.4631C52.9361 35.9592 52.929 33.4623 52.9432 30.9584C52.9432 30.5897 52.8512 30.4298 52.4551 30.3324C49.7528 29.6856 48.0621 28.0163 47.3971 25.3663C47.3052 24.9907 47.1708 24.8794 46.7817 24.8794C34.9327 24.8864 23.0766 24.8864 11.2276 24.8794C10.8385 24.8794 10.7041 24.9977 10.6122 25.3733C9.94721 28.0232 8.25651 29.6995 5.54716 30.3324C5.15101 30.4228 5.06612 30.5967 5.06612 30.9653C5.08027 33.4692 5.08027 35.9662 5.05905 38.4701C5.05905 38.8874 5.20053 39.0056 5.60375 39.103C8.22821 39.7429 9.90476 41.3635 10.5697 43.9439C10.69 44.4099 10.8598 44.542 11.3479 44.542C23.0625 44.5281 34.7771 44.5281 46.4917 44.5281C46.7393 44.5281 46.9939 44.5281 47.2698 44.5281Z'
                fill='#521011'
              />
              <path
                d='M36.9343 34.7279C36.906 39.0541 33.3478 42.5318 28.9689 42.5179C24.5901 42.504 21.0531 38.9776 21.0743 34.6653C21.0955 30.3461 24.6608 26.8893 29.068 26.9172C33.4327 26.945 36.9626 30.4435 36.9343 34.7279ZM35.1587 34.6932C35.1233 31.3059 32.3786 28.6421 28.9548 28.6629C25.531 28.6838 22.8004 31.4242 22.8428 34.7766C22.8853 38.0804 25.6654 40.793 28.9831 40.7651C32.4211 40.7443 35.1941 38.0178 35.1587 34.6932Z'
                fill='#521011'
              />
              <path
                d='M43.7252 31.2086C45.7059 31.2225 47.2976 32.7944 47.2834 34.721C47.2693 36.6546 45.6635 38.2265 43.6969 38.2195C41.7374 38.2195 40.1387 36.6337 40.1387 34.6932C40.1457 32.7666 41.7586 31.1947 43.7252 31.2086ZM45.5008 34.721C45.5008 33.7334 44.7014 32.9544 43.704 32.9613C42.6995 32.9683 41.9001 33.7612 41.9143 34.7349C41.9284 35.6669 42.7419 36.4668 43.6828 36.4807C44.6802 36.4877 45.5008 35.6947 45.5008 34.721Z'
                fill='#521011'
              />
              <path
                d='M10.7246 34.7001C10.7246 32.7665 12.3233 31.2016 14.3041 31.2085C16.2777 31.2155 17.8765 32.7943 17.8623 34.7209C17.8482 36.6545 16.2353 38.2334 14.2758 38.2264C12.3092 38.2125 10.7246 36.6476 10.7246 34.7001ZM16.0938 34.6653C16.0726 33.6985 15.2378 32.9265 14.2333 32.9543C13.2359 32.9821 12.4719 33.7889 12.5073 34.7766C12.5426 35.7225 13.3703 36.4945 14.3182 36.4737C15.3015 36.4528 16.115 35.6251 16.0938 34.6653Z'
                fill='#521011'
              />
            </g>
            <defs>
              <clipPath id='clip0_239_91'>
                <rect width='58' height='49' fill='white' />
              </clipPath>
            </defs>
          </svg>

          <span>Payment on delivery</span>
        </button>
        <button
          type='button'
          onClick={() => setPaymentMethod('card')}
          className={`w-[80%] items-center rounded-2xl border  py-3 text-lg  font-bona transition-colors ${paymentMethod === 'card' ? 'bg-[#BE9D61] text-white ' : 'bg-[#F1ECE4] border-dark-red text-black '} flex flex-col`}
        >
          <svg
            width='60'
            height='50'
            viewBox='0 0 55 60'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <g clip-path='url(#clip0_239_84)'>
              <path
                d='M57.6998 21.5441C56.8079 21.3308 55.9938 21.1673 55.208 20.9327C55.024 20.8758 54.8258 20.57 54.8046 20.3638C54.7479 19.7879 54.7833 19.2049 54.7833 18.565C37.5038 18.565 20.2951 18.565 3.00852 18.565C2.99436 18.828 2.97312 19.0911 2.97312 19.3613C2.97312 23.5066 2.97312 27.6518 2.97312 31.7971C2.97312 34.1434 4.4526 35.6579 6.80279 35.6579C18.4617 35.665 30.1206 35.665 41.7865 35.6437C42.5369 35.6437 43.0041 35.7503 43.2731 36.5538C43.4996 37.215 43.9597 37.7981 44.3915 38.5375C44.073 38.5375 43.8394 38.5375 43.6058 38.5375C31.3098 38.5375 19.0138 38.5375 6.71076 38.5375C2.81739 38.5375 0 35.7077 0 31.8113C0 23.4639 0 15.1165 0 6.77624C0 2.90828 2.76076 0.0428686 6.61874 0.0357584C21.8312 -0.00690283 37.0366 0.00020738 52.242 0.0144278C55.4063 0.021538 57.6857 2.36791 57.6927 5.51062C57.6998 10.5731 57.6998 15.6356 57.6998 20.698C57.6998 20.9753 57.6998 21.2455 57.6998 21.5441ZM2.98728 9.33591C20.288 9.33591 37.4967 9.33591 54.7833 9.33591C54.7833 8.19828 54.7338 7.11753 54.7904 6.04388C54.8895 4.16679 53.8914 2.90117 51.6615 2.90828C36.8526 2.96516 22.0365 2.93672 7.22752 2.93672C6.8665 2.93672 6.50547 2.92961 6.15153 2.95805C4.57295 3.07182 3.12178 4.42987 3.00852 6.00833C2.92357 7.08197 2.98728 8.16984 2.98728 9.33591Z'
                fill='#521011'
              />
              <path
                d='M63.9998 31.6834C63.9998 37.3574 59.2711 41.9932 53.4593 42.0075C47.5485 42.0217 42.7207 37.3716 42.7207 31.6763C42.7207 25.981 47.5485 21.3452 53.4664 21.3594C59.264 21.3594 63.9998 26.0024 63.9998 31.6834ZM61.9823 31.7403C61.9964 27.1045 58.1951 23.3503 53.4664 23.3289C48.6599 23.3076 44.7877 27.012 44.7523 31.6479C44.7169 36.2055 48.6103 40.0024 53.339 40.0237C58.0818 40.045 61.9681 36.3264 61.9823 31.7403Z'
                fill='#521011'
              />
              <path
                d='M11.3963 23.7695C12.72 24.3383 14.2562 24.0113 15.8347 23.8691C18.1283 23.6629 19.898 24.765 20.9528 26.8411C21.8589 28.6258 21.5403 30.894 20.1812 32.3516C18.5813 34.0651 16.6205 34.5557 14.3553 33.9514C13.8881 33.8305 13.3288 33.802 12.8758 33.9442C9.86726 34.8828 6.71008 33.2403 5.91725 30.2754C5.15981 27.4242 6.98616 24.5801 10.0159 23.926C10.3911 23.8477 10.7804 23.8406 11.3963 23.7695ZM14.7163 32.963C16.3869 33.6456 18.4822 32.9986 19.629 31.4841C20.7545 29.9981 20.7262 27.929 19.5724 26.4643C18.4114 24.9925 16.3232 24.381 14.7588 25.0423C17.1797 28.0285 17.1868 30.3749 14.7163 32.963Z'
                fill='#521011'
              />
              <path
                d='M39.9106 27.2183C39.9106 28.0075 39.9106 28.7967 39.9106 29.6571C34.2192 29.6571 28.5561 29.6571 22.8223 29.6571C22.8223 28.8821 22.8223 28.0857 22.8223 27.2183C28.4854 27.2183 34.1697 27.2183 39.9106 27.2183Z'
                fill='#521011'
              />
              <path
                d='M51.7684 35.6506C53.1488 33.6171 54.4796 31.6689 55.8034 29.7207C56.4121 28.8248 57.028 27.936 57.6155 27.0259C57.9412 26.5211 58.3588 26.2224 58.9251 26.5495C59.4773 26.8695 59.5976 27.4099 59.3853 28C59.3074 28.2275 59.1517 28.4408 59.0172 28.647C56.9785 31.6546 54.9397 34.6694 52.8939 37.6699C52.2852 38.5658 51.7826 38.6298 51.018 37.9045C49.7722 36.7171 48.5263 35.5297 47.3016 34.3281C47.0751 34.1006 46.7637 33.7806 46.7778 33.5246C46.8132 33.0767 46.976 32.5292 47.2875 32.2519C47.4645 32.0884 48.1511 32.2377 48.4201 32.4723C49.5386 33.4535 50.5933 34.5201 51.7684 35.6506Z'
                fill='#521011'
              />
            </g>
            <defs>
              <clipPath id='clip0_239_84'>
                <rect width='64' height='42' fill='white' />
              </clipPath>
            </defs>
          </svg>

          <span>Bank card</span>
        </button>
      </div>

      {paymentMethod === 'card' && (
        <>
          <label className='block'>
            <span className='mb-1.5 block font-bona text-lg text-dark-red'>
              Name on card
            </span>
            <input
              value={paymentForm.nameOnCard}
              onChange={(event) =>
                handlePaymentFieldChange('nameOnCard', event.target.value)
              }
              className='h-10 w-full rounded-xl border border-dark-red  px-3 font-abee text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10 bg-[#F1E2CB]/13'
            />
          </label>

          <label className='block'>
            <span className='mb-1.5 block font-bona text-lg text-dark-red'>
              Card number
            </span>
            <input
              value={paymentForm.cardNumber}
              onChange={(event) =>
                handlePaymentFieldChange('cardNumber', event.target.value)
              }
              className='h-10 w-full rounded-xl border border-dark-red bg-transparent px-3 font-abee text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10 bg-[#F1E2CB21]'
            />
          </label>

          <div className='grid grid-cols-2 gap-2.5'>
            <label className='block'>
              <span className='mb-1.5 block font-bona text-lg text-dark-red'>
                Expiry
              </span>
              <input
                value={paymentForm.expiry}
                onChange={(event) =>
                  handlePaymentFieldChange('expiry', event.target.value)
                }
                className='h-10 w-full rounded-xl border border-dark-red bg-transparent px-3 font-abee text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10 bg-[#F1E2CB21]'
              />
            </label>

            <label className='block'>
              <span className='mb-1.5 block font-bona text-lg text-dark-red'>
                CVC
              </span>
              <input
                value={paymentForm.cvc}
                onChange={(event) =>
                  handlePaymentFieldChange('cvc', event.target.value)
                }
                className='h-10 w-full rounded-xl border border-dark-red bg-transparent px-3 font-abee text-[13px] text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/10 bg-[#F1E2CB21]'
              />
            </label>
          </div>
        </>
      )}

      <div className='pt-2 text-center'>
        {submitError && (
          <p className='mb-3 rounded-xl bg-red-100 px-4 py-2 font-abee text-sm text-red-700'>
            {submitError}
          </p>
        )}
        <button
          type='button'
          onClick={handleConfirm}
          disabled={isSubmitting}
          className='w-[50%] inline-flex min-w-41 justify-center rounded-full bg-[#5b0814] px-8 py-2.5 font-bona text-[16px] text-[#fdf7ef] transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed'
        >
          {isSubmitting ? 'Placing order...' : 'Confirm'}
        </button>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen bg-[#f7eee1] text-dark-red'>
      <Header withBackground={false} />

      {!isLoading && !user && <GuestModal forceOpen blocking />}

      <main className='mx-auto max-w-272 px-4 pb-10 pt-24 md:pt-28'>
        <div className='flex flex-col md:flex-row  justify-between items-stretch gap-5 lg:items-stretch relative'>
          <section className='flex-1 md:min-w-[55%] rounded-[22px] border border-dark-red bg-[#f9f2e8]  p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]'>
            <div className='flex items-center justify-center gap-10 w-full '>
              <button
                type='button'
                onClick={() => setStep('shipping')}
                className={`w-[40%] rounded-2xl border  py-2 text-[16px]  font-bona transition-colors ${step === 'shipping' ? 'bg-[#BE9D61] text-white font-bold' : 'bg-[#F1ECE4] border-dark-red text-black font-normal'}`}
              >
                Shipping
              </button>
              <button
                type='button'
                onClick={() => setStep('payment')}
                className={`w-[40%] rounded-2xl border  py-2 text-[16px] font-bona transition-colors ${step === 'payment' ? 'bg-[#BE9D61] text-white font-bold' : 'bg-[#F1ECE4] border-dark-red text-black font-normal'}`}
              >
                Payment
              </button>
            </div>

            <div className='px-2 pb-1 pt-4'>
              <h1 className='text-center font-bona text-[23px] font-bold text-dark-red'>
                {step === 'shipping' ? 'Shipping adress' : 'Payment details'}
              </h1>

              <div className='pt-5'>
                {step === 'shipping'
                  ? renderShippingForm()
                  : renderPaymentForm()}
              </div>
            </div>
          </section>

          <aside className='flex-1 h-full min-w-[40%] relative overflow-hidden rounded-[18px] border border-dark-red bg-[#f6ecdd] p-4'>
            <div
              className='absolute inset-0 opacity-60'
              style={{
                backgroundImage: "url('/src/assets/honey-pattern.png')",
                backgroundRepeat: 'repeat',
                backgroundSize: '360px auto',
              }}
            />
            <div className='relative z-10'>
              <h2 className='text-center font-bona text-[23px] font-bold text-dark-red '>
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

              <div className='mt-4   font-bona text-base text-[#000000]'>
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
                <div className='mt-2 flex items-center justify-between border-t border-[#000000]/40 pt-3 text-lg font-bold '>
                  <span>Total</span>
                  <span>{formatTotal(finalTotal)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
