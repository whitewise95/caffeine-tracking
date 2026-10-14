import { CaffeineBodyVisual } from './CaffeineBodyVisual';
import { AvatarAddButton } from './AvatarAddButton';
import { AbsorptionInfo } from './AbsorptionInfo';
import type { AvatarOutfit } from '../../avatar/model/avatar.types';
import '../../../pages/wardrobe.css';

export function CaffeineHero({ remaining, absorbingCount = 0, intakePulse, tiltEnabled = false, onAdd, outfit, onWardrobe }: { remaining: number; absorbingCount?: number; intakePulse?: number; tiltEnabled?: boolean; onAdd: () => void; outfit?: AvatarOutfit; onWardrobe: () => void }) {
  return <section className="caffeine-hero" aria-labelledby="hero-title">
    <h1 id="hero-title" className="sr-only">지금 내 카페인</h1>
    <button id="wardrobe-button" className="wardrobe-home-button" aria-label="캐릭터 꾸미기" onClick={onWardrobe}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6a3 3 0 0 1 6 0c0 2-3 2-3 4v1L3 17c-1 .7-.5 2 .7 2h16.6c1.2 0 1.7-1.3.7-2l-9-6" /></svg>
      꾸미기
    </button>
    <div className="caffeine-hero-scene">
      <div className="caffeine-hero-avatar">
        <CaffeineBodyVisual caffeineMg={remaining} absorbingCount={absorbingCount} intakePulse={intakePulse} tiltEnabled={tiltEnabled} outfit={outfit} />
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
