import { useRef, type CSSProperties } from 'react';

/** Surface, body glow and drinking arm share one gravity-aligned liquid mask. */
export function AvatarLiquid({ id, y, bubbles, visible, absorbing = false, tapPulse = 0 }: { id: string; y: number; bubbles: number; visible: boolean; absorbing?: boolean; tapPulse?: number }) {
  // The motion hook owns this transform after mount, including amount changes.
  const initialY = useRef(y).current;
  return <g opacity={visible ? 1 : 0}>
    <g className="body-liquid avatar-gravity-frame" transform={`translate(0 ${initialY})`}>
      <g className="avatar-wave avatar-wave-front">
        <use href={`#${id}-volume`} fill="var(--avatar-tint)" opacity=".09" />
        <use href={`#${id}-volume`} fill={`url(#${id}-liquid)`} />
        <use href={`#${id}-surface`} fill="none" stroke="var(--avatar-tint)" strokeWidth="7" filter={`url(#${id}-surface-bloom)`} opacity=".9" />
        <use href={`#${id}-surface`} fill="none" stroke="var(--avatar-liquid-light)" strokeWidth="1.4" />
        <use href={`#${id}-surface`} transform="translate(0 4)" fill="none" stroke="var(--avatar-tint)" strokeWidth=".8" opacity=".55" />
      </g>
      <g clipPath={`url(#${id}-local-liquid)`}>
        <ellipse className="avatar-core" cx="162" cy="95" rx="91" ry="115" fill={`url(#${id}-core)`} opacity=".4" />
        {Array.from({ length: bubbles }, (_, i) => <g className="avatar-bubble" key={i} style={{ '--bubble-delay': `${-i * 1.13}s`, '--bubble-duration': `${6 + i % 3}s` } as CSSProperties}>
          <circle cx={104 + (i * 37 % 116)} cy={25 + (i * 39 % 183)} r={i % 3 === 0 ? 3.2 : 1.8} fill={`url(#${id}-bubble)`} stroke="var(--avatar-liquid-light)" strokeWidth=".65" />
          <circle cx={103.3 + (i * 37 % 116)} cy={24.2 + (i * 39 % 183)} r=".65" fill="var(--avatar-liquid-light)" />
        </g>)}
        {Array.from({ length: bubbles * 2 }, (_, i) => <circle className="avatar-speck" key={i} cx={86 + (i * 47 % 148)} cy={12 + (i * 31 % 217)} r={i % 4 === 0 ? 1.1 : .6} fill="var(--avatar-liquid-light)" style={{ '--spark-delay': `${-i * .73}s` } as CSSProperties} />)}
      </g>
    </g>
    {absorbing && <g clipPath={`url(#${id}-filled)`}>
      <ellipse className="avatar-absorption-glow" cx="160" cy="245" rx="96" ry="108" fill={`url(#${id}-core)`} />
    </g>}
    {tapPulse > 0 && <g clipPath={`url(#${id}-filled)`}>
      <ellipse key={tapPulse} className="avatar-tap-glow" cx="160" cy="245" rx="96" ry="108" fill={`url(#${id}-core)`} />
    </g>}
  </g>;
}
