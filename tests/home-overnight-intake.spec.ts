import { expect, test, type Page } from '@playwright/test';

async function pickTime(page: Page, target: 'start' | 'end', time: string) {
  await page.getByRole('button', { name: target === 'start' ? '마시기 시작한 시각' : '마신 마지막 시각', exact: true }).click();
  const [hour, minute] = time.split(':').map(Number);
  await page.getByRole('button', { name: hour >= 12 ? '오후 선택' : '오전 선택', exact: true }).click();
  const hours = page.getByRole('spinbutton', { name: '시', exact: true });
  await hours.press('Home');
  for (let index = 1; index < (hour % 12 || 12); index++) await hours.press('ArrowUp');
  const minutes = page.getByRole('spinbutton', { name: '분', exact: true });
  await minutes.press('Home');
  for (let index = 0; index < minute; index++) await minutes.press('ArrowUp');
  await page.getByRole('button', { name: '완료', exact: true }).click();
}

test('home clock selection infers overnight dates, resets them for same-day times, and saves the completed interval', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-31T22:00:00+09:00') });
  await page.goto('/');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  await page.getByRole('switch', { name: '천천히 마셨어요' }).check();
  await expect(page.locator('input[type="date"]')).toHaveCount(0);
  await pickTime(page, 'start', '23:00');
  await pickTime(page, 'end', '01:00');
  await expect(page.getByLabel('마시기 시작한 날짜', { exact: true })).toHaveAttribute('datetime', '2026-10-31');
  await expect(page.getByLabel('마신 마지막 날짜', { exact: true })).toHaveAttribute('datetime', '2026-11-01');
  await expect(page.getByLabel('마신 기간', { exact: true })).toHaveText('2시간 동안');
  await expect(page.getByText('다음 날', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('마신 마지막 시각을 현재 또는 과거로 입력해 주세요.');
  // Editing the start also recalculates the inferred end day without accumulating days.
  await pickTime(page, 'start', '00:00');
  await expect(page.getByLabel('마신 마지막 날짜', { exact: true })).toHaveAttribute('datetime', '2026-10-31');
  await expect(page.getByLabel('마신 기간', { exact: true })).toHaveText('1시간 동안');
  await expect(page.getByText('다음 날', { exact: true })).toHaveCount(0);
  await pickTime(page, 'start', '23:00');
  await expect(page.getByLabel('마신 마지막 날짜', { exact: true })).toHaveAttribute('datetime', '2026-11-01');
  await page.clock.setSystemTime(new Date('2026-11-01T02:00:00+09:00'));
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const entries = await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!).entries);
  expect(entries[0]).toMatchObject({ startedAt: '2026-10-31T14:00:00.000Z', consumedAt: '2026-10-31T16:00:00.000Z' });
});

test('cancelling an overnight clock choice does not change dates or duration', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-06T12:00:00+09:00') });
  await page.goto('/');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  await page.getByRole('switch', { name: '천천히 마셨어요' }).check();
  await page.getByRole('button', { name: '마신 마지막 시각', exact: true }).click();
  await page.getByRole('spinbutton', { name: '시', exact: true }).press('Home');
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await expect(page.getByLabel('마신 마지막 날짜', { exact: true })).toHaveAttribute('datetime', '2026-10-06');
  await expect(page.getByRole('button', { name: '마신 마지막 시각', exact: true })).toHaveText('오후 12:00');
  await expect(page.getByLabel('마신 기간', { exact: true })).toHaveText('30분 동안');
});

test('home slow intake defaults to today even just after midnight', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-06T00:10:00+09:00') });
  await page.goto('/');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  await page.getByRole('switch', { name: '천천히 마셨어요' }).check();
  await expect(page.getByLabel('마시기 시작한 날짜', { exact: true })).toHaveAttribute('datetime', '2026-10-06');
  await expect(page.getByRole('button', { name: '마시기 시작한 시각', exact: true })).toHaveText('오전 12:00');
  await expect(page.getByLabel('마신 기간', { exact: true })).toHaveText('10분 동안');
});
