import { expect, test, type Page } from '@playwright/test';
import { restoreLegacyCategories } from './helpers/legacyCategories';
import { createInitialState } from '../src/features/caffeine/model/caffeine';
import { deleteDrinkCategory } from '../src/features/caffeine/model/drinkCategories';
import type { CaffeineState } from '../src/features/caffeine/model/caffeine.types';

const key = 'caffeine-tracker:state:v1';
function fixture(): CaffeineState {
  return {
    ...createInitialState(), deletedDefaultDrinkIds: ['americano'],
    customDrinks: [{ id: 'photo-coffee', categoryId: 'coffee', name: '사진 커피', caffeineMg: 70, icon: 'cup', sourceType: 'custom', isCustom: true, photoDataUrl: 'data:image/jpeg;base64,/9j/2Q==' }],
    entries: [
      { id: 'hidden-coffee', drinkId: 'americano', drinkName: '아메리카노', caffeineMg: 150, icon: 'coffee', consumedAt: '2026-10-05T01:00:00.000Z' },
      { id: 'photo-coffee', drinkId: 'photo-coffee', drinkName: '사진 커피', caffeineMg: 70, icon: 'cup', consumedAt: '2026-10-05T02:00:00.000Z' },
      { id: 'tea', drinkId: 'green-tea', drinkName: '녹차', caffeineMg: 30, icon: 'tea', consumedAt: '2026-10-05T03:00:00.000Z' },
    ],
  };
}
async function seed(page: Page, state = fixture()) {
  await page.addInitScript(({ key, state }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
  }, { key, state });
  await page.goto('/settings');
  await restoreLegacyCategories(page);
}
async function openDelete(page: Page, name = '커피') {
  await page.getByRole('button', { name: `${name} 카테고리 관리`, exact: true }).click();
  await page.getByRole('button', { name: '삭제', exact: true }).click();
}
async function stored(page: Page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!) as CaffeineState, key);
}

test('force delete shows its scope and cancel preserves every category, drink and record', async ({ page }, info) => {
  await seed(page);
  await openDelete(page);
  const before = await stored(page);
  await page.getByRole('button', { name: '강제 삭제', exact: true }).click();
  const confirm = page.getByRole('button', { name: '음료·기록 모두 삭제', exact: true });
  await expect(confirm).toBeEnabled();
  await expect(page.getByTestId('category-force-summary')).toContainText('음료 3개');
  await expect(page.getByTestId('category-force-summary')).toContainText('섭취 기록 2건');
  await expect(page.getByLabel('음료를 이동할 카테고리', { exact: true })).not.toBeVisible();
  await page.screenshot({ path: info.outputPath('force-delete-confirmation.png') });
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await expect(confirm).toHaveCount(0);
  await expect(page.getByRole('button', { name: '강제 삭제', exact: true })).toBeFocused();
  expect(await stored(page)).toEqual(before);
});

test('force delete removes only the chosen category and its linked history through reload', async ({ page }) => {
  await seed(page);
  await openDelete(page);
  await page.getByRole('button', { name: '강제 삭제', exact: true }).click();
  await page.getByRole('button', { name: '음료·기록 모두 삭제', exact: true }).click();
  await expect(page.getByRole('button', { name: '커피 카테고리 관리', exact: true })).toHaveCount(0);
  const state = await stored(page);
  expect(state.entries.map(entry => entry.id)).toEqual(['tea']);
  expect(state.customDrinks).toEqual([]);
  expect(state.deletedDefaultDrinkIds).toEqual(['americano', 'cold-brew', 'caffe-latte']);
  await page.reload();
  await restoreLegacyCategories(page);
  await expect(page.getByRole('button', { name: '커피 카테고리 관리', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '차 카테고리 관리', exact: true })).toBeVisible();
  expect((await stored(page)).entries.map(entry => entry.id)).toEqual(['tea']);
});

test('failed force delete keeps all data and allows one successful retry', async ({ page }) => {
  await seed(page);
  await openDelete(page);
  await page.getByRole('button', { name: '강제 삭제', exact: true }).click();
  const before = await stored(page);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(name, value) {
      if (name === key) { Storage.prototype.setItem = original; throw new Error('Storage unavailable'); }
      return original.call(this, name, value);
    };
  }, key);
  const confirm = page.getByRole('button', { name: '음료·기록 모두 삭제', exact: true });
  await confirm.click();
  await expect(page.getByRole('dialog', { name: '카테고리 삭제', exact: true }).getByRole('alert').first()).toBeVisible();
  expect(await stored(page)).toEqual(before);
  await confirm.click();
  await expect(page.getByRole('button', { name: '커피 카테고리 관리', exact: true })).toHaveCount(0);
  expect((await stored(page)).entries.map(entry => entry.id)).toEqual(['tea']);
});

test('the last populated category can be force deleted without creating a destination', async ({ page }) => {
  let state = fixture();
  state = deleteDrinkCategory(state, 'coffee', 'tea');
  state = deleteDrinkCategory(state, 'tea', 'energy');
  state = deleteDrinkCategory(state, 'energy', 'other');
  await seed(page, state);
  await openDelete(page, '탄산');
  await page.getByRole('button', { name: '강제 삭제', exact: true }).click();
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: '음료·기록 모두 삭제', exact: true }).click();
  await expect(page.locator('.category-manager-empty')).toBeVisible();
  expect((await stored(page)).entries).toEqual([]);
  await page.reload();
  await restoreLegacyCategories(page);
  await expect(page.locator('.category-manager-empty')).toBeVisible();
});
