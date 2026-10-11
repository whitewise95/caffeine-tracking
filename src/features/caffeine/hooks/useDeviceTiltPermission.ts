import { useEffect, useSyncExternalStore } from 'react';
import { deviceTiltPermissionStatus, restoreDeviceTiltPermission, subscribeDeviceTiltPermission } from './deviceTiltPermission';

/** Observe permission without requesting it as a side effect of navigation. */
export function useDeviceTiltPermission() {
  return useSyncExternalStore(subscribeDeviceTiltPermission, deviceTiltPermissionStatus, deviceTiltPermissionStatus);
}

/** Own startup/foreground recovery; a tab tap explicitly handles its own request. */
export function useRestoreDeviceTiltPermission(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const restore = () => {
      if (!document.hidden && !motion.matches) void restoreDeviceTiltPermission();
    };
    restore();
    document.addEventListener('visibilitychange', restore);
    window.addEventListener('pageshow', restore);
    motion.addEventListener('change', restore);
    return () => {
      document.removeEventListener('visibilitychange', restore);
      window.removeEventListener('pageshow', restore);
      motion.removeEventListener('change', restore);
    };
  }, [enabled]);
}
