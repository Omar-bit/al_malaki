import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HelpCircle } from 'lucide-react';
import type { DriveStep } from 'driver.js';
import { useProductTour } from '../hooks/useProductTour';
import useWindowWidth from '../hooks/useWindowWidth';
import { useAuth } from '../contexts';

const TOUR_SEEN_KEY = 'al-malaki-product-tour-seen';
const DESKTOP_BREAKPOINT = 768;
const GUEST_MODAL_SELECTOR = '[data-guest-modal]';
const GUEST_MODAL_SEEN_KEY = 'hasSeenGuestModal';
// GuestModal opens itself 1.5s after auth resolves (see GuestModal.tsx) — wait
// at least that long once we know it is about to open, plus a small buffer.
const GUEST_MODAL_OPEN_DELAY_MS = 1500 + 200;

function isGuestModalOpen() {
  return !!document.querySelector(GUEST_MODAL_SELECTOR);
}

function waitForGuestModalToClose(callback: () => void) {
  if (!isGuestModalOpen()) {
    callback();
    return () => {};
  }

  const observer = new MutationObserver(() => {
    if (!isGuestModalOpen()) {
      observer.disconnect();
      callback();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return () => observer.disconnect();
}

export function ProductTour() {
  const location = useLocation();
  const width = useWindowWidth();
  const { t } = useTranslation();
  const { isLoading: isAuthLoading, user } = useAuth();

  const isCustomerSpace = !location.pathname.startsWith('/admin');

  const desktopSteps: DriveStep[] = useMemo(
    () => [
      {
        element: '[data-tour="logo"]',
        popover: {
          title: t('product_tour.logo_title'),
          description: t('product_tour.logo_desc'),
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="nav-links"]',
        popover: {
          title: t('product_tour.nav_title'),
          description: t('product_tour.nav_desc'),
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="search"]',
        popover: {
          title: t('product_tour.search_title'),
          description: t('product_tour.search_desc'),
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="cart"]',
        popover: {
          title: t('product_tour.cart_title'),
          description: t('product_tour.cart_desc'),
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="account"]',
        popover: {
          title: t('product_tour.account_title'),
          description: t('product_tour.account_desc'),
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="lang-toggle"]',
        popover: {
          title: t('product_tour.lang_title'),
          description: t('product_tour.lang_desc'),
          side: 'bottom',
        },
      },
    ],
    [t],
  );

  const mobileSteps: DriveStep[] = useMemo(
    () => [
      {
        element: '[data-tour="mobile-menu"]',
        popover: {
          title: t('product_tour.mobile_menu_title'),
          description: t('product_tour.mobile_menu_desc'),
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="mobile-account"]',
        popover: {
          title: t('product_tour.account_title'),
          description: t('product_tour.account_desc'),
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="mobile-search"]',
        popover: {
          title: t('product_tour.search_title'),
          description: t('product_tour.search_desc'),
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="mobile-cart"]',
        popover: {
          title: t('product_tour.cart_title'),
          description: t('product_tour.cart_desc'),
          side: 'bottom',
        },
      },
    ],
    [t],
  );

  const steps = useMemo(
    () => (width >= DESKTOP_BREAKPOINT ? desktopSteps : mobileSteps),
    [width, desktopSteps, mobileSteps],
  );
  const { startTour } = useProductTour(steps);

  useEffect(() => {
    if (!isCustomerSpace) return;
    if (localStorage.getItem(TOUR_SEEN_KEY)) return;
    // Wait for the same auth signal GuestModal uses, so we know for certain
    // whether it is about to open instead of racing an arbitrary timer.
    if (isAuthLoading) return;

    let cancelled = false;
    let stopWaiting: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const beginTour = () => {
      if (cancelled) return;
      startTour();
      localStorage.setItem(TOUR_SEEN_KEY, 'true');
    };

    const guestModalWillOpen =
      !user && !sessionStorage.getItem(GUEST_MODAL_SEEN_KEY);

    if (guestModalWillOpen) {
      timer = setTimeout(() => {
        stopWaiting = waitForGuestModalToClose(beginTour);
      }, GUEST_MODAL_OPEN_DELAY_MS);
    } else {
      stopWaiting = waitForGuestModalToClose(beginTour);
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      stopWaiting?.();
    };
  }, [isCustomerSpace, isAuthLoading, user, startTour]);

  if (!isCustomerSpace) return null;

  return (
    <button
      type='button'
      onClick={() => waitForGuestModalToClose(startTour)}
      aria-label={t('product_tour.start_aria')}
      className='fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-dark-red text-[#fdf8f0] shadow-lg transition-transform hover:scale-105'
    >
      <HelpCircle className='h-5 w-5' />
    </button>
  );
}
