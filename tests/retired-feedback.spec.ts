import { expect, test } from '@playwright/test';
import { remainingCaffeine } from '../src/features/caffeine/model/caffeine';
import type { CaffeineEntry } from '../src/features/caffeine/model/caffeine.types';

const entry: CaffeineEntry = { id: 'old-entry', drinkId: 'old-drink', drinkName: '내 차', caffeineMg: 200, icon: 'tea', sourceType: 'custom', startedAt: '2026-10-03T22:00:00+09:00', consumedAt: '2026-10-03T23:00:00+09:00' };
const retired = { enabled: true, perceivedDurationAdjustment: 2, feedback: [{ answer: 'later', responseKind: 'daily-feeling' }], predictions: [] };
const legacy = { version: 2, entries: [entry], customDrinks: [{ id: 'old-drink', categoryId: 'tea', name: '내 차', caffeineMg: 200, icon: 'tea', sourceType: 'custom', isCustom: true }], settings: { halfLifeHours: 5 }, personalization: retired };
const key = 'caffeine-tracker:state:v1';

test('old feedback cannot change the fixed calculation or open a survey, while drinks survive upgrades', async ({ page }) => {
  const now = new Date('2026-10-04T10:00:00+09:00');
  await page.clock.install({ time: now });
  await page.addInitScript(({ key, legacy }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(legacy));
  }, { key, legacy });
  await page.goto('/');
  await expect(page.getByTestId('remaining-mg')).toHaveText(String(Math.round(remainingCaffeine([entry], now))));
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('navigation').getByRole('button', { name: '설정', exact: true }).click();
  await expect(page.getByTestId('half-life-description')).toHaveText('지금 카페인에서는 반감기를 4시간 30분으로 두고 잔존량을 추정해요.');
  await expect(page.getByRole('heading', { name: '체감 기록' })).toHaveCount(0);
  await expect(page.getByRole('switch')).toHaveCount(0);
  await page.getByRole('navigation').getByRole('button', { name: '홈', exact: true }).click();
  // Old browser history entries are ignored instead of opening a reset sheet.
  for (const type of ['check-in', 'feedback']) {
    await page.evaluate(type => {
      history.replaceState({ page: 'home', depth: 0, overlay: { type, key: 'retired' } }, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, type);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: /내 차\s*200\s*mg/ }).click();
  await page.getByRole('button', { name: '지금 기록', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key);
  expect(saved.version).toBe(4);
  expect(saved.settings.halfLifeHours).toBe(4.5);
  expect(saved).not.toHaveProperty('personalization');
  expect(saved.legacyPersonalization).toEqual(retired);
  expect(saved.entries[0]).toEqual(entry);
  expect(saved.customDrinks).toEqual(legacy.customDrinks);
  await page.clock.setSystemTime(new Date('2026-10-05T10:00:00+09:00'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.reload();
  await expect(page.getByTestId('remaining-mg')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
