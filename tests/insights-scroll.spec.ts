import { test, expect, type Locator, type Page } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';

async function swipe(page: Page, chart: Locator, direction: number) {
  await chart.scrollIntoViewIfNeeded();
  const box = (await chart.boundingBox())!;
  const client = await page.context().newCDPSession(page);
  const x = box.x + box.width * (direction > 0 ? .25 : .75);
  const y = box.y + 70;
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let step = 1; step <= 8; step++) await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove', touchPoints: [{ x: x + direction * box.width * .5 * step / 8, y }],
  });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await client.detach();
  // Native touch scrolling continues on the compositor after touchEnd.
  let previous = -1;
  let stable = 0;
  await expect.poll(async () => {
    const left = await chart.evaluate(element => element.scrollLeft);
    stable = Math.abs(left - previous) < .5 ? stable + 1 : 0;
    previous = left;
    return stable;
  }, { intervals: [50], timeout: 3000 }).toBeGreaterThanOrEqual(3);
}

test('today starts at the current hour, touch swipes browse without selecting, and taps and keys select wide bars', async ({ page }, info) => {
  await page.clock.install({ time: new Date('2026-10-06T15:00:00+09:00') });
  await page.addInitScript(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), {
    ...createInitialState(), entries: [{ id: 'tea', drinkId: 'tea', drinkName: '차', icon: 'tea', caffeineMg: 40, consumedAt: '2026-10-06T14:00:00+09:00' }],
  });
  await page.goto('/insights');
  const card = page.getByRole('region', { name: '오늘의 섭취', exact: true });
  const chart = card.getByRole('slider', { name: '섭취 시간 선택' });
  await chart.scrollIntoViewIfNeeded();
  await expect(chart).toHaveAttribute('aria-valuetext', '15:00, 0잔, 0mg');
  expect(await chart.evaluate(element => element.scrollLeft / element.clientWidth * 7)).toBeCloseTo(12, 1);
  expect(await chart.evaluate(element => element.scrollWidth / element.clientWidth)).toBeCloseTo(24 / 7, 1);
  await card.screenshot({ path: info.outputPath('today-current-hour.png') });
  const before = await chart.evaluate(element => element.scrollLeft);
  await swipe(page, chart, -1);
  await expect.poll(() => chart.evaluate(element => element.scrollLeft)).toBeGreaterThan(before + 40);
  await expect(chart).toHaveAttribute('aria-valuenow', '15');
  await chart.press('Home');
  await expect.poll(() => chart.evaluate(element => element.scrollLeft)).toBe(0);
  await expect(card.getByRole('button', { name: '이전 구간 보기' })).toBeDisabled();
  await card.getByRole('button', { name: '다음 구간 보기' }).click();
  await expect.poll(() => chart.evaluate(element => element.scrollLeft / element.clientWidth * 7)).toBeCloseTo(7, 1);
  const box = (await chart.boundingBox())!;
  await chart.tap({ position: { x: box.width * .5 / 7, y: 60 } });
  await expect(chart).toHaveAttribute('aria-valuetext', '07:00, 0잔, 0mg');
  await chart.press('End');
  await expect(chart).toHaveAttribute('aria-valuenow', '23');
  await expect(card.getByRole('button', { name: '다음 구간 보기' })).toBeDisabled();
  await chart.press('Home');
  for (let i = 0; i < 14; i++) await chart.press('ArrowRight');
  await expect(chart).toHaveAttribute('aria-valuetext', '14:00, 1잔, 40mg');
  await card.screenshot({ path: info.outputPath('today-seven-hours.png') });
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await card.screenshot({ path: info.outputPath('today-seven-hours-large-text.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('month swipes and mouse drags browse earlier days without changing selection or records', async ({ page }, info) => {
  await page.clock.install({ time: new Date('2026-10-31T15:00:00+09:00') });
  await page.goto('/insights');
  await page.getByRole('button', { name: '이번 달', exact: true }).click();
  const card = page.getByRole('region', { name: '이번 달의 섭취', exact: true });
  const chart = card.getByRole('slider', { name: '섭취 날짜 선택' });
  await chart.scrollIntoViewIfNeeded();
  await expect(chart).toHaveAttribute('aria-valuetext', '10월 31일, 0잔, 0mg');
  const before = await chart.evaluate(element => element.scrollLeft);
  await swipe(page, chart, 1);
  await expect.poll(() => chart.evaluate(element => element.scrollLeft)).toBeLessThan(before - 40);
  await expect(chart).toHaveAttribute('aria-valuenow', '30');
  await chart.press('End');
  const box = (await chart.boundingBox())!;
  await page.mouse.move(box.x + box.width * .25, box.y + 60);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .75, box.y + 60, { steps: 10 });
  await page.mouse.up();
  await expect.poll(() => chart.evaluate(element => element.scrollLeft)).toBeLessThan(before - 40);
  await expect(chart).toHaveAttribute('aria-valuenow', '30');
  await chart.press('Home');
  await chart.tap({ position: { x: box.width * 3.5 / 7, y: 60 } });
  await expect(chart).toHaveAttribute('aria-valuetext', '10월 4일, 0잔, 0mg');
  await card.screenshot({ path: info.outputPath('month-seven-days.png') });
  await card.getByRole('button', { name: '이날 기록 보기', exact: true }).click();
  await expect(page).toHaveURL(/\/history/);
  await expect(page.getByTestId('daily-total')).toHaveText('0');
});

test('midnight and a short month stay within available hours and days', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-01T00:30:00+09:00') });
  await page.goto('/insights');
  const today = page.getByRole('region', { name: '오늘의 섭취', exact: true });
  await expect(today.getByRole('slider')).toHaveAttribute('aria-valuenow', '0');
  await expect(today.getByRole('button', { name: '이전 구간 보기' })).toBeDisabled();
  await page.getByRole('button', { name: '이번 달', exact: true }).click();
  const month = page.getByRole('region', { name: '이번 달의 섭취', exact: true });
  await expect(month.getByRole('slider')).toHaveAttribute('aria-valuemax', '0');
  await expect(month.getByRole('button', { name: /구간 보기/ })).toHaveCount(0);
  expect(await month.getByRole('slider').evaluate(element => element.scrollWidth === element.clientWidth)).toBe(true);
});
