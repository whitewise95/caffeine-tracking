export function formatHoursMinutes(hours: number): string {
  const totalMinutes = Math.round(hours * 60)
  const wholeHours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return [wholeHours > 0 ? `${wholeHours}시간` : '', minutes > 0 ? `${minutes}분` : ''].filter(Boolean).join(' ') || '0분'
}
