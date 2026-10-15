import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, RotateCcw, X } from 'lucide-react';
import { CaffeineBodyVisual } from '../features/caffeine/components/CaffeineBodyVisual';
import { AvatarItemThumbnail } from '../features/avatar/components/AvatarItemThumbnail';
import { AVATAR_CATEGORIES, AVATAR_ITEMS } from '../features/avatar/data/avatarCatalog';
import { emptyOutfit, outfitsEqual } from '../features/avatar/model/avatar';
import type { AvatarOutfit, AvatarSlot } from '../features/avatar/model/avatar.types';
import './wardrobe.css';

interface WardrobePageProps {
  outfit: AvatarOutfit;
  caffeineMg: number;
  absorbingCount: number;
  tiltEnabled: boolean;
  busy: boolean;
  onSave: (outfit: AvatarOutfit) => Promise<boolean>;
  onBack: () => void;
  onApplied: () => void;
}

export function WardrobePage({ outfit, caffeineMg, absorbingCount, tiltEnabled, busy, onSave, onBack, onApplied }: WardrobePageProps) {
  const [draft, setDraft] = useState<AvatarOutfit>(() => ({ ...outfit }));
  const [slot, setSlot] = useState<AvatarSlot>('hat');
  const [failed, setFailed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const saving = useRef(false);
  const awaitingPreviousSave = useRef(busy);
  const changed = !outfitsEqual(draft, outfit);
  const hasItems = Object.values(draft).some(Boolean);
  const category = AVATAR_CATEGORIES.find(item => item.id === slot)!;
  useEffect(() => {
    mounted.current = true;
    heading.current?.focus({ preventScroll: true });
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    // A new visit may start while the previous visit's write is still pending.
    // Inputs stay disabled then, so adopt its result once before this visit edits.
    if (awaitingPreviousSave.current && !busy) {
      awaitingPreviousSave.current = false;
      setDraft({ ...outfit });
    }
  }, [busy, outfit]);

  function select(next: string | null) {
    setDraft(previous => ({ ...previous, [slot]: previous[slot] === next ? null : next }));
    setFailed(false);
  }
  function changeSlot(next: AvatarSlot) {
    setSlot(next);
    list.current?.scrollTo({ top: 0 });
  }
  async function apply() {
    if (saving.current || busy || !changed) return;
    saving.current = true;
    setFailed(false);
    try {
      const success = await onSave({ ...draft });
      if (!mounted.current) return;
      if (success) onApplied();
      else setFailed(true);
    } catch {
      if (mounted.current) setFailed(true);
    } finally {
      saving.current = false;
    }
  }

  return <main className="wardrobe-page" id="main-content">
    <header className="wardrobe-header">
      <button className="icon-button" aria-label="홈으로 돌아가기" onClick={onBack}><ArrowLeft size={22} aria-hidden="true" /></button>
      <h1 className="page-title" ref={heading} tabIndex={-1}>캐릭터 꾸미기</h1>
      <span className="wardrobe-count" aria-label={`6개 부위 중 ${Object.values(draft).filter(Boolean).length}개 착용`}>{Object.values(draft).filter(Boolean).length} / 6</span>
    </header>
    <section className="wardrobe-preview" aria-label="착용 미리보기">
      <CaffeineBodyVisual caffeineMg={caffeineMg} absorbingCount={absorbingCount} tiltEnabled={tiltEnabled} outfit={draft} />
      <p className="wardrobe-estimate">추정 잔존 카페인 <strong>{Math.round(caffeineMg)}<span> mg</span></strong></p>
    </section>
    <div className="wardrobe-categories" role="tablist" aria-label="꾸미기 부위">
      {AVATAR_CATEGORIES.map((item, index) => <button key={item.id} id={`wardrobe-tab-${item.id}`} role="tab" aria-selected={slot === item.id} aria-controls="wardrobe-items" tabIndex={slot === item.id ? 0 : -1} onClick={() => changeSlot(item.id)} onKeyDown={event => {
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % AVATAR_CATEGORIES.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + AVATAR_CATEGORIES.length) % AVATAR_CATEGORIES.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = AVATAR_CATEGORIES.length - 1;
        else return;
        event.preventDefault();
        changeSlot(AVATAR_CATEGORIES[next].id);
        document.getElementById(`wardrobe-tab-${AVATAR_CATEGORIES[next].id}`)?.focus();
      }}>{item.label}</button>)}
    </div>
    <div className="wardrobe-items" id="wardrobe-items" role="tabpanel" aria-labelledby={`wardrobe-tab-${slot}`} ref={list} tabIndex={0}>
      <div className="wardrobe-section-label"><h2>{category.label}</h2></div>
      <div className="wardrobe-grid" role="group" aria-label={`${category.label} 아이템`}>
        <button className="wardrobe-item wardrobe-item--none" aria-label="착용 안 함" aria-pressed={draft[slot] === null} disabled={busy} onClick={() => select(null)}>
          <span className="wardrobe-none-icon"><X size={24} strokeWidth={1.5} aria-hidden="true" /></span>
          <span>착용 안 함</span>{draft[slot] === null && <Check className="wardrobe-selected" size={15} aria-hidden="true" />}
        </button>
        {AVATAR_ITEMS.filter(item => item.slot === slot).map(item => <button key={item.id} className="wardrobe-item" aria-label={item.name} aria-pressed={draft[slot] === item.id} disabled={busy} onClick={() => select(item.id)}>
          <AvatarItemThumbnail item={item} /><span>{item.name}</span>
          {draft[slot] === item.id && <Check className="wardrobe-selected" size={15} aria-hidden="true" />}
        </button>)}
      </div>
    </div>
    <footer className="wardrobe-footer">
      {failed && <p className="wardrobe-error" role="alert">꾸미기를 저장하지 못했어요. 선택한 모습은 유지돼요. 다시 시도해 주세요.</p>}
      <div className="wardrobe-actions">
        <button className="button-secondary" disabled={busy || !hasItems} onClick={() => { setDraft(emptyOutfit()); setFailed(false); }}><RotateCcw size={17} aria-hidden="true" /><span>모두 벗기기</span></button>
        <button className="button-primary" disabled={busy || !changed} aria-busy={busy} onClick={() => void apply()}>{busy ? '저장 중…' : failed ? '다시 적용하기' : '적용하기'}</button>
      </div>
    </footer>
  </main>;
}
