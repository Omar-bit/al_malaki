import { useCallback } from 'react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

export function useProductTour(steps: DriveStep[]) {
  const startTour = useCallback(() => {
    if (steps.length === 0) return;

    driver({
      showProgress: true,
      allowClose: true,
      overlayColor: '#3f060f',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Done',
      steps,
    }).drive();
  }, [steps]);

  return { startTour };
}
