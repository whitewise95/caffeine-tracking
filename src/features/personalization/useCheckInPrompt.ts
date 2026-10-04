import { useEffect, useRef, useState } from 'react';
import type { useRouter } from '../../app/router';
import type { useCaffeine } from '../caffeine/hooks/useCaffeine';
import { getCheckIn } from './model';

/** A dismissal lasts until the next foreground visit. Only a saved answer persists. */
export function useCheckInPrompt(caffeine: ReturnType<typeof useCaffeine>, router: ReturnType<typeof useRouter>) {
  const [visit, setVisit] = useState(0);
  const shown = useRef('');
  useEffect(() => {
    const resume = () => {
      if (document.visibilityState === 'visible') setVisit(value => value + 1);
    };
    document.addEventListener('visibilitychange', resume);
    return () => document.removeEventListener('visibilitychange', resume);
  }, []);
  const eligible = caffeine.loaded ? getCheckIn(caffeine.state.personalization, caffeine.state.entries, caffeine.now) : null;
  const { page, overlay, openOverlay, closeOverlay } = router;
  useEffect(() => {
    // Back/forward or a midnight boundary may invalidate an already-open prompt.
    if (overlay?.type === 'check-in' && !eligible) { closeOverlay(); return; }
    if (page !== 'home' || !eligible || document.visibilityState !== 'visible') return;
    const key = `${visit}:${eligible.timeZone}:${eligible.targetDate}`;
    if (overlay?.type === 'check-in') { shown.current = key; return; }
    if (overlay) return;
    if (shown.current === key) return;
    shown.current = key;
    openOverlay({ type: 'check-in' });
  }, [eligible, page, overlay, openOverlay, closeOverlay, visit]);
  return eligible;
}
