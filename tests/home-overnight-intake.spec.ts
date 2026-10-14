import { expect, test } from '@playwright/test';

import { pickTime } from './helpers/time-picker';

test('home clock selection keeps explicit dates and saves an overnight interval', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-31T22:00:00+09:00') });
  await page.goto('/');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  await page.getByRole('button', { name: '천천히 마시기', exact: true }).click();
  await expect(page.locator('input[type="date"]')).toHaveCount(2);
  await pickTime(page, '마시기 시작한 시각', '23:00');
  await pickTime(page, '마신 마지막 시각', '01:00');
  await expect(page.getByLabel('마신 마지막 날짜', { exact: true })).toHaveValue('2026-10-31');
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('시작 시각은 마지막 시각보다 늦을 수 없어요.');
  await page.getByLabel('마신 마지막 날짜', { exact: true }).fill('2026-11-01');
  await expect(page.getByLabel('마시기 시작한 날짜', { exact: true })).toHaveValue('2026-10-31');
  await expect(page.getByLabel('마신 마지막 날짜', { exact: true })).toHaveValue('2026-11-01');
  await expect(page.getByLabel('마신 기간', { exact: true })).toHaveText('2시간 동안');
  await expect(page.getByText('다음 날', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('마신 마지막 시각을 현재 또는 과거로 입력해 주세요.');
  await pickTime(page, '마시기 시작한 시각', '00:00');
  await pickTime(page, '마신 마지막 시각', '01:00');
  await page.getByLabel('마신 마지막 날짜', { exact: true }).fill('2026-10-31');
  await expect(page.getByLabel('마신 마지막 날짜', { exact: true })).toHaveValue('2026-10-31');
  await expect(page.getByLabel('마신 기간', { exact: true })).toHaveText('1시간 동안');
  await expect(page.getByText('다음 날', { exact: true })).toHaveCount(0);
  await pickTime(page, '마시기 시작한 시각', '23:00');
  await pickTime(page, '마신 마지막 시각', '01:00');
  await page.getByLabel('마신 마지막 날짜', { exact: true }).fill('2026-11-01');
  await expect(page.getByLabel('마신 마지막 날짜', { exact: true })).toHaveValue('2026-11-01');
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
  await page.getByRole('button', { name: '천천히 마시기', exact: true }).click();
  await page.getByRole('button', { name: '마신 마지막 시각', exact: true }).click();
  await page.getByRole('spinbutton', { name: '시', exact: true }).press('Home');
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await expect(page.getByLabel('마신 마지막 날짜', { exact: true })).toHaveValue('2026-10-06');
  await expect(page.getByRole('button', { name: '마신 마지막 시각', exact: true })).toContainText('오후 12:00');
  await expect(page.getByLabel('마신 기간', { exact: true })).toHaveText('30분 동안');
});

test('home intake starts and ends now even just after midnight', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-06T00:10:00+09:00') });
  await page.goto('/');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  await expect(page.getByLabel('마신 날짜', { exact: true })).toHaveValue('2026-10-06');
  await expect(page.getByRole('button', { name: '마신 시각', exact: true })).toContainText('오전 12:10');
  await expect(page.getByLabel('마신 기간', { exact: true })).toHaveCount(0);
});
