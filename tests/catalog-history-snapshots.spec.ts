import { expect, test, type Page } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';
import type { CaffeineState } from '../src/features/caffeine/model/caffeine.types';

const storageKey = 'caffeine-tracker:state:v1';
async function thumbnail(page: Page, color: string) {
  return page.evaluate(color => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 16;
    const context = canvas.getContext('2d')!;
    context.fillStyle = color;
    context.fillRect(0, 0, 16, 16);
    return canvas.toDataURL('image/jpeg');
  }, color);
}
async function editDrink(page: Page, name: string) {
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: '편집', exact: true }).click();
  await page.getByRole('button', { name: `${name} 음료 편집`, exact: true }).click();
  return page.getByRole('dialog', { name: '음료 수정', exact: true });
}
async function recordEditedDrink(page: Page, name: string, dose: number) {
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await page.getByRole('button', { name: new RegExp(`${name}\\s*${dose}\\s*mg`) }).click();
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
}

test('catalog edits preserve historical name dose icon and photo while new records use edited values', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-05T10:00:00+09:00') });
  await page.goto('/');
  const originalPhoto = await thumbnail(page, '#f3a6b8');
  const replacementPhoto = await thumbnail(page, '#62bfff');
  const state = createInitialState();
  state.customDrinks = [{ id: 'photo-coffee', categoryId: 'coffee', name: '사진 커피', caffeineMg: 67, icon: 'cup', isCustom: true, sourceType: 'custom', photoDataUrl: originalPhoto }];
  state.entries = [{ id: 'old', drinkId: 'photo-coffee', drinkName: '사진 커피', caffeineMg: 67, icon: 'cup', consumedAt: '2026-10-05T09:00:00+09:00', note: '원래 기록' }];
  await page.evaluate(({ storageKey, state }) => localStorage.setItem(storageKey, JSON.stringify(state)), { storageKey, state });
  await page.reload();
  let editor = await editDrink(page, '사진 커피');
  await editor.getByRole('button', { name: '차', exact: true }).click();
  await editor.getByLabel('메뉴명', { exact: true }).fill('새 커피');
  await editor.getByLabel('카페인량 mg', { exact: true }).fill('80');
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      Storage.prototype.setItem = original;
      if (name === key) throw new DOMException('full', 'QuotaExceededError');
      return original.call(this, name, value);
    };
  }, storageKey);
  await editor.getByRole('button', { name: '변경 저장', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert').first()).toBeVisible();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), storageKey)).toEqual(state);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).entries, storageKey)).toEqual(state.entries);
  await recordEditedDrink(page, '새 커피', 80);
  editor = await editDrink(page, '새 커피');
  await editor.locator('input[type=file]').setInputFiles({ name: 'new.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(replacementPhoto.split(',')[1], 'base64') });
  await expect(editor.getByRole('button', { name: '앨범 사진 변경', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const newPhoto = (await editor.locator('.sheet-photo-option img').getAttribute('src'))!;
  await editor.getByLabel('메뉴명', { exact: true }).fill('최근 커피');
  await editor.getByLabel('카페인량 mg', { exact: true }).fill('95');
  await editor.getByRole('button', { name: '변경 저장', exact: true }).click();
  await recordEditedDrink(page, '최근 커피', 95);
  const persisted = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!) as CaffeineState, storageKey);
  expect(persisted.entries[0]).toEqual(state.entries[0]);
  expect(persisted.entries[1]).toMatchObject({ drinkName: '새 커피', caffeineMg: 80, icon: 'tea' });
  expect(persisted.entries[2]).toMatchObject({ drinkName: '최근 커피', caffeineMg: 95, icon: 'tea' });
  await page.getByRole('button', { name: '아직 남아 있는 카페인 보기', exact: true }).click();
  const remaining = page.locator('.remaining-drinks-list li');
  await expect(remaining.filter({ has: page.getByRole('heading', { name: '사진 커피', exact: true }) }).locator('img')).toHaveAttribute('src', originalPhoto);
  await expect(remaining.filter({ has: page.getByRole('heading', { name: '새 커피', exact: true }) }).locator('img')).toHaveCount(0);
  await expect(remaining.filter({ has: page.getByRole('heading', { name: '최근 커피', exact: true }) }).locator('img')).toHaveAttribute('src', newPhoto);
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
  await page.reload();
  const history = page.locator('.history-entry');
  const old = history.filter({ has: page.getByRole('heading', { name: '사진 커피', exact: true }) });
  await expect(old.locator('img')).toHaveAttribute('src', originalPhoto);
  await expect(old.locator('.entry-copy p')).toHaveText('67mg');
  await expect(old).toContainText('원래 기록');
  await expect(history.filter({ has: page.getByRole('heading', { name: '새 커피', exact: true }) }).locator('img')).toHaveCount(0);
  await expect(history.filter({ has: page.getByRole('heading', { name: '최근 커피', exact: true }) }).locator('img')).toHaveAttribute('src', newPhoto);
});
