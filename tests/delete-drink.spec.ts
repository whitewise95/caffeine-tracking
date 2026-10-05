import { expect, test } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';

const key = 'caffeine-tracker:state:v1';
const state = createInitialState();
state.customCategories = [{ id: 'custom:my-drinks', name: '나의 음료' }];
state.customDrinks = [{ id: 'my-decaf', categoryId: 'custom:my-drinks', name: '나의 디카페인', caffeineMg: 67, icon: 'cup', isCustom: true, sourceType: 'custom', photoDataUrl: 'data:image/jpeg;base64,/9j/2Q==' }];
state.entries = [{ id: 'previous-cup', drinkId: 'my-decaf', drinkName: '나의 디카페인', caffeineMg: 67, consumedAt: '2026-10-05T09:00:00+09:00', icon: 'cup', sourceType: 'custom' }];

async function seed(page: import('@playwright/test').Page, theme = '') {
  await page.clock.install({ time: new Date('2026-10-05T10:00:00+09:00') });
  await page.addInitScript(({ key, state }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
  }, { key, state });
  await page.goto(`/${theme}`);
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
}

for (const theme of ['', '?theme=light']) {
  test(`custom drink deletion preserves recorded intake and categories across reload ${theme || 'dark'}`, async ({ page }, testInfo) => {
    await seed(page, theme);
    await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
    await expect(page.getByRole('button', { name: '음료 삭제', exact: true })).toBeVisible();
    await page.goBack();
    await page.getByRole('button', { name: /나의 디카페인\s*67\s*mg/ }).click();
    await page.getByRole('button', { name: '음료 삭제', exact: true }).click();
    await expect(page.getByText('이미 남긴 섭취 기록은 유지돼요.', { exact: true })).toBeVisible();
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).customDrinks.length, key)).toBe(1);
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    const confirm = page.getByRole('button', { name: '삭제하기', exact: true });
    await confirm.scrollIntoViewIfNeeded();
    await expect(confirm).toBeInViewport();
    expect(await page.getByRole('dialog').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.screenshot({ path: `test-results/${testInfo.project.name}-delete-drink-${theme ? 'light' : 'dark'}.png` });
    await confirm.click();
    await expect(page.getByRole('heading', { name: '어떤 카페인을 마셨나요?' })).toBeVisible();
    await expect(page.getByRole('button', { name: /나의 디카페인\s*67\s*mg/ })).toHaveCount(0);
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key);
    expect(saved.customDrinks).toEqual([]);
    expect(saved.entries).toEqual(state.entries);
    expect(saved.customCategories).toEqual(state.customCategories);
    await page.goBack();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
    await expect(page.locator('.history-entry')).toContainText('나의 디카페인');
    await expect(page.getByTestId('daily-total')).toHaveText('67');
    await page.reload();
    await expect(page.locator('.history-entry')).toContainText('나의 디카페인');
    await page.getByRole('button', { name: '나의 디카페인 기록 수정' }).click();
    await page.getByLabel('카페인량 (mg)').fill('70');
    await page.getByRole('button', { name: '수정 저장' }).click();
    await expect(page.locator('.history-entry')).toContainText('70mg');
    await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
    await expect(page.getByRole('button', { name: /나의 디카페인\s*67\s*mg/ })).toHaveCount(0);
  });
}

test('cancel and back leave a custom drink unchanged and preserve the record draft', async ({ page }) => {
  await seed(page);
  await page.getByRole('button', { name: /나의 디카페인\s*67\s*mg/ }).click();
  await page.getByRole('button', { name: '카페인량 1mg 늘리기' }).click();
  await page.getByRole('switch', { name: '천천히 마셨어요' }).check();
  await page.getByRole('button', { name: '음료 삭제', exact: true }).click();
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await expect(page.locator('.quick-adjust-amount')).toHaveText('68mg');
  await expect(page.getByRole('switch', { name: '천천히 마셨어요' })).toBeChecked();
  await expect(page.getByRole('button', { name: '음료 삭제', exact: true })).toBeFocused();
  await page.getByRole('button', { name: '음료 삭제', exact: true }).click();
  await page.goBack();
  await expect(page.getByRole('heading', { name: '어떤 카페인을 마셨나요?' })).toBeVisible();
  await expect(page.getByRole('button', { name: /나의 디카페인\s*67\s*mg/ })).toBeVisible();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(state);
});

