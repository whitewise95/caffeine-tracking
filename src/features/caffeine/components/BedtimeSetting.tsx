import { ChevronDown, Clock3, Moon } from 'lucide-react';
import { remainingCaffeine } from '../model/caffeine';
import { nextClockTime } from '../model/bedtime';
import type { CaffeineEntry } from '../model/caffeine.types';
import { recordedEntries } from '../../insights/model/report';
import { sleepInsight } from '../../insights/model/sleepInsight';
import { displayIntakeTime } from './intakeTimeFormat';
import './bedtime-setting.css';

export function BedtimeSetting({ entries, now, halfLifeHours, bedtime, busy, onPickBedtime }: {
  entries: CaffeineEntry[];
  now: Date;
  halfLifeHours: number;
  bedtime: string;
  busy: boolean;
  onPickBedtime: () => void;
}) {
  const target = nextClockTime(now, bedtime);
  const predicted = remainingCaffeine(recordedEntries(entries, now), target, halfLifeHours);
  const sleep = sleepInsight(entries, now, target, halfLifeHours);
  return <details className="settings-section settings-accordion settings-bedtime">
    <summary><h2 className="section-heading"><Moon size={18} aria-hidden="true" /><span>잠들 무렵에는</span></h2><ChevronDown className="settings-accordion-chevron" size={18} aria-hidden="true" /></summary>
    <div className="settings-accordion-content">
      <p className="settings-description bedtime-setting-intro">예정 시각을 바꿔 예상량을 살펴보세요.</p>
      <div className="bedtime-setting-summary">
        <div className="bedtime-setting-time"><button type="button" aria-label="예정 취침 시각" aria-haspopup="dialog" disabled={busy} onClick={onPickBedtime}><span>{displayIntakeTime(bedtime)}</span><Clock3 size={17} aria-hidden="true" /></button></div>
        <div className="bedtime-setting-reading"><span>추정 잔존량</span><p><strong data-testid="bedtime-mg">{Math.round(predicted).toLocaleString('ko-KR')}</strong><span>mg</span></p></div>
      </div>
      <div className="bedtime-setting-insight" aria-live="polite" aria-atomic="true"><h3>{sleep.title}</h3><p className="settings-description">{sleep.context}</p><p className="settings-description bedtime-setting-effect">{sleep.effect}</p>{sleep.intakeGap && <p className="model-disclaimer">{sleep.intakeGap} · 수면에 미치는 영향은 개인차가 있어요.</p>}</div>
    </div>
  </details>;
}
