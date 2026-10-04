import { Info } from 'lucide-react';
import { CaffeineBodyVisual } from './CaffeineBodyVisual';

export function CaffeineHero({ remaining, onInfo }: { remaining: number; onInfo: () => void }) {
  return <section className="caffeine-hero" aria-labelledby="hero-title">
    <h1 id="hero-title" className="sr-only">지금 내 카페인</h1>
    <CaffeineBodyVisual caffeineMg={remaining} />
    <button className="hero-reading" onClick={onInfo} aria-label={`현재 추정 잔존 카페인 ${Math.round(remaining)}mg, 계산 모델 설명 보기`}>
      <span className="estimate-label">현재 추정 잔존 카페인</span>
      <span className="hero-amount"><span data-testid="remaining-mg">{Math.round(remaining)}</span><span className="hero-unit">mg</span></span>
      <Info size={14} aria-hidden="true" />
    </button>
  </section>;
}
