import { useId } from 'react';
import './avatar-add-button.css';

const cup = 'M18 46 C20 80 25 106 57 109 C85 111 93 84 96 46';
const handle = 'M96 57 C120 54 121 78 94 85 L89 87 M96 63 C109 61 111 74 94 78';

export function AvatarAddButton({ onAdd }: { onAdd: () => void }) {
  const id = useId().replace(/:/g, '');
  return <div className="avatar-add">
    <p className="avatar-add-invitation" aria-hidden="true">한 모금<br />채워볼까요?<svg viewBox="0 0 60 38"><path d="M52 3 Q50 29 9 32 M16 25 L9 32 L19 34" /></svg></p>
    <button className="avatar-add-button" aria-label="카페인 추가" onClick={onAdd}>
      <svg viewBox="0 0 124 134" aria-hidden="true" focusable="false">
        <defs>
          <filter id={`${id}-glow`} x="-35%" y="-35%" width="170%" height="170%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation="3" /></filter>
          <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--cup-shine)" stopOpacity=".34" /><stop offset=".45" stopColor="var(--cup-shadow)" stopOpacity=".55" /><stop offset="1" stopColor="var(--cup-pink)" stopOpacity=".24" /></linearGradient>
          <linearGradient id={`${id}-rim`} x1="0" y1="0" x2=".7" y2="1"><stop stopColor="var(--cup-shine)" /><stop offset=".4" stopColor="var(--cup-pink)" /><stop offset="1" stopColor="var(--cup-shine)" /></linearGradient>
          <linearGradient id={`${id}-coffee`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--cup-coffee-light)" /><stop offset="1" stopColor="var(--cup-coffee-dark)" /></linearGradient>
        </defs>
        <g className="avatar-cup-specks" fill="var(--cup-pink)"><circle cx="38" cy="19" r="1.6" /><circle cx="75" cy="27" r="2" /><circle cx="60" cy="8" r="1.1" /></g>
        <g transform="rotate(8 60 77)">
          <g fill="none" stroke="var(--cup-pink)" strokeWidth="5" opacity=".65" filter={`url(#${id}-glow)`}><path d={cup} /><path d={handle} /><ellipse cx="57" cy="46" rx="39" ry="11" /><ellipse cx="57" cy="111" rx="24" ry="5" /></g>
          <path d={handle} fill="none" stroke={`url(#${id}-rim)`} strokeWidth="2.2" />
          <path d={cup} fill={`url(#${id}-glass)`} stroke={`url(#${id}-rim)`} strokeWidth="2" />
          <ellipse cx="57" cy="46" rx="39" ry="11" fill={`url(#${id}-glass)`} stroke={`url(#${id}-rim)`} strokeWidth="1.8" />
          <ellipse cx="57" cy="47" rx="34" ry="7.5" fill={`url(#${id}-coffee)`} stroke="var(--cup-coffee-light)" strokeOpacity=".75" strokeWidth=".8" />
          <path d="M24 57 C25 79 29 92 38 98 M29 40 Q49 33 70 40" fill="none" stroke="var(--cup-shine)" strokeWidth="2.2" strokeLinecap="round" opacity=".75" />
          <ellipse cx="57" cy="111" rx="24" ry="5" fill={`url(#${id}-glass)`} stroke={`url(#${id}-rim)`} strokeWidth="1.4" />
          <circle cx="57" cy="78" r="18" fill="var(--cup-shadow)" fillOpacity=".85" stroke="var(--cup-pink)" strokeWidth="1.2" />
          <path d="M47 78 H67 M57 68 V88" stroke="var(--cup-pink)" strokeWidth="5" strokeLinecap="round" filter={`url(#${id}-glow)`} />
          <path d="M47 78 H67 M57 68 V88" stroke="var(--cup-plus)" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
    </button>
  </div>;
}
