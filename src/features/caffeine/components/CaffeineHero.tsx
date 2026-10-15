import { CaffeineBodyVisual } from './CaffeineBodyVisual';
import { AvatarAddButton } from './AvatarAddButton';
import { AbsorptionInfo } from './AbsorptionInfo';
import type { AvatarOutfit } from '../../avatar/model/avatar.types';
import '../../../pages/wardrobe.css';

export function CaffeineHero({ remaining, absorbingCount = 0, intakePulse, tiltEnabled = false, onAdd, outfit, outfitHidden, onOutfitHiddenChange, onWardrobe }: { remaining: number; absorbingCount?: number; intakePulse?: number; tiltEnabled?: boolean; onAdd: () => void; outfit?: AvatarOutfit; outfitHidden: boolean; onOutfitHiddenChange: (hidden: boolean) => void; onWardrobe: () => void }) {
  const canHideOutfit = outfitHidden || (outfit && Object.values(outfit).some(Boolean));
  return <section className="caffeine-hero" aria-labelledby="hero-title">
    <h1 id="hero-title" className="sr-only">지금 내 카페인</h1>
    <div className="avatar-home-controls">
      {canHideOutfit && <>
        <label className="avatar-outfit-toggle">
          <input type="checkbox" checked={outfitHidden} onChange={event => onOutfitHiddenChange(event.target.checked)} aria-describedby="avatar-outfit-toggle-hint" />
          <span>겉멋 잠깐 끄기</span>
        </label>
        <span id="avatar-outfit-toggle-hint" className="sr-only">체크하면 홈에서 꾸미기만 잠시 숨겨요. 해제하면 저장한 코디가 다시 보여요.</span>
      </>}
      <button id="wardrobe-button" className="wardrobe-home-button" aria-label="캐릭터 꾸미기" onClick={onWardrobe}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6a3 3 0 0 1 6 0c0 2-3 2-3 4v1L3 17c-1 .7-.5 2 .7 2h16.6c1.2 0 1.7-1.3.7-2l-9-6" /></svg>
        꾸미기
      </button>
    </div>
    <div className="caffeine-hero-scene">
      <div className="caffeine-hero-avatar">
        <CaffeineBodyVisual caffeineMg={remaining} absorbingCount={absorbingCount} intakePulse={intakePulse} tiltEnabled={tiltEnabled} outfit={outfitHidden ? undefined : outfit} />
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
