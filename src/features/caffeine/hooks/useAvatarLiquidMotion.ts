import { useEffect, useRef, useState, type RefObject } from 'react';
import { liquidSurfaceOffset, stepLiquidSpring, type Point } from '../model/liquidGravity';
import { useDeviceTilt } from './useDeviceTilt';
import { closeLiquidSurface, liquidSurfacePath, liquidWaveAmplitude, liquidWaveHeight } from '../model/liquidWaves';

interface MotionOptions {
  root: RefObject<HTMLDivElement>;
  body: string;
  y: number;
  tilt: number;
  scaleX: number;
  scaleY: number;
  tiltEnabled: boolean;
}

/** Imperatively update a few SVG attributes, avoiding a React render per sensor event. */
export function useAvatarLiquidMotion({ root, body, y, tilt, scaleX, scaleY, tiltEnabled }: MotionOptions) {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const sensor = useDeviceTilt(tiltEnabled && !reduced);
  const current = useRef({ y, tilt, scaleX, scaleY });
  const simulation = useRef({ spring: { angle: 0, velocity: 0 }, level: y, phase: 0, slosh: 0 });
  useEffect(() => { current.current = { y, tilt, scaleX, scaleY }; }, [y, tilt, scaleX, scaleY]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const outline = element.querySelector<SVGPathElement>('.avatar-body-clip');
    const surface = element.querySelector<SVGPathElement>('.avatar-surface-definition');
    const volume = element.querySelector<SVGPathElement>('.avatar-volume-definition');
    const frames = element.querySelectorAll<SVGGElement>('.avatar-gravity-frame');
    if (!outline || !surface || !volume) return;
    // Sample the actual silhouette once per pose. Equal-area samples preserve volume.
    const points: Point[] = [];
    for (let py = 53; py <= 310; py += 3) {
      for (let px = 61; px <= 265; px += 3) {
        if (outline.isPointInFill(new DOMPoint(px, py))) points.push({ x: px, y: py });
      }
    }
    // Resampling a changed arm outline must not reset the moving liquid.
    let { spring, level, phase, slosh } = simulation.current;
    if (reduced) { spring = { angle: 0, velocity: 0 }; level = current.current.y; slosh = 0; }
    let last = 0;
    let frame = 0;
    let stopped = false;
    let paused = document.hidden || Boolean(document.querySelector('dialog[open]'));
    const draw = (angle: number, amplitude: number) => {
      // Subtract this same wave profile from each sample's projection, preserving
      // the filled area as crests travel across the changing width of the body.
      const offset = liquidSurfaceOffset(points, level, angle, amplitude ? x => liquidWaveHeight(x, phase, amplitude) : undefined);
      const transform = `translate(160 180) rotate(${angle.toFixed(3)}) translate(-160 ${offset.toFixed(3)})`;
      frames.forEach(group => group.setAttribute('transform', transform));
      const path = liquidSurfacePath(phase, amplitude);
      surface.setAttribute('d', path);
      volume.setAttribute('d', closeLiquidSurface(path));
    };
    const tick = (time: number) => {
      if (stopped || paused || reduced) return;
      frame = requestAnimationFrame(tick);
      // Sensor input can be 100Hz; 30fps is sufficient for this small fluid surface.
      if (last && time - last < 1000 / 30) return;
      const dt = last ? Math.min((time - last) / 1000, .05) : 1 / 30;
      last = time;
      const settings = current.current;
      level += (settings.y - level) * (1 - Math.exp(-dt * 4));
      const angle = sensor.angle.current;
      let target = 0;
      if (angle !== null) {
        // Undo the body's slight pose rotation/non-uniform scale so the surface
        // remains perpendicular to real gravity in screen coordinates.
        const radians = (angle - settings.tilt) * Math.PI / 180;
        target = Math.atan2(Math.sin(radians) * settings.scaleX, Math.cos(radians) * settings.scaleY) * 180 / Math.PI;
      }
      element.dataset.tilting = String(angle !== null);
      spring = stepLiquidSpring(spring, target, dt);
      const energy = Math.min(Math.abs(spring.velocity) / 28, 5.5);
      // A quick response on tilt, with a slower decay into the ambient swell.
      slosh += (energy - slosh) * (1 - Math.exp(-dt * (energy > slosh ? 6 : 1.7)));
      phase += dt * (.85 + slosh * .055);
      draw(spring.angle, liquidWaveAmplitude(level, slosh));
    };
    const syncPause = () => {
      paused = document.hidden || Boolean(document.querySelector('dialog[open]'));
      cancelAnimationFrame(frame);
      last = 0;
      if (!paused && !reduced) frame = requestAnimationFrame(tick);
    };
    const observer = new MutationObserver(syncPause);
    observer.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
    document.addEventListener('visibilitychange', syncPause);
    draw(spring.angle, reduced ? 0 : liquidWaveAmplitude(level, slosh));
    if (reduced) element.dataset.tilting = 'false';
    else syncPause();
    return () => {
      stopped = true;
      simulation.current = { spring, level, phase, slosh };
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', syncPause);
    };
  }, [root, body, reduced, sensor.angle]);
  // Reduced motion is static, including when the amount changes after a new record.
  useEffect(() => {
    if (!reduced) return;
    root.current?.querySelectorAll('.avatar-gravity-frame').forEach(group => group.setAttribute('transform', `translate(0 ${y})`));
  }, [root, reduced, y]);
}
