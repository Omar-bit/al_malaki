import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackInfluencerVisit } from '../services/influencerTrackingService';

export function InfluencerTrackingBootstrap() {
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('ref')?.trim();

    if (!code) {
      return;
    }

    trackInfluencerVisit(code).catch(() => {
      // Tracking should never block navigation or page rendering.
    });
  }, [location.search]);

  return null;
}
