import { expect, test, type Page } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';
import { pickTime } from './helpers/time-picker';
import type { CaffeineEntry } from '../src/features/caffeine/model/caffeine.types';

const storageKey = 'caffeine-tracker:state:v1';

async function openApp(page: Page, now = '2026-10-04T10:00:00+09:00', suffix = '') {
  await page.clock.setFixedTime(new Date(now));
  const initial = createInitialState();
  await page.addInitScript(({ initial, storageKey }) => {
    if (!localStorage.getItem(storageKey)) localStorage.setItem(storageKey, JSON.stringify(initial));
  }, { initial, storageKey });
  await page.goto(`/${suffix}`);
}

async function selectAmericano(page: Page) {
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
}

async function setPeriod(page: Page, start: string, end: string) {
  await page.getByRole('button', { name: '천천히 마시기', exact: true }).click();
  const startDate = page.getByLabel('마시기 시작한 날짜', { exact: true });
  if (await startDate.evaluate(element => element.tagName === 'INPUT')) await startDate.fill(start.slice(0, 10));
  else await expect(startDate).toHaveAttribute('datetime', start.slice(0, 10));
  await pickTime(page, '마시기 시작한 시각', start.slice(11));
  const endDate = page.getByLabel('마신 마지막 날짜', { exact: true });
  if (await endDate.evaluate(element => element.tagName === 'INPUT')) await endDate.fill(end.slice(0, 10));
  await pickTime(page, '마신 마지막 시각', end.slice(11));
}

async function savedEntries(page: Page): Promise<CaffeineEntry[]> {
  return page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)!).entries, storageKey);
}

test('the default record remains instantaneous and does not store a start time', async ({ page }) => {
  await openApp(page);
  await selectAmericano(page);
  await expect(page.getByRole('switch', { name: '천천히 마셨어요' })).toHaveCount(0);
  await expect(page.getByLabel('마신 시각', { exact: true })).toContainText('오전 10:00');
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const [entry] = await savedEntries(page);
  expect(entry).not.toHaveProperty('startedAt');
  expect(new Date(entry.consumedAt).getTime()).toBeGreaterThanOrEqual(new Date('2026-10-04T10:00:00+09:00').getTime());
  await expect(page.getByTestId('remaining-mg')).toHaveText('0');
});

