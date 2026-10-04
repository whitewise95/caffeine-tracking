import type { TimeInterval } from '../model/types';

export function formatMoment(value: string, timeZone?: string) {
  return new Date(value).toLocaleString('ko-KR', {
    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone,
  });
}

export function formatInterval(interval: TimeInterval, timeZone?: string) {
  return `${formatMoment(interval.start, timeZone)} – ${formatMoment(interval.end, timeZone)}`;
}

export function formatTargetDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export function toLocalDateTime(value: string | Date) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
