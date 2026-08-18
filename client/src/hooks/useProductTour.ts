import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

export function useProductTour(steps: DriveStep[]) {
  const { t } = useTranslation();

  const startTour = useCallback(() => {
    if (steps.length === 0) return;

    driver({
      showProgress: true,
      allowClose: true,
      overlayColor: '#3f060f',
      nextBtnText: t('product_tour.next'),
      prevBtnText: t('product_tour.back'),
      doneBtnText: t('product_tour.done'),
      steps,
    }).drive();
  }, [steps, t]);

  return { startTour };
}
