import { test, expect } from '@playwright/test';
import { createInitialState, localDateKey, remainingCaffeine } from '../src/features/caffeine/model/caffeine';
import type { CaffeineEntry } from '../src/features/caffeine/model/caffeine.types';
import { chooseBedtime, openBedtimeSettings } from './helpers/bedtime';

const now = new Date('2026-10-06T16:00:00+09:00');
const entries: CaffeineEntry[] = [
  { id: '1', drinkId: 'coffee', drinkName: '아메리카노', caffeineMg: 150, icon: 'coffee', consumedAt: '2026-10-06T09:00:00+09:00' },
  { id: '2', drinkId: 'tea', drinkName: '얼그레이', caffeineMg: 45, icon: 'tea', consumedAt: '2026-10-06T14:00:00+09:00' },
  { id: '3', drinkId: 'coffee', drinkName: '아메리카노', caffeineMg: 200, icon: 'coffee', consumedAt: '2026-10-05T19:00:00+09:00' },
  { id: '4', drinkId: 'coffee', drinkName: '아메리카노', caffeineMg: 300, icon: 'coffee', consumedAt: '2026-09-05T19:00:00+09:00' },
];
for (const theme of ['dark']) {
  test(`a full-month intake chart scrolls wide bars and stays within the card ${theme}`, async ({ page }, info) => {
    await page.clock.install({ time: new Date('2026-10-31T16:00:00+09:00') });
    await page.addInitScript(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), {
      ...createInitialState(),
      entries: [
        { ...entries[0], id: 'first-day', consumedAt: '2026-10-01T09:00:00+09:00', caffeineMg: 150 },
        { ...entries[0], id: 'last-day', consumedAt: '2026-10-31T09:00:00+09:00', caffeineMg: 200 },
      ],
      settings: { halfLifeHours: 4.5, theme },
    });
    await page.goto('/insights');
    await page.getByRole('button', { name: '이번 달', exact: true }).click();
    const card = page.getByRole('region', { name: '이번 달의 섭취', exact: true });
    const chart = card.getByRole('slider', { name: '섭취 날짜 선택' });
    await expect(chart).toHaveAttribute('aria-valuemax', '30');
    await expect(chart).toHaveAttribute('aria-valuetext', '10월 31일, 1잔, 200mg');
    expect(await chart.evaluate(element => element.scrollWidth / element.clientWidth)).toBeCloseTo(31 / 7, 1);
    await chart.press('Home');
    const box = (await chart.boundingBox())!;
    await chart.tap({ position: { x: box.width * .5 / 7, y: 60 } });
    await expect(chart).toHaveAttribute('aria-valuetext', '10월 1일, 1잔, 150mg');
    await chart.press('End');
    await chart.tap({ position: { x: box.width * 6.5 / 7, y: 60 } });
    await expect(chart).toHaveAttribute('aria-valuetext', '10월 31일, 1잔, 200mg');
    await card.screenshot({ path: info.outputPath(`intake-month-${theme}.png`) });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await card.scrollIntoViewIfNeeded();
    expect(await card.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await chart.press('Home');
    await expect(chart).toHaveAttribute('aria-valuetext', '10월 1일, 1잔, 150mg');
    await card.getByRole('button', { name: '이날 기록 보기', exact: true }).click();
    await expect(page.getByTestId('daily-total')).toHaveText('150');
  });
  test(`calendar colors use fixed daily record counts instead of caffeine amounts ${theme}`, async ({ page }, info) => {
    await page.clock.install({ time: now });
    const countedEntries: CaffeineEntry[] = [
      ...[600].map((dose, i) => ({ ...entries[0], id: `one-${i}`, caffeineMg: dose, consumedAt: '2026-10-01T09:00:00+09:00' })),
      ...[10, 10].map((dose, i) => ({ ...entries[0], id: `two-${i}`, caffeineMg: dose, consumedAt: '2026-10-02T09:00:00+09:00' })),
      ...[5, 5, 5].map((dose, i) => ({ ...entries[0], id: `three-${i}`, caffeineMg: dose, consumedAt: '2026-10-03T09:00:00+09:00' })),
      ...[2, 2, 2, 2].map((dose, i) => ({ ...entries[0], id: `four-${i}`, caffeineMg: dose, consumedAt: '2026-10-04T09:00:00+09:00' })),
      ...[1, 1, 1, 1, 1].map((dose, i) => ({ ...entries[0], id: `five-${i}`, caffeineMg: dose, consumedAt: '2026-10-05T09:00:00+09:00' })),
    ];
    await page.addInitScript(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), { ...createInitialState(), entries: countedEntries, settings: { halfLifeHours: 4.5, theme } });
    await page.goto('/insights');
    const calendar = page.getByRole('region', { name: '10월 기록 달력' });
    await expect(calendar.getByRole('button', { name: '10월 1일, 1잔, 600mg', exact: true }).locator('span')).toHaveAttribute('data-level', '1');
    await expect(calendar.getByRole('button', { name: '10월 2일, 2잔, 20mg', exact: true }).locator('span')).toHaveAttribute('data-level', '2');
    await expect(calendar.getByRole('button', { name: '10월 3일, 3잔, 15mg', exact: true }).locator('span')).toHaveAttribute('data-level', '3');
    await expect(calendar.getByRole('button', { name: '10월 4일, 4잔, 8mg', exact: true }).locator('span')).toHaveAttribute('data-level', '4');
    await expect(calendar.getByRole('button', { name: '10월 5일, 5잔, 5mg', exact: true }).locator('span')).toHaveAttribute('data-level', '4');
    await expect(calendar.getByRole('button', { name: '10월 6일, 기록 없음', exact: true }).locator('span')).toHaveAttribute('data-level', '0');
    await expect(calendar.getByRole('group', { name: '하루 기록 수별 색상' }).locator(':scope > span')).toHaveText(['0개', '1개', '2개', '3개', '4개 이상']);
    await calendar.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`calendar-counts-${theme}.png`), fullPage: true });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    expect(await calendar.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
  test(`report predicts, switches periods, selects charts and opens dated history ${theme}`, async ({ page }, info) => {
    await page.clock.install({ time: now });
    await page.addInitScript(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), { ...createInitialState(), entries, settings: { halfLifeHours: 4.5, theme } });
    await page.goto('/');
    await page.getByRole('button', { name: '리포트', exact: true }).click();
    await expect(page).toHaveURL(/\/insights/);
    await expect(page.getByRole('button', { name: '리포트', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { name: '카페인 리포트', exact: true })).toBeVisible();
    const atTen = new Date('2026-10-06T22:00:00+09:00');
    await expect(page.getByTestId('report-evening-mg')).toHaveText(String(Math.round(remainingCaffeine(entries, atTen, 4.5))));
    await expect(page.getByTestId('report-current-mg')).toHaveText(String(Math.round(remainingCaffeine(entries, now, 4.5))));
    const forecastChart = page.getByRole('slider', { name: '예측 시각 선택' });
    await expect(page.locator('input[type=range]')).toHaveCount(0);
    const forecastBox = await forecastChart.boundingBox();
    await forecastChart.tap({ position: { x: forecastBox!.width / 2, y: forecastBox!.height / 2 } });
    expect(Math.abs(Number(await forecastChart.getAttribute('aria-valuenow')) - 720)).toBeLessThanOrEqual(5);
    await forecastChart.press('End');
    await expect(forecastChart).toHaveAttribute('aria-valuenow', '1440');
    await expect(page.getByRole('slider', { name: '예측 시각 선택' })).toHaveAttribute('aria-valuetext', /16:00/);
    await openBedtimeSettings(page);
    await expect(page.getByRole('heading', { name: '카페인이 조금 남아 있어요' })).toBeVisible();
    await expect(page.locator('.bedtime-setting-insight')).toContainText('마지막 섭취 후 9시간');
    await chooseBedtime(page, '01:00');
    await expect(page.getByRole('heading', { name: '남아 있는 카페인이 적은 편이에요' })).toBeVisible();
    await expect(page.locator('.bedtime-setting-insight')).toContainText('마지막 섭취 후 11시간');
    await expect(page.getByTestId('bedtime-mg')).toHaveText(String(Math.round(remainingCaffeine(entries, new Date('2026-10-07T01:00:00+09:00'), 4.5))));
    await page.getByRole('navigation').getByRole('button', { name: '리포트', exact: true }).click();
    const currentReport = page.getByRole('region', { name: '현재와 앞으로', exact: true });
    const periodReport = page.getByRole('region', { name: '기간별 기록', exact: true });
    const monthlyReport = page.getByRole('region', { name: '이번 달 기록', exact: true });
    const currentBefore = await currentReport.textContent();
    const monthlyBefore = await monthlyReport.textContent();
    await expect(currentReport.getByRole('slider', { name: '예측 시각 선택' })).toHaveCount(1);
    await expect(currentReport.getByRole('group', { name: '리포트 기간' })).toHaveCount(0);
    await expect(periodReport.getByRole('heading', { name: '오늘의 섭취', exact: true })).toHaveCount(1);
    await expect(periodReport.getByRole('heading', { name: '어제와 비교', exact: true })).toHaveCount(0);
    await expect(periodReport.getByRole('heading', { name: '기록에서 발견한 패턴', exact: true })).toHaveCount(1);
    await monthlyReport.getByRole('button', { name: '월간 그래프 보기', exact: true }).click();
    await expect(periodReport.getByRole('heading', { name: '기간별 기록', exact: true })).toBeInViewport();
    expect(await currentReport.textContent()).toBe(currentBefore);
    expect(await monthlyReport.textContent()).toBe(monthlyBefore);
    await expect(page.getByRole('button', { name: '이번 달', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { name: '이번 달의 섭취' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '지난달 같은 기간과 비교' })).toHaveCount(0);
    const intakeChart = page.getByRole('slider', { name: '섭취 날짜 선택' });
    await expect(page.locator('.report-bars input')).toHaveCount(0);
    await expect(intakeChart).not.toHaveJSProperty('tagName', 'INPUT');
    const chartBox = await intakeChart.boundingBox();
    await intakeChart.tap({ position: { x: chartBox!.width * 4.5 / 6, y: chartBox!.height / 2 } });
    await expect(page.getByRole('slider', { name: '섭취 날짜 선택' })).toHaveAttribute('aria-valuetext', /200mg/);
    await page.getByRole('button', { name: '10월 5일, 1잔, 200mg', exact: true }).click();
    await page.getByRole('region', { name: '10월 기록 달력', exact: true }).getByRole('button', { name: '이날 기록 보기', exact: true }).click();
    await expect(page).toHaveURL(/\/history/);
    await expect(page.getByTestId('daily-total')).toHaveText('200');
    await page.goBack();
    await expect(page.getByRole('heading', { name: '카페인 리포트', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '7일', exact: true }).click();
    await expect(page.getByRole('heading', { name: '7일간의 섭취' })).toBeVisible();
    await expect(page.getByRole('slider', { name: '섭취 날짜 선택' })).toHaveAttribute('aria-valuemax', '6');
    await page.getByRole('slider', { name: '섭취 날짜 선택' }).press('Home');
    await expect(page.getByRole('slider', { name: '섭취 날짜 선택' })).toHaveAttribute('aria-valuenow', '0');
    await page.getByRole('slider', { name: '섭취 날짜 선택' }).press('End');
    await expect(page.getByRole('slider', { name: '섭취 날짜 선택' })).toHaveAttribute('aria-valuenow', '6');
    await page.screenshot({ path: info.outputPath(`report-${theme}.png`), fullPage: true });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const last = page.locator('.report-footer');
    await last.scrollIntoViewIfNeeded();
    const footer = await last.boundingBox();
    const nav = await page.getByRole('navigation', { name: '주요 메뉴' }).boundingBox();
    expect(footer!.y + footer!.height).toBeLessThan(nav!.y);
  });
  test(`empty report makes missing data explicit and supports direct route ${theme}`, async ({ page }) => {
    await page.clock.install({ time: now });
    await page.addInitScript(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), { ...createInitialState(), settings: { halfLifeHours: 4.5, theme } });
    await page.goto('/insights');
    await expect(page.getByTestId('report-current-mg')).toHaveText('0');
    await expect(page.getByTestId('report-evening-mg')).toHaveText('0');
    await expect(page.getByRole('heading', { name: '해석할 섭취 기록이 없어요' })).toHaveCount(0);
    await expect(page.getByText('두 기간에 기록이 쌓이면 섭취량과 시간의 변화를 비교해 드릴게요.')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '10월 6일, 기록 없음' })).toBeEnabled();
    await expect(page.getByRole('button', { name: '10월 7일, 아직 오지 않은 날짜' })).toBeDisabled();
    await page.reload();
    await expect(page.getByRole('heading', { name: '카페인 리포트', exact: true })).toBeVisible();
    await openBedtimeSettings(page);
    await expect(page.getByRole('heading', { name: '해석할 섭취 기록이 없어요' })).toBeVisible();
    expect(localDateKey(now)).toBe('2026-10-06');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('forecast time can be adjusted by one minute with touch controls and clamps at both ends', async ({ page }, info) => {
  await page.clock.install({ time: now });
  await page.addInitScript(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), { ...createInitialState(), entries });
  await page.goto('/insights');
  const chart = page.getByRole('slider', { name: '예측 시각 선택' });
  const earlier = page.getByRole('button', { name: '예측 시각 1분 앞당기기', exact: true });
  const later = page.getByRole('button', { name: '예측 시각 1분 늦추기', exact: true });
  await expect(chart).toHaveAttribute('aria-valuetext', /^22:00,/);
  await later.tap();
  await expect(chart).toHaveAttribute('aria-valuetext', /^22:01,/);
  await earlier.tap();
  await expect(chart).toHaveAttribute('aria-valuetext', /^22:00,/);
  await chart.press('ArrowRight');
  const exactAmount = Math.round(remainingCaffeine(entries, new Date('2026-10-06T22:01:00+09:00'), 4.5));
  await expect(chart).toHaveAttribute('aria-valuetext', `22:01, 추정 ${exactAmount}mg`);
  await page.clock.fastForward(60_000);
  await expect(chart).toHaveAttribute('aria-valuetext', `22:01, 추정 ${exactAmount}mg`);
  expect((await later.boundingBox())!.width).toBeGreaterThanOrEqual(44);
  await chart.press('Home');
  await expect(earlier).toBeDisabled();
  await later.tap();
  await expect(chart).toHaveAttribute('aria-valuetext', /^16:02,/);
  await chart.press('End');
  await expect(later).toBeDisabled();
  await earlier.tap();
  await expect(chart).toHaveAttribute('aria-valuetext', /^내일 16:00,/);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.report-hero').screenshot({ path: info.outputPath('forecast-minute-controls.png') });
});

test('calendar initially selects today even without records and changing selection uses the primary border', async ({ page }, info) => {
  await page.clock.install({ time: now });
  await page.addInitScript(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), createInitialState());
  await page.goto('/insights');
  const calendar = page.getByRole('region', { name: '10월 기록 달력', exact: true });
  const today = calendar.getByRole('button', { name: '10월 6일, 기록 없음', exact: true });
  await expect(today).toHaveAttribute('aria-pressed', 'true');
  await expect(calendar.locator('.report-heatmap-detail')).toContainText('10월 6일');
  const primary = await calendar.evaluate(element => getComputedStyle(element).getPropertyValue('--accent-pink').trim());
  const border = await today.locator('span').evaluate(element => {
    const probe = document.createElement('span');
    probe.style.color = getComputedStyle(element).getPropertyValue('--accent-pink');
    element.append(probe);
    const expected = getComputedStyle(probe).color;
    probe.remove();
    return { actual: getComputedStyle(element).outlineColor, expected };
  });
  expect(primary).not.toBe('');
  expect(border.actual).toBe(border.expected);
  await calendar.getByRole('button', { name: '10월 5일, 기록 없음', exact: true }).tap();
  await expect(today).toHaveAttribute('aria-pressed', 'false');
  await expect(calendar.getByRole('button', { name: '10월 5일, 기록 없음', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await calendar.screenshot({ path: info.outputPath('calendar-primary-selection.png') });
  await calendar.getByRole('button', { name: '이날 기록 보기', exact: true }).click();
  await expect(page).toHaveURL(/\/history/);
  await expect(page.getByTestId('daily-total')).toHaveText('0');
});

test('holding forecast arrows accelerates minute adjustments and releasing does not add an extra minute', async ({ page }) => {
  await page.clock.install({ time: now });
  await page.goto('/insights');
  const chart = page.getByRole('slider', { name: '예측 시각 선택' });
  const later = page.getByRole('button', { name: '예측 시각 1분 늦추기', exact: true });
  const earlier = page.getByRole('button', { name: '예측 시각 1분 앞당기기', exact: true });
  await later.scrollIntoViewIfNeeded();
  await page.clock.pauseAt(await page.evaluate(() => new Date(Date.now() + 100)));
  const box = (await later.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.clock.runFor(900);
  const slow = Number(await chart.getAttribute('aria-valuenow'));
  expect(slow).toBeGreaterThan(360);
  expect(slow).toBeLessThan(370);
  await page.clock.runFor(2100);
  const fast = Number(await chart.getAttribute('aria-valuenow'));
  expect(fast - slow).toBeGreaterThan(20);
  await page.mouse.up();
  await page.clock.runFor(1000);
  await expect(chart).toHaveAttribute('aria-valuenow', String(fast));
  await later.tap();
  await expect(chart).toHaveAttribute('aria-valuenow', String(fast + 1));
  await earlier.press('Enter');
  await expect(chart).toHaveAttribute('aria-valuenow', String(fast));
  await expect(page.locator('.report-hero > .report-note')).toHaveCount(0);
  await chart.press('End');
  await earlier.tap();
  await later.dispatchEvent('pointerdown', { pointerId: 4, pointerType: 'touch', button: 0, isPrimary: true });
  await page.clock.runFor(2000);
  await expect(chart).toHaveAttribute('aria-valuenow', '1440');
  await expect(later).toBeDisabled();
  await chart.press('Home');
  await later.tap();
  await earlier.dispatchEvent('pointerdown', { pointerId: 5, pointerType: 'touch', button: 0, isPrimary: true });
  await page.clock.runFor(2000);
  await expect(chart).toHaveAttribute('aria-valuenow', '0');
  await expect(earlier).toBeDisabled();
});

test('forecast holds stop on touch cancellation, leaving the button, backgrounding and leaving the page', async ({ page }) => {
  await page.clock.install({ time: now });
  await page.goto('/insights');
  const chart = page.getByRole('slider', { name: '예측 시각 선택' });
  const earlier = page.getByRole('button', { name: '예측 시각 1분 앞당기기', exact: true });
  await earlier.scrollIntoViewIfNeeded();
  await page.clock.pauseAt(await page.evaluate(() => new Date(Date.now() + 100)));
  for (const reason of ['cancel', 'leave', 'blur', 'hidden']) {
    const before = Number(await chart.getAttribute('aria-valuenow'));
    await earlier.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', button: 0, isPrimary: true });
    await page.clock.runFor(800);
    const adjusted = Number(await chart.getAttribute('aria-valuenow'));
    expect(adjusted).toBeLessThan(before);
    if (reason === 'cancel') await earlier.dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'touch' });
    else if (reason === 'leave') await earlier.dispatchEvent('pointermove', { pointerId: 1, pointerType: 'touch', clientX: -1, clientY: -1 });
    else if (reason === 'blur') await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    else await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.runFor(1000);
    await expect(chart).toHaveAttribute('aria-valuenow', String(adjusted));
  }
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await earlier.dispatchEvent('pointerdown', { pointerId: 2, pointerType: 'touch', button: 0, isPrimary: true });
  await page.clock.runFor(800);
  await page.getByRole('button', { name: '홈', exact: true }).click();
  await page.clock.runFor(4000);
  await page.getByRole('button', { name: '리포트', exact: true }).click();
  await expect(chart).toHaveAttribute('aria-valuenow', '360');
});
