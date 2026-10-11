import { remainingCaffeine } from '../../caffeine/model/caffeine';
import type { CaffeineEntry } from '../../caffeine/model/caffeine.types';
import { recordedEntries } from './report';

export type BedtimeAmountLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

export interface SleepInsight {
  /** App-defined amount bands for copy, not clinical sleep-impact categories. */
  kind: 'no-records' | BedtimeAmountLevel;
  title: string;
  context: string;
  effect: string;
  intakeGap: string | null;
}

/** Match the displayed whole mg so the number and its description agree. */
export function bedtimeAmountLevel(remainingMg: number): BedtimeAmountLevel {
  const displayedMg = Math.round(remainingMg);
  if (displayedMg < 25) return 'VERY_LOW';
  if (displayedMg < 50) return 'LOW';
  if (displayedMg < 100) return 'MODERATE';
  if (displayedMg < 150) return 'HIGH';
  return 'VERY_HIGH';
}

const amountCopy: Record<BedtimeAmountLevel, { title: string; effect: string }> = {
  VERY_LOW: {
    title: '남아 있는 카페인이 적은 편이에요',
    effect: '예상 잔존량은 적지만, 카페인에 민감하다면 수면에 영향을 받을 수 있어요.',
  },
  LOW: {
    title: '카페인이 조금 남아 있어요',
    effect: '소량의 카페인이 남을 것으로 추정돼요. 카페인에 민감하다면 잠드는 데 영향을 받을 수 있어요.',
  },
  MODERATE: {
    title: '수면에 영향을 줄 수 있어요',
    effect: '아직 카페인이 남을 것으로 추정돼요. 민감도에 따라 잠드는 시간이 늦어지거나 깊은 수면이 줄어들 수 있어요.',
  },
  HIGH: {
    title: '취침 무렵에도 카페인이 꽤 남아요',
    effect: '취침 시각에도 카페인이 남을 것으로 추정돼요. 잠들기나 깊은 수면에 영향을 줄 수 있으니 추가 카페인 섭취는 줄이는 편을 고려해 보세요.',
  },
  VERY_HIGH: {
    title: '많은 카페인이 남아 있어요',
    effect: '취침 시각에도 카페인이 많이 남을 것으로 추정돼요. 카페인은 잠들기나 깊은 수면에 영향을 줄 수 있어요. 추가 섭취는 예상 잔존량을 더 늘릴 수 있어요.',
  },
};

export function sleepInsight(entries: readonly CaffeineEntry[], now: Date, bedtime: Date, halfLifeHours: number): SleepInsight {
  const recorded = recordedEntries(entries, now).filter(entry => entry.caffeineMg > 0);
  if (!recorded.length) return {
    kind: 'no-records', title: '해석할 섭취 기록이 없어요',
    context: '음료를 기록하면 취침 무렵의 추정량과 마신 시각을 함께 살펴볼 수 있어요.',
    effect: '기록이 없다는 것이 실제 카페인 섭취가 없었다는 뜻은 아니에요.', intakeGap: null,
  };
  const latest = recorded.reduce((last, entry) => Date.parse(entry.consumedAt) > Date.parse(last.consumedAt) ? entry : last);
  const elapsedMinutes = Math.max(0, Math.floor((bedtime.getTime() - Date.parse(latest.consumedAt)) / 60_000));
  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;
  const intakeGap = `마지막 섭취 후 ${hours ? `${hours}시간` : ''}${hours && minutes ? ' ' : ''}${minutes || !hours ? `${minutes}분` : ''}`;
  const predicted = remainingCaffeine(recorded, bedtime, halfLifeHours);
  const amount = Math.round(predicted).toLocaleString('ko-KR');
  const kind = bedtimeAmountLevel(predicted);
  return {
    kind, ...amountCopy[kind],
    context: predicted < 1 ? '선택한 취침 시각의 추정 잔존량은 1mg 미만이에요.' : `선택한 취침 시각에는 약 ${amount}mg이 남을 것으로 추정돼요.`,
    intakeGap,
  };
}
