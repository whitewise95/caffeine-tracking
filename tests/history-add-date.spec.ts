import { expect, test, type Page } from '@playwright/test';
import type { CaffeineEntry } from '../src/features/caffeine/model/caffeine.types';
import { pickTime } from './helpers/time-picker';

async function openPastDay(page: Page) {
  await page.clock.install({ time: new Date('2026-10-06T10:00:00+09:00') });
  await page.goto('/history');
  await page.getByRole('button', { name: /^2026년 10월 3일/ }).click();
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
}

async function entries(page: Page): Promise<CaffeineEntry[]> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!).entries);
}

test('history retains the selected date while adding a record and defaults to today after reloading', async ({ page }) => {
  await openPastDay(page);
  await expect(page.getByRole('dialog')).toContainText('10월 3일');
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  await expect(page.getByLabel('마신 마지막 날짜', { exact: true })).toHaveValue('2026-10-03');
  await pickTime(page, '마신 마지막 시각', '08:30');
  await pickTime(page, '마시기 시작한 시각', '08:30');
  await page.goBack();
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  await expect(page.getByRole('button', { name: '마신 마지막 시각', exact: true })).toHaveText('오전 8:30');
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByTestId('daily-count')).toHaveText('1');
  await expect(page.getByTestId('daily-total')).toHaveText('150');
  expect((await entries(page))[0].consumedAt).toBe('2026-10-02T23:30:00.000Z');
  await page.reload();
  await expect(page.getByRole('button', { name: /^2026년 10월 6일/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('daily-count')).toHaveText('0');
  await page.getByRole('button', { name: /^2026년 10월 3일/ }).click();
  await expect(page.locator('.history-entry h3')).toHaveText('아메리카노');
  await page.getByRole('button', { name: '오늘', exact: true }).click();
  await expect(page.getByTestId('daily-count')).toHaveText('0');
});

test('custom drink creation and slow intake retain the history date', async ({ page }) => {
  await openPastDay(page);
  await page.getByRole('button', { name: '커피에 내 음료 추가' }).click();
  await page.getByLabel('메뉴명').fill('토요일 커피');
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await page.getByLabel('카페인량 mg', { exact: true }).fill('80');
  await page.getByRole('button', { name: '음료 저장', exact: true }).click();
  await expect(page.getByRole('button', { name: '마신 마지막 시각', exact: true })).toHaveText('오전 10:00');
  await expect(page.getByLabel('마시기 시작한 날짜', { exact: true })).toHaveValue('2026-10-03');
  await expect(page.getByLabel('마신 마지막 날짜', { exact: true })).toHaveValue('2026-10-03');
  await pickTime(page, '마시기 시작한 시각', '09:30');
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect((await entries(page))[0]).toMatchObject({ drinkName: '토요일 커피', caffeineMg: 80, startedAt: '2026-10-03T00:30:00.000Z', consumedAt: '2026-10-03T01:00:00.000Z' });
  await expect(page.getByTestId('daily-total')).toHaveText('80');
});

test('future instant intake is rejected when adding from history', async ({ page }) => {
  await openPastDay(page);
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  await page.getByLabel('마신 마지막 날짜', { exact: true }).fill('2026-10-07');
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('현재 또는 과거');
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1') ?? '{"entries":[]}').entries)).toHaveLength(0);
});
