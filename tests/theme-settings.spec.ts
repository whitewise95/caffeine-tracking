import { expect, test, type Page } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';
import type { CaffeineState } from '../src/features/caffeine/model/caffeine.types';

const storageKey = 'caffeine-tracker:state:v1';

async function seed(page: Page, state = createInitialState(), path = '/settings') {
  await page.addInitScript(({ key, state }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
  }, { key: storageKey, state });
  await page.goto(path);
  await expect(page.getByRole('heading', { name: '화면 테마', exact: true })).toBeVisible();
}

async function stored(page: Page): Promise<CaffeineState> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!), storageKey);
}

for (const theme of ['light', 'dark'] as const) {
  test(`explicitly choosing the currently displayed ${theme} theme saves it beyond preview defaults`, async ({ page }) => {
    await seed(page, createInitialState(), theme === 'light' ? '/settings?theme=light' : '/settings');
    const selected = page.getByRole('button', { name: theme === 'light' ? '밝게' : '어둡게', exact: true });
    await expect(selected).toHaveAttribute('aria-pressed', 'true');
    expect((await stored(page)).settings.theme).toBeUndefined();
    await selected.click();
    await expect.poll(async () => (await stored(page)).settings.theme).toBe(theme);
    await page.goto(theme === 'light' ? '/settings' : '/settings?theme=light');
    await expect(selected).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await page.reload();
    await expect(selected).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  });
}

test('browser theme changes persist across navigation and reload without changing legacy records or photos', async ({ page }) => {
  const state = createInitialState();
  state.customDrinks = [{
    id: 'photo-coffee', categoryId: 'coffee', name: '사진 커피', caffeineMg: 67,
    icon: 'cup', isCustom: true, sourceType: 'custom',
    photoDataUrl: await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 8;
      canvas.height = 8;
      return canvas.toDataURL('image/jpeg');
    }),
  }];
  state.deletedDefaultDrinkIds = ['cold-brew'];
  state.entries = [{ id: 'legacy-entry', drinkId: 'photo-coffee', drinkName: '사진 커피', caffeineMg: 67, icon: 'cup', sourceType: 'custom', consumedAt: '2026-10-05T09:00:00+09:00' }];
  await seed(page, state, '/settings?theme=light');
  const light = page.getByRole('button', { name: '밝게', exact: true });
  const dark = page.getByRole('button', { name: '어둡게', exact: true });
  await expect(light).toHaveAttribute('aria-pressed', 'true');
  await dark.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(dark).toHaveAttribute('aria-pressed', 'true');
  await expect(light).toHaveAttribute('aria-pressed', 'false');
  expect(await stored(page)).toEqual({ ...state, settings: { ...state.settings, theme: 'dark' } });

  await page.getByRole('navigation').getByRole('button', { name: '홈', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.getByRole('heading', { name: '지금 내 카페인', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('navigation').getByRole('button', { name: '설정', exact: true }).click();
  await expect(dark).toHaveAttribute('aria-pressed', 'true');
  await light.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.goto('/settings');
  await expect(light).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await stored(page)).toEqual({ ...state, settings: { ...state.settings, theme: 'light' } });
});

test('failed theme storage keeps the current theme and records and provides a successful retry', async ({ page }) => {
  const state = createInitialState();
  state.settings.theme = 'dark';
  state.entries = [{ id: 'kept-entry', drinkId: 'americano', drinkName: '아메리카노', caffeineMg: 150, icon: 'coffee', consumedAt: '2026-10-05T09:00:00+09:00' }];
  await seed(page, state);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) {
        Storage.prototype.setItem = original;
        throw new DOMException('Storage is full', 'QuotaExceededError');
      }
      return original.call(this, name, value);
    };
  }, storageKey);
  await page.getByRole('button', { name: '밝게', exact: true }).click();
  await expect(page.getByText('테마를 저장하지 못했어요.', { exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: '어둡게', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await stored(page)).toEqual(state);
  await page.getByRole('button', { name: '다시 시도', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByText('테마를 저장하지 못했어요.', { exact: true })).toHaveCount(0);
  expect(await stored(page)).toEqual({ ...state, settings: { ...state.settings, theme: 'light' } });
  await page.reload();
  await expect(page.getByRole('button', { name: '밝게', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('a pending repository write disables theme controls and does not apply the preference early', async ({ page }) => {
  const state = createInitialState();
  state.settings.theme = 'dark';
  await seed(page, state);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name !== key) return original.call(this, name, value);
      return new Promise<void>(resolve => {
        Object.defineProperty(window, 'finishThemeWrite', { configurable: true, value: () => {
          original.call(this, name, value);
          Storage.prototype.setItem = original;
          resolve();
        } });
      });
    };
  }, storageKey);
  const light = page.getByRole('button', { name: '밝게', exact: true });
  const dark = page.getByRole('button', { name: '어둡게', exact: true });
  await light.click();
  await expect(light).toBeDisabled();
  await expect(dark).toBeDisabled();
  await expect(page.getByRole('region', { name: '화면 테마', exact: true })).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(dark).toHaveAttribute('aria-pressed', 'true');
  expect(await stored(page)).toEqual(state);
  await page.evaluate(() => {
    const finish = Reflect.get(window, 'finishThemeWrite') as () => void;
    finish();
    Reflect.deleteProperty(window, 'finishThemeWrite');
  });
  await expect(light).toBeEnabled();
  await expect(light).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect((await stored(page)).settings.theme).toBe('light');
});

for (const theme of ['light', 'dark'] as const) {
  test(`theme choices are legible with 200% text and 48px touch targets in ${theme} mode`, async ({ page }, testInfo) => {
    const state = createInitialState();
    state.settings.theme = theme;
    await seed(page, state);
    const section = page.getByRole('region', { name: '화면 테마', exact: true });
    await page.screenshot({ path: testInfo.outputPath(`theme-${theme}.png`), animations: 'disabled' });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await section.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await section.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    for (const button of await section.getByRole('button').all()) {
      const box = (await button.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(48);
      expect(box.width).toBeGreaterThanOrEqual(48);
      expect(await button.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    await page.screenshot({ path: testInfo.outputPath(`theme-${theme}-200.png`), animations: 'disabled' });
    const next = theme === 'light' ? 'dark' : 'light';
    await section.getByRole('button', { name: next === 'light' ? '밝게' : '어둡게', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', next);
  });
}
