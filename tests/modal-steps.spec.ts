import { expect, test } from '@playwright/test';

for (const back of ['header', 'browser'] as const) {
  test(`${back} back clears the drink selection inside the modal`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
    const tea = page.getByRole('button', { name: /얼그레이\s*45\s*mg/ });
    await tea.click();
    await expect(page.getByRole('button', { name: /선택 해제/ })).toHaveCount(0);
    await page.getByRole('button', { name: '카페인량 1mg 늘리기' }).click();
    if (back === 'header') await page.getByRole('button', { name: '음료 목록으로 돌아가기' }).click();
    else await page.goBack();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(tea).toHaveAttribute('aria-pressed', 'false');
    await expect(tea).toBeFocused();
    await expect(page.locator('.drink-badge.is-selected')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /계속 기록하기/ })).toHaveCount(0);
    await tea.click();
    await expect(page.locator('.quick-adjust-amount')).toHaveText('45mg');
  });
}

test('drink and custom creation replace content inside the same modal', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.locator('dialog').evaluate(element => element.setAttribute('data-original-modal', 'true'));
  const originalUrl = page.url();
  await page.getByRole('button', { name: /얼그레이\s*45\s*mg/ }).click();
  await expect(page.getByRole('heading', { name: '카페인 기록하기', exact: true })).toBeVisible();
  await expect(page.locator('.sheet-category')).toHaveCount(0);
  await expect(page.locator('dialog[data-original-modal="true"]')).toBeVisible();
  await page.getByRole('button', { name: '카페인량 1mg 늘리기' }).click();
  await page.getByRole('switch', { name: '천천히 마셨어요' }).check();
  await page.screenshot({ path: `test-results/${testInfo.project.name}-modal-record.png` });
  await page.goBack();
  await expect(page.getByRole('heading', { name: '어떤 카페인을 마셨나요?' })).toBeVisible();
  await expect(page.locator('.quick-adjust')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /얼그레이\s*45\s*mg/ })).toHaveAttribute('aria-pressed', 'false');
  await page.goForward();
  await expect(page.getByRole('heading', { name: '어떤 카페인을 마셨나요?' })).toBeVisible();
  await expect(page.locator('.drink-badge.is-selected')).toHaveCount(0);
  await page.getByRole('button', { name: '커피에 내 음료 추가' }).click();
  await expect(page.getByRole('heading', { name: '내 음료 추가', exact: true })).toBeVisible();
  await expect(page.locator('.sheet-category')).toHaveCount(0);
  await expect(page.locator('.quick-adjust')).toHaveCount(0);
  await page.getByLabel('메뉴명').fill('나의 커피');
  await page.getByLabel('카페인량 mg', { exact: true }).fill('67');
  await page.screenshot({ path: `test-results/${testInfo.project.name}-modal-custom.png` });
  await page.getByRole('button', { name: '음료 저장', exact: true }).click();
  await expect(page.getByRole('heading', { name: '카페인 기록하기' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '나의 커피', exact: true })).toBeVisible();
  await expect(page.locator('.quick-adjust-amount')).toHaveText('67mg');
  await expect(page.locator('dialog[data-original-modal="true"]')).toBeVisible();
  expect(page.url()).toBe(originalUrl);
  await page.getByRole('button', { name: '음료 목록으로 돌아가기' }).click();
  await expect(page.getByRole('button', { name: /나의 커피\s*67\s*mg/ })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByLabel('메뉴명')).toHaveCount(0);
  await page.getByRole('button', { name: /나의 커피\s*67\s*mg/ }).click();
  await expect(page.locator('.quick-adjust-amount')).toHaveText('67mg');
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: '카페인 추가', exact: true })).toBeFocused();
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await expect(page.getByRole('button', { name: /나의 커피\s*67\s*mg/ })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('a save finishing after back to the list does not close that screen', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      return new Promise<void>(resolve => {
        window.addEventListener('finish-test-save', () => { original.call(this, key, value); resolve(); }, { once: true });
      });
    };
  });
  await page.getByRole('button', { name: '지금 기록' }).click();
  await page.goBack();
  await expect(page.getByRole('heading', { name: '어떤 카페인을 마셨나요?' })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('finish-test-save')));
  await expect(page.getByRole('status')).toContainText('기록했어요');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: '어떤 카페인을 마셨나요?' })).toBeVisible();
  await expect(page.getByRole('button', { name: '닫기', exact: true })).toBeEnabled();
  await page.goBack();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('modal screens support focus, reduced motion and closing from custom creation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?theme=light');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: '차에 내 음료 추가' }).click();
  await expect(page.getByRole('heading', { name: '내 음료 추가' })).toBeFocused();
  await expect.poll(() => page.locator('.sheet-step').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: '카페인 추가', exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden');
});
