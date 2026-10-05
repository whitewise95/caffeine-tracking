export function displayIntakeTime(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return '시간 선택'
  return `${hour < 12 ? '오전' : '오후'} ${hour % 12 || 12}:${String(minute).padStart(2, '0')}`
}
