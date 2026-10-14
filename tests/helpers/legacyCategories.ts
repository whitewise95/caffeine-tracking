import { expect, type Page } from '@playwright/test';

/** Exercise history entries left by v1.1.0 after retiring the settings entry. */
export async function restoreLegacyCategories(page: Page) {
  await expect(page.getByRole('heading', { name: '설정', exact: true })).toBeVisible();
  await page.evaluate(() => {
    const depth = Number(window.history.state?.depth ?? 0);
    const state = { page: 'settings', depth: depth + 1, overlay: { type: 'categories', key: crypto.randomUUID(), originDepth: depth } };
    window.history.pushState(state, '', location.href);
    window.dispatchEvent(new PopStateEvent('popstate', { state }));
  });
  await expect(page.getByRole('dialog', { name: '카테고리 관리', exact: true })).toBeVisible();
}
