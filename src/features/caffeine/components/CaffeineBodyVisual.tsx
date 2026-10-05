import { useId } from 'react';
import { getVisualLevel } from '../model/caffeine';

const bodyPath = 'M120 23a24 24 0 1 1 0 48a24 24 0 1 1 0-48Zm-22 60c-15 0-26 8-32 22l-23 63c-3 9 0 16 7 19 8 3 15-1 18-9l17-44-2 61-10 99c-1 11 5 18 14 18 9 0 14-5 16-15l15-89h4l15 89c2 10 7 15 16 15s15-7 14-18l-10-99-2-61 17 44c3 8 10 12 18 9 7-3 10-10 7-19l-23-63c-6-14-17-22-32-22Z';

export function CaffeineBodyVisual({ caffeineMg }: { caffeineMg: number }) {
  const id = useId().replace(/:/g, '');
  const level = getVisualLevel(caffeineMg);
  const fill = Math.min(Math.max(caffeineMg / 350, 0), 1);
  const y = 313 - fill * 280;
  const particles = caffeineMg > 0 ? Math.min(3 + Math.floor(caffeineMg / 25), 14) : 0;
  return <div className="body-visual" data-level={level} data-caffeine={Math.round(caffeineMg)}>
    <svg viewBox="0 0 240 348" role="img" aria-label={`몸 안의 추정 잔존 카페인 ${Math.round(caffeineMg)}mg 시각화`}>
      <defs>
        <clipPath id={`${id}-body`}><path d={bodyPath} /></clipPath>
        <linearGradient id={`${id}-glass`} x1="0" x2="1" y1="0" y2=".6"><stop offset="0" stopColor="var(--body-glass-start)" /><stop offset=".5" stopColor="var(--body-glass-mid)" /><stop offset="1" stopColor="var(--body-glass-end)" /></linearGradient>
        <linearGradient id={`${id}-liquid`} x1="0" y1="0" x2=".15" y2="1"><stop offset="0" stopColor="var(--caffeine-fill-top)" stopOpacity=".95" /><stop offset=".35" stopColor="var(--caffeine-fill-middle)" stopOpacity=".92" /><stop offset="1" stopColor="var(--caffeine-fill-bottom)" stopOpacity=".9" /></linearGradient>
        <radialGradient id={`${id}-ambient`}><stop offset="0" stopColor="var(--caffeine-ambient)" stopOpacity=".16" /><stop offset="1" stopColor="var(--caffeine-ambient)" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="120" cy="214" rx="117" ry="129" fill={`url(#${id}-ambient)`} opacity={fill ? .35 + fill * .65 : .12} />
      <ellipse cx="120" cy="324" rx="57" ry="8" fill="none" stroke="var(--body-grid)" strokeWidth="1" />
      <ellipse cx="120" cy="324" rx="38" ry="4" fill="none" stroke="var(--body-grid)" strokeWidth="1" />
      <path d={bodyPath} fill={`url(#${id}-glass)`} stroke="var(--body-outline)" strokeWidth="1.25" />
      <g clipPath={`url(#${id}-body)`}>
        <g className="body-liquid" style={{ transform: `translateY(${y}px)` }}>
          <g className="liquid-wave liquid-wave-back">
            <path d="M-90 3C-45-5-13 9 24 3S89-7 132 2S204 8 250 1S302-5 340 3V340H-90Z" fill="var(--caffeine-fill-top)" opacity=".24" />
          </g>
          <g className="liquid-wave liquid-wave-front">
            <path d="M-90 0C-48-8-18 7 23 1S91-6 134 1S205 7 251 0S302-7 340 0V340H-90Z" fill={`url(#${id}-liquid)`} />
            <path d="M-90 0C-48-8-18 7 23 1S91-6 134 1S205 7 251 0S302-7 340 0" fill="none" stroke="var(--caffeine-highlight)" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        </g>
        {Array.from({ length: particles }, (_, i) => <circle key={i} cx={74 + ((i * 29) % 92)} cy={Math.min(301, y + 18 + ((i * 31) % Math.max(10, 280 - y)))} r={i % 3 === 0 ? 1.7 : 1} fill="var(--caffeine-particle)" opacity={.25 + (i % 3) * .15} />)}
        <path d="M91 93c-8 2-13 8-16 17l-22 61M109 31c-9 4-13 14-10 22" stroke="#fff" strokeOpacity=".14" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      {level === 'HIGH_VISUAL' && <path d={bodyPath} fill="none" stroke="var(--accent-pink)" strokeOpacity=".4" strokeWidth="1.25" />}
      <g stroke="var(--body-grid)" strokeWidth="1" strokeDasharray="2 4"><path d="M8 119h42M190 119h42M8 219h35M197 219h35" /></g>
    </svg>
  </div>;
}
