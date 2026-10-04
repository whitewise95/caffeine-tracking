import { expect, test, type Page } from '@playwright/test';
import type { CaffeineEntry } from '../src/features/caffeine/model/caffeine.types';

const entries: CaffeineEntry[] = [
  { id: 'latte', drinkId: 'latte', drinkName: '카페라떼', caffeineMg: 85, consumedAt: '2024-02-29T15:10:00.000Z', icon: 'cup' },
  { id: 'espresso', drinkId: 'espresso', drinkName: '에스프레소', caffeineMg: 60, consumedAt: '2024-03-01T00:05:00+09:00', icon: 'coffee' },
  { id: 'tea', drinkId: 'tea', drinkName: '녹차', caffeineMg: 0, consumedAt: '2024-02-29T23:55:00+09:00', icon: 'tea' },
  { id: 'old-coffee', drinkId: 'americano', drinkName: '아메리카노', caffeineMg: 150, consumedAt: '2023-12-31T09:00:00+09:00', icon: 'coffee' },
];

async function openJournal(page: Page, theme = '', records = entries) {
  await page.addInitScript(records => {
    localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify({ version: 1, entries: records, customDrinks: [], settings: { halfLifeHours: 5 } }));
  }, records);
  await page.goto(`/history${theme}`);
}

test('journal filters local dates and updates the calendar after moving and deleting a record', async ({ page }, testInfo) => {
  await openJournal(page);
  const marchFirst = page.getByRole('button', { name: /^2024년 3월 1일/ });
  await expect(marchFirst).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('daily-total')).toHaveText('145');
  await expect(page.getByTestId('daily-count')).toHaveText('2');
  await expect(page.locator('.history-entry h3')).toHaveText(['에스프레소', '카페라떼']);

  await page.getByRole('button', { name: '이전 달', exact: true }).click();
  await expect(page.getByRole('heading', { name: '이날은 기록이 없어요' })).toBeVisible();
  const leapDay = page.getByRole('button', { name: /^2024년 2월 29일/ });
  await expect(leapDay).toHaveAccessibleName(/기록 1잔/);
  await leapDay.click();
  await expect(page.getByTestId('daily-total')).toHaveText('0');
  await expect(page.getByTestId('daily-count')).toHaveText('1');
  await page.getByRole('button', { name: '녹차 기록 수정' }).click();
  await page.getByLabel('카페인량 (mg)').fill('45');
  await page.getByLabel('섭취 시각').fill('2024-03-01T09:00');
  await page.getByRole('button', { name: '수정 저장' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(leapDay).toHaveAttribute('aria-pressed', 'true');
  await expect(leapDay).toHaveAccessibleName(/기록 없음/);
  await expect(page.getByTestId('daily-count')).toHaveText('0');

  await page.getByRole('button', { name: '다음 달', exact: true }).click();
  await marchFirst.click();
  await expect(page.getByTestId('daily-total')).toHaveText('190');
  await expect(page.locator('.history-entry h3')).toHaveText(['에스프레소', '카페라떼', '녹차']);
  await expect(page.getByRole('status')).not.toBeVisible();
  await page.screenshot({ path: `test-results/${testInfo.project.name}-journal.png`, fullPage: true });
  await page.getByRole('button', { name: '카페라떼 기록 삭제' }).click();
  await page.getByRole('button', { name: '삭제하기', exact: true }).click();
  await expect(page.getByTestId('daily-total')).toHaveText('105');
  await expect(page.getByTestId('daily-count')).toHaveText('2');
  await expect(marchFirst).toHaveAccessibleName(/기록 2잔/);
});

for (const scenario of [
  { now: '2026-10-04T09:00:00+09:00', today: '2026년 10월 4일', tomorrow: '2026년 10월 5일', previousLastDay: '2026년 9월 30일', visibleDays: 4 },
  { now: '2026-01-01T09:00:00+09:00', today: '2026년 1월 1일', tomorrow: '2026년 1월 2일', previousLastDay: '2025년 12월 31일', visibleDays: 1 },
]) {
  test(`journal hides future dates and months at ${scenario.today}`, async ({ page }, testInfo) => {
    await page.clock.install({ time: new Date(scenario.now) });
    await openJournal(page, '', [{ ...entries[0], id: 'future', consumedAt: '2027-02-01T09:00:00+09:00' }]);
    const today = page.getByRole('button', { name: new RegExp(`^${scenario.today}`) });
    await expect(today).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.calendar-day')).toHaveCount(scenario.visibleDays);
    await expect(page.getByRole('button', { name: new RegExp(`^${scenario.tomorrow}`) })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '다음 달', exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: '이전 달', exact: true }).click();
    await page.getByRole('button', { name: new RegExp(`^${scenario.previousLastDay}`) }).click();
    await page.getByRole('button', { name: '다음 달', exact: true }).click();
    await expect(today).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.calendar-day')).toHaveCount(scenario.visibleDays);
    await expect(page.getByRole('button', { name: '다음 달', exact: true })).toHaveCount(0);
    await page.screenshot({ path: `test-results/${testInfo.project.name}-journal-past-only-${scenario.visibleDays}.png` });
  });
}

test('journal crosses year boundaries and supports today, light theme and enlarged text', async ({ page }) => {
  await openJournal(page, '?theme=light');
  await page.getByRole('button', { name: '이전 달', exact: true }).click();
  await page.getByRole('button', { name: '이전 달', exact: true }).click();
  await page.getByRole('button', { name: '이전 달', exact: true }).click();
  await page.getByRole('button', { name: /^2023년 12월 31일/ }).click();
  await expect(page.getByTestId('daily-total')).toHaveText('150');
  await page.getByRole('button', { name: '다음 달', exact: true }).click();
  await expect(page.getByRole('button', { name: /^2024년 1월 31일/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '다음 달', exact: true }).click();
  await expect(page.getByRole('button', { name: /^2024년 2월 29일/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '오늘', exact: true }).click();
  const today = await page.evaluate(() => new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }));
  await expect(page.getByRole('button', { name: new RegExp(`^${today}`) })).toHaveAttribute('aria-pressed', 'true');
  const cells = await page.locator('.calendar-day').evaluateAll(elements => elements.map(element => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })));
  expect(cells.every(cell => cell.width >= 44 && cell.height >= 44)).toBe(true);
  await page.keyboard.press('Tab');
  await page.getByRole('button', { name: '이전 달', exact: true }).focus();
  expect(await page.getByRole('button', { name: '이전 달', exact: true }).evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
