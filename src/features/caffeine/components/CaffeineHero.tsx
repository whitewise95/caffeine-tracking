import { CaffeineBodyVisual } from './CaffeineBodyVisual';

export function CaffeineHero({ remaining }: { remaining: number }) {
  return <section className="caffeine-hero" aria-labelledby="hero-title">
    <h1 id="hero-title" className="sr-only">지금 내 카페인</h1>
    <CaffeineBodyVisual caffeineMg={remaining} />
    <div className="hero-reading">
      <span className="estimate-label">현재 추정 잔존 카페인</span>
      <span className="hero-amount"><span data-testid="remaining-mg">{Math.round(remaining)}</span><span className="hero-unit">mg</span></span>
    </div>
  </section>;
}
