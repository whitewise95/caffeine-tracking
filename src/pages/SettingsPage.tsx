import { RotateCcw, ChevronRight, Smartphone } from 'lucide-react';
import { TiltAnimationSetting } from '../features/caffeine/components/TiltAnimationSetting';
import { BedtimeSetting } from '../features/caffeine/components/BedtimeSetting';
import type { CaffeineEntry } from '../features/caffeine/model/caffeine.types';
import './secondary.css';

export function SettingsPage({ onReset, tiltAnimation, busy, onTiltAnimationChange, entries, now, halfLifeHours, bedtime, onPickBedtime }: { onReset: () => void; tiltAnimation: boolean; busy: boolean; onTiltAnimationChange: (enabled: boolean) => Promise<boolean>; entries: CaffeineEntry[]; now: Date; halfLifeHours: number; bedtime: string; onPickBedtime: () => void }) {
  return <main className="page" id="main-content">
    <header className="page-header"><div><h1 className="page-title">설정</h1></div></header>
    <BedtimeSetting entries={entries} now={now} halfLifeHours={halfLifeHours} bedtime={bedtime} busy={busy} onPickBedtime={onPickBedtime} />
    <TiltAnimationSetting enabled={tiltAnimation} busy={busy} onChange={onTiltAnimationChange} />
    <section className="settings-section settings-plain" aria-labelledby="device-storage-title">
      <div className="section-heading"><Smartphone size={18} aria-hidden="true" /><h2 id="device-storage-title">이 기기에만 저장돼요</h2></div>
      <p className="settings-description">섭취 기록과 내 음료·카테고리는 이 기기에만 저장돼요.</p>
      <p className="settings-description">기기를 변경하거나 토스 앱·기기 데이터를 삭제하면 기록이 사라질 수 있어요. 삭제된 데이터는 복구할 수 없어요.</p>
      <button className="reset-row" onClick={onReset}><RotateCcw size={18} aria-hidden="true" /><span>모든 데이터 초기화</span><ChevronRight size={18} aria-hidden="true" /></button>
    </section>
    <footer className="app-info"><span className="brand">지금 카페인</span><span>나를 알아가는 한 잔의 기록</span></footer>
  </main>;
}
