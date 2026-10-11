import { useEffect, useRef } from 'react';
import { gravityAngle } from '../model/liquidGravity';
import { useDeviceTiltPermission } from './useDeviceTiltPermission';

function screenAngle(): number {
  const current = window.screen.orientation?.angle;
  if (typeof current === 'number' && Number.isFinite(current)) return current;
  const legacy = (window as Window & { orientation?: number }).orientation;
  return typeof legacy === 'number' && Number.isFinite(legacy) ? legacy : 0;
}

/** Sensor events update a ref; the avatar owns animation and interpolation. */
export function useDeviceTilt(enabled: boolean) {
  const angle = useRef<number | null>(null);
  const permission = useDeviceTiltPermission();

  useEffect(() => {
    angle.current = null;
    if (!enabled || permission !== 'ready') return;
    const orientation = window.screen.orientation;
    let active = true;
    let subscribed = false;
    let lastSample: Pick<DeviceOrientationEvent, 'beta' | 'gamma'> | null = null;

    function updateAngle() {
      if (!active || document.hidden || !lastSample) return;
      const next = gravityAngle(lastSample.beta, lastSample.gamma, screenAngle());
      // A flat phone has no stable projected gravity direction. Hold the last
      // valid direction instead of snapping upright or reacting to sensor noise.
      if (next !== null) angle.current = next;
    }

    function onDeviceOrientation(event: DeviceOrientationEvent) {
      if (!active || document.hidden) return;
      lastSample = { beta: event.beta, gamma: event.gamma };
      updateAngle();
    }

    function detach() {
      if (!subscribed) return;
      window.removeEventListener('deviceorientation', onDeviceOrientation);
      orientation?.removeEventListener('change', updateAngle);
      window.removeEventListener('orientationchange', updateAngle);
      subscribed = false;
    }

    function attach() {
      if (!active || document.hidden || subscribed) return;
      window.addEventListener('deviceorientation', onDeviceOrientation);
      orientation?.addEventListener('change', updateAngle);
      window.addEventListener('orientationchange', updateAngle);
      subscribed = true;
      updateAngle();
    }

    function onVisibilityChange() {
      if (document.hidden) detach();
      else attach();
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    attach();

    return () => {
      active = false;
      detach();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      angle.current = null;
    };
  }, [enabled, permission]);

  return { angle };
}