test('slow intake survives reload, edits its period, and can return to an instantaneous entry', async ({ page }) => {
  await openApp(page);
  await selectAmericano(page);
  await setPeriod(page, '2026-10-04T09:00', '2026-10-04T10:00');
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  // Independently integrated 150 mg over the preceding hour: 110.066 mg absorbed and remaining (4.5 h half-life).
  await expect(page.getByTestId('remaining-mg')).toHaveText('110');
  const [entry] = await savedEntries(page);
  expect(entry.startedAt).toBe('2026-10-04T00:00:00.000Z');
  expect(entry.consumedAt).toBe('2026-10-04T01:00:00.000Z');
  await page.getByRole('button', { name: '아직 남아 있는 카페인 보기' }).click();
  await expect(page.getByRole('region', { name: '아직 남아 있는 카페인' }).locator('time')).toHaveText('오늘 09:00 – 10:00');
  await page.reload();
  await expect(page.getByTestId('remaining-mg')).toHaveText('110');
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
  await expect(page.locator('.entry-intake-period')).toHaveText('09:00 – 10:00');
  await page.getByRole('button', { name: '아메리카노 기록 수정' }).click();
  await expect(page.getByRole('button', { name: '마신 마지막 시각', exact: true })).toContainText('오전 10:00');
  await pickTime(page, '마시기 시작한 시각', '08:00');
  await page.getByRole('button', { name: '수정 저장' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect((await savedEntries(page))[0].startedAt).toBe('2026-10-03T23:00:00.000Z');
  await expect(page.locator('.entry-intake-period')).toHaveText('08:00 – 08:30');
  await page.getByRole('button', { name: '아메리카노 기록 수정' }).click();
  await page.getByRole('button', { name: '한 번에 마시기', exact: true }).click();
  await pickTime(page, '마신 시각', '10:00');
  await page.getByRole('button', { name: '수정 저장' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect((await savedEntries(page))[0]).not.toHaveProperty('startedAt');
  await expect(page.locator('.entry-intake-period')).toHaveCount(0);
  await page.reload();
  expect((await savedEntries(page))[0]).not.toHaveProperty('startedAt');
});

test('an intake spanning midnight shows its date range and is grouped on the finishing date', async ({ page }) => {
  await openApp(page, '2026-10-04T01:00:00+09:00');
  await page.goto('/history');
  await page.getByRole('button', { name: /^2026년 10월 4일/ }).click();
  await selectAmericano(page);
  await setPeriod(page, '2026-10-03T23:30', '2026-10-04T00:30');
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('navigation').getByRole('button', { name: '홈', exact: true }).click();
  await expect(page.getByTestId('remaining-mg')).toHaveText('130');
  await page.getByRole('button', { name: '아직 남아 있는 카페인 보기' }).click();
  await expect(page.getByRole('region', { name: '아직 남아 있는 카페인' }).locator('time')).toHaveText('10월 3일 23:30 – 오늘 00:30');
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
  await expect(page.getByTestId('daily-total')).toHaveText('150');
  await expect(page.locator('.entry-intake-period')).toHaveText('10월 3일 23:30 – 00:30');
  await expect(page.getByText('날짜별 기록은 마신 마지막 시각을 기준으로 모아요.')).toBeVisible();
  await page.getByRole('button', { name: /2026년 10월 3일/ }).click();
  await expect(page.getByTestId('daily-count')).toHaveText('0');
  await page.getByRole('button', { name: '오늘', exact: true }).click();
  await expect(page.getByTestId('daily-count')).toHaveText('1');
});

test('blank, reversed and future intake periods cannot be saved from history', async ({ page }) => {
  await openApp(page);
  await page.goto('/history');
  await selectAmericano(page);
  await setPeriod(page, '2026-10-04T09:00', '2026-10-04T08:00');
  await page.getByLabel('마신 마지막 날짜', { exact: true }).fill('2026-10-04');
  const save = page.getByRole('button', { name: '기록 저장', exact: true });
  await save.click();
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText('시작 시각은 마지막 시각보다 늦을 수 없어요.');
  await pickTime(page, '마신 마지막 시각', '11:00');
  await save.click();
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText('마신 마지막 시각을 현재 또는 과거로 입력해 주세요.');
  await pickTime(page, '마신 마지막 시각', '10:00');
  await page.getByLabel('마시기 시작한 날짜', { exact: true }).fill('');
  await save.click();
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText('마시기 시작한 시각을 입력해 주세요.');
  expect(await savedEntries(page)).toHaveLength(0);
});

for (const theme of ['']) {
  test(`slow intake fields and save remain reachable at 200% text ${theme || 'dark'}`, async ({ page }, testInfo) => {
    await openApp(page, '2026-10-04T10:00:00+09:00', theme);
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await selectAmericano(page);
    await setPeriod(page, '2026-10-04T09:00', '2026-10-04T10:00');
    await page.locator('.intake-time-inputs').screenshot({ path: `test-results/${testInfo.project.name}-slow-intake-fields-zoom.png` });
    const save = page.getByRole('button', { name: '기록 저장', exact: true });
    await save.scrollIntoViewIfNeeded();
    await expect(save).toBeInViewport();
    expect(await page.getByRole('dialog').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/${testInfo.project.name}-slow-intake-zoom-${theme ? 'light' : 'dark'}.png` });
    await save.click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByTestId('remaining-mg')).toHaveText('110');
  });
}


test('editing only the dose preserves sub-minute intake timestamps', async ({ page }) => {
  await openApp(page);
  await page.evaluate(storageKey => {
    const state = JSON.parse(localStorage.getItem(storageKey)!);
    state.entries = [{ id: 'short-period', drinkId: 'coffee', drinkName: '짧게 마신 커피', caffeineMg: 150, startedAt: '2026-10-04T00:00:10.000Z', consumedAt: '2026-10-04T00:00:50.000Z', icon: 'coffee' }];
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, storageKey);
  await page.goto('/history');
  await page.getByRole('button', { name: '짧게 마신 커피 기록 수정' }).click();
  await expect(page.getByLabel('마시기 시작한 시각', { exact: true })).toContainText('오전 9:00');
  await expect(page.getByLabel('마신 마지막 시각', { exact: true })).toContainText('오전 9:00');
  await page.getByLabel('카페인량 (mg)').fill('100');
  await page.getByRole('button', { name: '수정 저장' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect((await savedEntries(page))[0]).toMatchObject({ caffeineMg: 100, startedAt: '2026-10-04T00:00:10.000Z', consumedAt: '2026-10-04T00:00:50.000Z' });
  await page.getByRole('button', { name: '짧게 마신 커피 기록 수정' }).click();
  await pickTime(page, '마시기 시작한 시각', '09:00');
  await page.getByRole('button', { name: '수정 저장' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect((await savedEntries(page))[0].consumedAt).toBe('2026-10-04T00:00:50.000Z');
  expect((await savedEntries(page))[0]).not.toHaveProperty('startedAt');
});

test('home time range allows date changes and shows elapsed duration', async ({ page }, testInfo) => {
  await openApp(page);
  await selectAmericano(page);
  await page.getByRole('button', { name: '천천히 마시기', exact: true }).click();
  const start = page.getByLabel('마시기 시작한 시각', { exact: true });
  const end = page.getByLabel('마신 마지막 시각', { exact: true });
  await pickTime(page, '마시기 시작한 시각', '09:00');
  await pickTime(page, '마신 마지막 시각', '10:00');
  await expect(page.getByRole('status', { name: '마신 기간' })).toHaveText('1시간 동안');
  const startBox = (await start.boundingBox())!;
  const endBox = (await end.boundingBox())!;
  const startDateBox = (await page.getByLabel('마시기 시작한 날짜', { exact: true }).boundingBox())!;
  const endDateBox = (await page.getByLabel('마신 마지막 날짜', { exact: true }).boundingBox())!;
  expect(endDateBox.y).toBeGreaterThan(startBox.y + startBox.height);
  expect(startBox.x).toBeGreaterThan(startDateBox.x + startDateBox.width);
  expect(endBox.x).toBeGreaterThan(endDateBox.x + endDateBox.width);
  for (const box of [startBox, endBox, startDateBox, endDateBox]) expect(box.height).toBeGreaterThanOrEqual(48);
  await expect(page.getByRole('group', { name: '시작', exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: '종료', exact: true })).toBeVisible();
  await expect(page.locator('input[type="date"]')).toHaveCount(2);
  await page.getByLabel('마시기 시작한 날짜', { exact: true }).fill('2026-10-03');
  await pickTime(page, '마시기 시작한 시각', '23:30');
  await pickTime(page, '마신 마지막 시각', '00:30');
  await expect(page.getByRole('status', { name: '마신 기간' })).toHaveText('1시간 동안');
  await page.getByText('마신 시간', { exact: true }).click();
  await page.screenshot({ path: `test-results/${testInfo.project.name}-time-range.png` });
  await expect(page.getByLabel('마신 마지막 날짜', { exact: true })).toHaveValue('2026-10-04');
  await expect(start).toContainText('오후 11:30');
  await expect(page.getByLabel('마신 마지막 날짜', { exact: true })).toHaveValue('2026-10-04');
});