test('failed deletion preserves the drink and intake and allows retry', async ({ page }) => {
  await seed(page);
  await page.getByRole('button', { name: /나의 디카페인\s*67\s*mg/ }).click();
  await page.getByRole('button', { name: '음료 삭제', exact: true }).click();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      Storage.prototype.setItem = original;
      throw new Error(`test write failure for ${key}, ${value.length} characters`);
    };
  });
  await page.getByRole('button', { name: '삭제하기', exact: true }).click();
  await expect(page.getByText('음료를 삭제하지 못했어요. 다시 시도해 주세요.', { exact: true })).toBeVisible();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(state);
  await page.getByRole('button', { name: '삭제하기', exact: true }).click();
  await expect(page.getByRole('heading', { name: '어떤 카페인을 마셨나요?' })).toBeVisible();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).entries, key)).toEqual(state.entries);
});

test('a deletion finishing after the sheet is dismissed does not navigate away from the current page', async ({ page }) => {
  await seed(page);
  await page.getByRole('button', { name: /나의 디카페인\s*67\s*mg/ }).click();
  await page.getByRole('button', { name: '음료 삭제', exact: true }).click();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      return new Promise<void>(resolve => window.addEventListener('finish-delete', () => {
        original.call(this, key, value);
        resolve();
      }, { once: true }));
    };
  });
  await page.getByRole('button', { name: '삭제하기', exact: true }).click();
  await expect(page.getByRole('button', { name: '삭제하는 중…', exact: true })).toBeDisabled();
  await page.goBack();
  await page.goBack();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('navigation').getByRole('button', { name: '지식', exact: true }).click();
  await page.evaluate(() => window.dispatchEvent(new Event('finish-delete')));
  await expect(page.getByRole('status')).toContainText('음료를 삭제했어요');
  await expect(page).toHaveURL(/knowledge$/);
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).customDrinks, key)).toEqual([]);
});

test('default drinks can be deleted locally without losing intake, and reset restores the catalog', async ({ page }) => {
  await seed(page);
  await page.getByRole('button', { name: /얼그레이\s*45\s*mg/ }).click();
  await page.getByRole('button', { name: '지금 기록', exact: true }).click();
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: /얼그레이\s*45\s*mg/ }).click();
  await page.getByRole('button', { name: '음료 삭제', exact: true }).click();
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await expect(page.locator('.quick-adjust-amount')).toHaveText('45mg');
  await page.getByRole('button', { name: '음료 삭제', exact: true }).click();
  await page.getByRole('button', { name: '삭제하기', exact: true }).click();
  await expect(page.getByRole('heading', { name: '어떤 카페인을 마셨나요?' })).toBeVisible();
  await expect(page.getByRole('button', { name: /얼그레이\s*45\s*mg/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /녹차\s*30\s*mg/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /나의 디카페인\s*67\s*mg/ })).toBeVisible();
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await page.reload();
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
  await expect(page.locator('.history-entry').filter({ hasText: '얼그레이' })).toContainText('45mg');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await expect(page.getByRole('button', { name: /얼그레이\s*45\s*mg/ })).toHaveCount(0);
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await page.getByRole('navigation').getByRole('button', { name: '설정', exact: true }).click();
  await page.getByRole('button', { name: '모든 데이터 초기화', exact: true }).click();
  await page.getByRole('button', { name: '초기화하기', exact: true }).click();
  await page.getByRole('navigation').getByRole('button', { name: '홈', exact: true }).click();
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await expect(page.getByRole('button', { name: /얼그레이\s*45\s*mg/ })).toBeVisible();
});
