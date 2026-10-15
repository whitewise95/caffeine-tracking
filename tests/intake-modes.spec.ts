import { expect, test, type Page } from '@playwright/test';
import { pickTime, setTimeWheel } from './helpers/time-picker';

const storageKey = 'caffeine-tracker:state:v1';
async function openRecord(page: Page, now = '2026-10-14T12:00:00+09:00') {
  await page.clock.install({ time: new Date(now) });
  await page.goto('/');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
}
const entries = (page: Page) => page.evaluate(key => JSON.parse(localStorage.getItem(key)!).entries, storageKey);

test('an instantaneous drink today has an editable time and retains its mode when edited at 200% text', async ({ page }, info) => {
  await openRecord(page);
  await expect(page.getByRole('button', { name: '한 번에 마시기', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('마신 날짜', { exact: true })).toHaveValue('2026-10-14');
  await expect(page.getByLabel('마시기 시작한 시각', { exact: true })).toHaveCount(0);
  // Measure the two controls together while the sheet is entering.
  const { dateBox, timeBox } = await page.locator('.intake-period-controls').evaluate(element => {
    const date = element.querySelector('input');
    const time = element.querySelector('button');
    if (!date || !time) throw new Error('Date and time controls are missing');
    return { dateBox: date.getBoundingClientRect().toJSON(), timeBox: time.getBoundingClientRect().toJSON() };
  });
  expect(timeBox.x).toBeGreaterThan(dateBox.x + dateBox.width);
  expect(Math.abs(timeBox.y - dateBox.y)).toBeLessThan(2);
  expect(dateBox.height).toBeGreaterThanOrEqual(48);
  expect(timeBox.height).toBeGreaterThanOrEqual(48);
  await page.screenshot({ path: info.outputPath('record-single-time.png') });
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  const time = page.getByRole('button', { name: '마신 시각', exact: true });
  await time.scrollIntoViewIfNeeded();
  await expect(time).toBeInViewport();
  expect(await page.getByRole('dialog').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('record-single-time-zoom.png') });
  await pickTime(page, '마신 시각', '09:20');
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const entry = (await entries(page))[0];
  expect(entry.consumedAt).toBe('2026-10-14T00:20:00.000Z');
  expect(entry.startedAt).toBeUndefined();
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
  await page.getByRole('button', { name: '아메리카노 기록 수정', exact: true }).click();
  await expect(page.getByRole('button', { name: '한 번에 마시기', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await pickTime(page, '마신 시각', '08:10');
  await page.getByRole('button', { name: '수정 저장', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect((await entries(page))[0]).toMatchObject({ id: entry.id, consumedAt: '2026-10-13T23:10:00.000Z' });
  expect((await entries(page))[0].startedAt).toBeUndefined();
});

test('a slow drink follows its changed start by thirty minutes and permits a manual finish', async ({ page }) => {
  await openRecord(page);
  await page.getByRole('button', { name: '천천히 마시기', exact: true }).click();
  await expect(page.getByLabel('마시기 시작한 시각', { exact: true })).toContainText('오전 11:30');
  await expect(page.getByLabel('마신 마지막 시각', { exact: true })).toContainText('오후 12:00');
  await pickTime(page, '마시기 시작한 시각', '09:40');
  await expect(page.getByLabel('마신 마지막 시각', { exact: true })).toContainText('오전 10:10');
  await expect(page.getByRole('status', { name: '마신 기간' })).toHaveText('30분 동안');
  await pickTime(page, '마신 마지막 시각', '10:25');
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect((await entries(page))[0]).toMatchObject({ startedAt: '2026-10-14T00:40:00.000Z', consumedAt: '2026-10-14T01:25:00.000Z' });
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
  await page.getByRole('button', { name: '아메리카노 기록 수정', exact: true }).click();
  await expect(page.getByRole('button', { name: '천천히 마시기', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await pickTime(page, '마시기 시작한 시각', '08:50');
  await expect(page.getByLabel('마신 마지막 시각', { exact: true })).toContainText('오전 9:20');
  await page.getByRole('button', { name: '수정 저장', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect((await entries(page))[0]).toMatchObject({ startedAt: '2026-10-13T23:50:00.000Z', consumedAt: '2026-10-14T00:20:00.000Z' });
});

test('automatic finish stops at now and changing the start date also follows the new date', async ({ page }) => {
  await openRecord(page, '2026-10-14T00:10:00+09:00');
  await page.getByRole('button', { name: '천천히 마시기', exact: true }).click();
  await expect(page.getByLabel('마시기 시작한 날짜', { exact: true })).toHaveValue('2026-10-13');
  await pickTime(page, '마시기 시작한 시각', '23:55');
  await expect(page.getByLabel('마신 마지막 날짜', { exact: true })).toHaveValue('2026-10-14');
  await expect(page.getByLabel('마신 마지막 시각', { exact: true })).toContainText('오전 12:10');
  await page.getByLabel('마시기 시작한 날짜', { exact: true }).fill('2026-10-12');
  await expect(page.getByLabel('마신 마지막 날짜', { exact: true })).toHaveValue('2026-10-13');
  await expect(page.getByLabel('마신 마지막 시각', { exact: true })).toContainText('오전 12:25');
  await expect(page.getByRole('status', { name: '마신 기간' })).toHaveText('30분 동안');
});

test('a manually changed finish remains fixed after later start changes in recording and editing', async ({ page }) => {
  await openRecord(page);
  await page.getByRole('button', { name: '천천히 마시기', exact: true }).click();
  await pickTime(page, '마시기 시작한 시각', '09:00');
  await expect(page.getByLabel('마신 마지막 시각', { exact: true })).toContainText('오전 9:30');
  // Cancelling the picker, or confirming the same minute, does not count as a change.
  await page.getByLabel('마신 마지막 시각', { exact: true }).click();
  await setTimeWheel(page, '분', 59);
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await pickTime(page, '마시기 시작한 시각', '09:10');
  await expect(page.getByLabel('마신 마지막 시각', { exact: true })).toContainText('오전 9:40');
  await pickTime(page, '마신 마지막 시각', '09:40');
  await pickTime(page, '마시기 시작한 시각', '09:20');
  await expect(page.getByLabel('마신 마지막 시각', { exact: true })).toContainText('오전 9:50');
  // Returning to the original finish still preserves the user's manual choice.
  await pickTime(page, '마신 마지막 시각', '10:10');
  await pickTime(page, '마신 마지막 시각', '09:50');
  await pickTime(page, '마시기 시작한 시각', '09:00');
  await expect(page.getByLabel('마신 마지막 시각', { exact: true })).toContainText('오전 9:50');
  await page.getByLabel('마시기 시작한 날짜', { exact: true }).fill('2026-10-13');
  await expect(page.getByLabel('마신 마지막 날짜', { exact: true })).toHaveValue('2026-10-14');
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect((await entries(page))[0]).toMatchObject({ startedAt: '2026-10-13T00:00:00.000Z', consumedAt: '2026-10-14T00:50:00.000Z' });
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
  await page.getByRole('button', { name: '아메리카노 기록 수정', exact: true }).click();
  await page.getByLabel('마신 마지막 날짜', { exact: true }).fill('2026-10-13');
  await pickTime(page, '마시기 시작한 시각', '10:00');
  await expect(page.getByLabel('마신 마지막 시각', { exact: true })).toContainText('오전 9:50');
  await expect(page.getByLabel('마신 마지막 날짜', { exact: true })).toHaveValue('2026-10-13');
  await page.getByRole('button', { name: '수정 저장', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('시작 시각은 마지막 시각보다 늦을 수 없어요.');
  await pickTime(page, '마시기 시작한 시각', '08:30');
  await page.getByRole('button', { name: '수정 저장', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect((await entries(page))[0]).toMatchObject({ startedAt: '2026-10-12T23:30:00.000Z', consumedAt: '2026-10-13T00:50:00.000Z' });
});
