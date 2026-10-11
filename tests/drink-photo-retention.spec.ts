import { expect, test, type Locator, type Page } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';

const storageKey = 'caffeine-tracker:state:v1';

async function seedPhotoHistory(page: Page) {
  await page.clock.install({ time: new Date('2026-10-05T10:00:00+09:00') });
  await page.goto('/');
  const photo = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 160;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#f3a6b8';
    context.fillRect(0, 0, 160, 160);
    return canvas.toDataURL('image/jpeg');
  });
  const state = createInitialState();
  state.customDrinks = [{ id: 'photo-coffee', categoryId: 'coffee', name: '사진 커피', caffeineMg: 67, icon: 'cup', isCustom: true, sourceType: 'custom', photoDataUrl: photo }];
  state.entries = ['first-cup', 'second-cup'].map(id => ({ id, drinkId: 'photo-coffee', drinkName: '사진 커피', caffeineMg: 67, icon: 'cup', consumedAt: '2026-10-05T09:00:00+09:00' }));
  await page.evaluate(({ storageKey, state }) => localStorage.setItem(storageKey, JSON.stringify(state)), { storageKey, state });
  await page.reload();
  return photo;
}

async function expectPhotoFillsBox(box: Locator, photo: string) {
  const image = box.locator('img');
  await expect(image).toHaveAttribute('src', photo);
  await expect(image).toBeVisible();
  const bounds = await box.boundingBox();
  const imageBounds = await image.boundingBox();
  // Include the two border pixels and subpixel layout rounding during sheet motion.
  expect(Math.abs(bounds!.width - imageBounds!.width)).toBeLessThanOrEqual(2.01);
  expect(Math.abs(bounds!.height - imageBounds!.height)).toBeLessThanOrEqual(2.01);
  expect(await image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
}

test('deleted drink photos fill record icons, survive reload, and are reclaimed after the final record', async ({ page }) => {
  const photo = await seedPhotoHistory(page);
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  const drink = page.getByRole('button', { name: /사진 커피\s*67\s*mg/ });
  await expectPhotoFillsBox(drink.locator('.drink-badge-icon'), photo);
  await drink.click();
  await expectPhotoFillsBox(page.locator('.quick-adjust-icon'), photo);
  await page.getByRole('button', { name: '음료 삭제', exact: true }).click();
  await page.getByRole('button', { name: '삭제하기', exact: true }).click();
  await expect(drink).toHaveCount(0);
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: '아직 남아 있는 카페인 보기', exact: true }).click();
  await expectPhotoFillsBox(page.locator('.remaining-drink-icon').first(), photo);
  await expectPhotoFillsBox(page.locator('.remaining-drink-icon').last(), photo);
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
  await expectPhotoFillsBox(page.locator('.drink-icon-container').first(), photo);
  await expectPhotoFillsBox(page.locator('.drink-icon-container').last(), photo);
  await page.getByRole('button', { name: '사진 커피 기록 삭제' }).first().click();
  await page.getByRole('button', { name: '삭제하기', exact: true }).click();
  await expect(page.locator('.history-entry')).toHaveCount(1);
  await page.reload();
  await expectPhotoFillsBox(page.locator('.drink-icon-container'), photo);
  const retained = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)!), storageKey);
  expect(retained.customDrinks).toEqual([]);
  expect(retained.retainedDrinkPhotos).toEqual({ 'photo-coffee': photo });
  await page.getByRole('button', { name: '사진 커피 기록 삭제' }).click();
  await page.getByRole('button', { name: '삭제하기', exact: true }).click();
  await expect(page.locator('.history-entry')).toHaveCount(0);
  await page.reload();
  const cleaned = await page.evaluate(storageKey => localStorage.getItem(storageKey)!, storageKey);
  expect(JSON.parse(cleaned).entries).toEqual([]);
  expect(JSON.parse(cleaned)).not.toHaveProperty('retainedDrinkPhotos');
  expect(cleaned).not.toContain(photo);
});

test('failed final-record deletion keeps the retained image visible and saved for retry', async ({ page }) => {
  const photo = await seedPhotoHistory(page);
  await page.evaluate(({ storageKey, photo }) => {
    const state = JSON.parse(localStorage.getItem(storageKey)!);
    state.customDrinks = [];
    state.entries = state.entries.slice(0, 1);
    state.retainedDrinkPhotos = { 'photo-coffee': photo };
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, { storageKey, photo });
  await page.reload();
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
  await expectPhotoFillsBox(page.locator('.drink-icon-container'), photo);
  await page.getByRole('button', { name: '사진 커피 기록 삭제' }).click();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function () {
      Storage.prototype.setItem = original;
      throw new DOMException('full', 'QuotaExceededError');
    };
  });
  await page.getByRole('button', { name: '삭제하기', exact: true }).click();
  await expect(page.getByRole('alert').first()).toContainText('저장하지 못했어요');
  await expectPhotoFillsBox(page.locator('.drink-icon-container'), photo);
  const state = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)!), storageKey);
  expect(state.entries).toHaveLength(1);
  expect(state.retainedDrinkPhotos).toEqual({ 'photo-coffee': photo });
  await page.getByRole('button', { name: '삭제하기', exact: true }).click();
  await expect(page.locator('.history-entry')).toHaveCount(0);
});
