import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components';
import type { Order } from '../types/order';
import Button from '../components/ui/Button';

interface LocationState {
  order: Order;
}

function formatPrice(value: number) {
  return `${Math.round(value * 100) / 100} DT`;
}

function paymentLabel(method: Order['paymentMethod']) {
  return method === 'CASH_ON_DELIVERY'
    ? 'Paiement à la livraison'
    : 'Carte bancaire';
}

export function OrderConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const order = state?.order;

  if (!order) {
    window.location.href = '/';
    return null;
  }

  return (
    <div className='min-h-screen bg-[#f7eee1] text-dark-red'>
      <Header withBackground={false} />

      <main className='mx-auto max-w-2xl px-4 pb-16 pt-28'>
        {/* Checkmark icon */}
        <div className='mb-5 flex justify-center'>
          <div className='flex h-16 w-16 items-center justify-center rounded-full bg-[#4a0a14]'>
            <svg
              width='32'
              height='32'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M5 12L10 17L19 7'
                stroke='white'
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className='mb-1 text-center font-bona text-2xl font-bold text-dark-red'>
          Commande confirmée !
        </h1>
        <p className='mb-8 text-center font-abee text-sm text-[#7a5c60]'>
          Merci pour votre commande. Voici le récapitulatif.
        </p>

        <div className='flex flex-col gap-5'>
          {/* Products */}
          <section className='rounded-2xl border border-dark-red bg-[#f9f2e8] p-5'>
            <h2 className='mb-4 font-bona text-lg font-bold text-black'>
              Produits commandés
            </h2>
            <div className='space-y-2'>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className='flex items-center justify-between font-bona  text-black'
                >
                  <span className='flex-1 pr-4'>
                    {item.productName}
                    {item.quantity > 1 && (
                      <span className='ml-1 text-[#9a6e73]'>
                        × {item.quantity}
                      </span>
                    )}
                  </span>
                  <span className='shrink-0'>
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className='mt-4 flex items-center justify-between border-t border-dark-red/20 pt-3 font-bona font-bold text-black'>
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </section>

          {/* Delivery address */}
          <section className='rounded-2xl border border-dark-red bg-[#f9f2e8] p-5'>
            <h2 className='mb-3 font-bona text-lg font-bold text-black'>
              Adresse de livraison
            </h2>
            <div className='space-y-1 font-bona text-sm text-[#000000]/68'>
              <p>
                {order.firstName} {order.lastName}
              </p>
              <p>
                {order.address}, {order.city}{' '}
                <span className='font-abhaya font-semibold'>
                  {' '}
                  {order.postalCode}
                </span>
              </p>
              <p className='font-abhaya font-semibold'>{order.phoneNumber}</p>
              {order.secondPhone && (
                <p className='font-abhaya font-semibold'>{order.secondPhone}</p>
              )}
            </div>
          </section>

          {/* Payment */}
          <section className='rounded-2xl border border-dark-red bg-[#f9f2e8] p-5'>
            <h2 className='mb-3 font-bona text-lg font-bold text-black'>
              Paiement
            </h2>
            <p className='font-bona text-sm text-[#000000]/68'>
              {paymentLabel(order.paymentMethod)}
            </p>
          </section>
        </div>

        {/* CTA */}
        <div className='mt-10 flex justify-center'>
          <Button
            onClick={() => navigate('/products')}
            classNames='inline-flex min-w-48 justify-center rounded-[50px]! text-dark-red! px-6 py-2.5 font-bona text-lg  transition-transform hover:scale-[1.01]'
          >
            Passer une nouvelle commande
          </Button>
        </div>
      </main>
    </div>
  );
}
