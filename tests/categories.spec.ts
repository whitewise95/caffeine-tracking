import { expect, test, type Page } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';
import { installTossHost } from './helpers/tossHost';

async function openComposer(page: Page, category = '차', suffix = '') {
  await page.goto(`/${suffix}`);
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: `${category}에 내 음료 추가`, exact: true }).click();
}

for (const back of ['header', 'browser', 'toss'] as const) {
  test(`two composer stages preserve the draft with ${back} back and save to the selected category`, async ({ page }, testInfo) => {
    if (back === 'toss') await installTossHost(page);
    await openComposer(page);
    await page.locator('dialog').evaluate(element => element.setAttribute('data-original-modal', 'true'));
    await expect(page.getByLabel('카테고리', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('group', { name: '기존 카테고리' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '카테고리 관리', exact: true })).toHaveCount(0);
    await expect(page.getByLabel('카페인량 mg', { exact: true })).not.toBeVisible();
    await page.getByRole('button', { name: '다음', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('메뉴명');
    await expect(page.getByLabel('메뉴명', { exact: true })).toBeFocused();
    await page.getByRole('button', { name: '병', exact: true }).click();
    await page.getByLabel('메뉴명', { exact: true }).fill('나의 차');
    await page.getByRole('button', { name: '다음', exact: true }).click();
    await expect(page.getByRole('heading', { name: '카페인량 설정', exact: true })).toBeFocused();
    await expect(page.getByLabel('메뉴명', { exact: true })).not.toBeVisible();
    await expect(page.locator('.sheet-composer-preview')).toContainText('나의 차');
    await page.getByRole('button', { name: '음료 저장', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('카페인량');
    await page.getByLabel('카페인량 mg', { exact: true }).fill('67');
    if (back === 'header') await page.getByRole('button', { name: '아이콘과 메뉴명으로 돌아가기', exact: true }).click();
    else if (back === 'browser') await page.goBack();
    else await page.evaluate(() => (Reflect.get(window, 'testNativeBack') as () => void)());
    await expect(page.getByLabel('메뉴명', { exact: true })).toBeVisible();
    await expect(page.getByLabel('메뉴명', { exact: true })).toHaveValue('나의 차');
    await expect(page.getByRole('button', { name: '병', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.screenshot({ path: `test-results/${testInfo.project.name}-composer-details-${back}.png` });
    await page.getByRole('button', { name: '다음', exact: true }).click();
    await expect(page.getByLabel('카페인량 mg', { exact: true })).toHaveValue('67');
    await expect(page.locator('dialog[data-original-modal="true"]')).toBeVisible();
    await page.screenshot({ path: `test-results/${testInfo.project.name}-composer-dose-${back}.png` });
    await page.getByRole('button', { name: '음료 저장', exact: true }).click();
    await expect(page.getByRole('heading', { name: '카페인 기록하기', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: '나의 차', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '음료 목록으로 돌아가기', exact: true }).click();
    const tea = page.locator('.sheet-category').filter({ has: page.getByRole('heading', { name: '차', exact: true }) });
    await expect(tea.getByRole('button', { name: /나의 차\s*67\s*mg/ })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
    await expect(tea.getByRole('button', { name: /나의 차\s*67\s*mg/ })).toBeVisible();
  });
}

test('a custom category chosen from its section is kept by ID without a category selector', async ({ page }) => {
  const state = createInitialState();
  state.customCategories = [{ id: 'custom:protein', name: '단백질 쉐이크' }];
  await page.addInitScript(value => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(value)), state);
  await openComposer(page, '단백질 쉐이크');
  await page.getByLabel('메뉴명', { exact: true }).fill('초코 쉐이크');
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await page.getByLabel('카페인량 mg', { exact: true }).fill('67');
  await page.getByRole('button', { name: '음료 저장', exact: true }).click();
  await expect(page.getByRole('heading', { name: '초코 쉐이크', exact: true })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!));
  expect(saved.customDrinks).toEqual([expect.objectContaining({ categoryId: 'custom:protein', name: '초코 쉐이크' })]);
  expect(saved.customCategories).toHaveLength(1);
});

for (const theme of ['']) {
  test(`both composer stages fit 200% text ${theme || 'dark'}`, async ({ page }, testInfo) => {
    await openComposer(page, '차', theme);
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await page.getByLabel('메뉴명', { exact: true }).fill('확대해도 읽기 편한 나의 음료');
    for (const stage of ['details', 'dose']) {
      const action = page.getByRole('button', { name: stage === 'details' ? '다음' : '음료 저장', exact: true });
      await action.scrollIntoViewIfNeeded();
      await expect(action).toBeInViewport();
      const bounds = (await action.boundingBox())!;
      expect(bounds.height).toBeGreaterThanOrEqual(48);
      expect(await page.getByRole('dialog').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: `test-results/${testInfo.project.name}-composer-${stage}-200-${theme ? 'light' : 'dark'}.png` });
      if (stage === 'details') await action.click();
    }
    await page.getByLabel('카페인량 mg', { exact: true }).fill('67');
    await page.getByRole('button', { name: '음료 저장', exact: true }).click();
    await expect(page.getByRole('heading', { name: '확대해도 읽기 편한 나의 음료', exact: true })).toBeVisible();
  });
}

test('a failed drink write preserves the dose and retries once in the original category', async ({ page }) => {
  await openComposer(page, '커피');
  await page.getByLabel('메뉴명', { exact: true }).fill('내 부스터');
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await page.getByLabel('카페인량 mg', { exact: true }).fill('80');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function () {
      Storage.prototype.setItem = original;
      throw new DOMException('Cannot store', 'QuotaExceededError');
    };
  });
  await page.getByRole('button', { name: '음료 저장', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert').first()).toContainText('저장');
  expect(await page.evaluate(() => localStorage.getItem('caffeine-tracker:state:v1'))).toBeNull();
  await expect(page.getByLabel('카페인량 mg', { exact: true })).toHaveValue('80');
  await page.getByRole('button', { name: '음료 저장', exact: true }).click();
  await expect(page.getByRole('heading', { name: '내 부스터', exact: true })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!));
  expect(saved.customDrinks).toEqual([expect.objectContaining({ categoryId: 'coffee', caffeineMg: 80 })]);
  expect(saved.customCategories).toHaveLength(0);
});

test('a drink save finishing after back stays on the details stage', async ({ page }) => {
  await openComposer(page, '커피');
  await page.getByLabel('메뉴명', { exact: true }).fill('늦게 저장된 커피');
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await page.getByLabel('카페인량 mg', { exact: true }).fill('67');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      return new Promise<void>(resolve => {
        Reflect.set(window, 'finishDrinkWrite', () => {
          original.call(this, key, value);
          Storage.prototype.setItem = original;
          resolve();
        });
      });
    };
  });
  await page.getByRole('button', { name: '음료 저장', exact: true }).click();
  await expect(page.getByRole('button', { name: '저장하는 중…', exact: true })).toBeDisabled();
  await page.goBack();
  await expect(page.getByLabel('메뉴명', { exact: true })).toBeVisible();
  await page.evaluate(() => (Reflect.get(window, 'finishDrinkWrite') as () => void)());
  await expect(page.getByRole('button', { name: '다음', exact: true })).toBeEnabled();
  await expect(page.getByLabel('메뉴명', { exact: true })).toHaveValue('늦게 저장된 커피');
  await expect(page.getByRole('heading', { name: '카페인 기록하기', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '음료 목록으로 돌아가기', exact: true }).click();
  await expect(page.getByRole('button', { name: /늦게 저장된 커피\s*67\s*mg/ })).toBeVisible();
});
