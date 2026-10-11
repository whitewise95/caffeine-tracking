import { CaffeineBodyVisual } from './CaffeineBodyVisual';
import { AvatarAddButton } from './AvatarAddButton';
import { AbsorptionInfo } from './AbsorptionInfo';

export function CaffeineHero({ remaining, absorbingCount = 0, intakePulse, tiltEnabled = false, onAdd }: { remaining: number; absorbingCount?: number; intakePulse?: number; tiltEnabled?: boolean; onAdd: () => void }) {
  return <section className="caffeine-hero" aria-labelledby="hero-title">
    <h1 id="hero-title" className="sr-only">지금 내 카페인</h1>
    <div className="caffeine-hero-scene">
      <div className="caffeine-hero-avatar">
        <CaffeineBodyVisual caffeineMg={remaining} absorbingCount={absorbingCount} intakePulse={intakePulse} tiltEnabled={tiltEnabled} />
        {absorbingCount > 0 && <AbsorptionInfo count={absorbingCount} />}
      </div>
      <AvatarAddButton onAdd={onAdd} />
    </div>
    <div className="hero-reading">
      <span className="sr-only">현재 추정 잔존 카페인</span>
      <span className="hero-amount"><span data-testid="remaining-mg">{Math.round(remaining)}</span><span className="hero-unit">mg</span></span>
    </div>
  </section>;
}
