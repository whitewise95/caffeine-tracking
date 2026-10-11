import { expect, test } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';
import { installTossHost } from './helpers/tossHost';

const storageKey = 'caffeine-tracker:state:v1';

for (const native of [false, true]) {
  test(`dark-only appearance ignores legacy light preferences in ${native ? 'Toss' : 'browser'}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: 'light' });
    const state = createInitialState();
    state.settings.theme = 'light';
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
    state.entries = [{ id: 'kept-entry', drinkId: 'photo-coffee', drinkName: '사진 커피', caffeineMg: 67, icon: 'cup', sourceType: 'custom', consumedAt: '2026-10-05T09:00:00+09:00' }];
    if (native) await installTossHost(page);
    const key = native ? 'test-toss-native-state' : storageKey;
    await page.addInitScript(({ key, state }) => {
      if (!localStorage.getItem(key) || key === 'test-toss-native-state') localStorage.setItem(key, JSON.stringify(state));
    }, { key, state });
    await page.goto('/settings?theme=light');
    await expect(page.getByRole('heading', { name: '설정', exact: true })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#0A0B0E');
    await expect(page.getByRole('heading', { name: '화면 테마', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^(밝게|어둡게)$/ })).toHaveCount(0);
    if (native) {
      await expect.poll(() => page.evaluate(() => (Reflect.get(window, 'testNavigationOptions') as { theme: string; backgroundColor: string }[]).at(-1))).toEqual({ theme: 'dark', backgroundColor: '#0A0B0E' });
      expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`dark-settings-${native ? 'toss' : 'browser'}.png`) });
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
    await expect(page.getByRole('heading', { name: '한 잔의 기록', exact: true })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('navigation').getByRole('button', { name: '홈', exact: true }).click();
    await page.reload();
    await expect(page.getByTestId('remaining-mg')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(state);
  });

  test(`${native ? 'Toss' : 'browser'} starts dark without a saved preference`, async ({ page }) => {
    if (native) await installTossHost(page);
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/?theme=light');
    await expect(page.getByTestId('remaining-mg')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
    await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCSS('background-color', 'rgb(18, 21, 26)');
  });
}
