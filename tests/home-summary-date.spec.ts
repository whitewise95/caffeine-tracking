import { expect, test } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';

const storageKey = 'caffeine-tracker:state:v1';

async function openHomeWithLastIntake(page: import('@playwright/test').Page, consumedAt: string) {
  await page.clock.setFixedTime(new Date('2026-10-15T00:10:00+09:00'));
  const state = createInitialState();
  state.entries = [{
    id: 'last-intake',
    drinkId: 'coffee',
    drinkName: '테스트 커피',
    icon: 'coffee',
    caffeineMg: 45,
    consumedAt,
  }];
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: storageKey, state });
  await page.goto('/');
}

test('last intake hides its date when it was recorded today', async ({ page }) => {
  await openHomeWithLastIntake(page, '2026-10-15T00:05:00+09:00');

  const summary = page.getByRole('region', { name: '카페인 기록 요약' });
  await expect(summary.getByText('00:05', { exact: true })).toBeVisible();
  await expect(summary.locator('.summary-date')).toHaveCount(0);
});

test('last intake shows its date when it was recorded on a previous day', async ({ page }) => {
  await openHomeWithLastIntake(page, '2026-10-14T23:55:00+09:00');

  const summary = page.getByRole('region', { name: '카페인 기록 요약' });
  await expect(summary.getByText('23:55', { exact: true })).toBeVisible();
  await expect(summary.locator('.summary-date')).toHaveText('10월 14일');
});
