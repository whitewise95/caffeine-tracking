import { expect, test, type Page } from '@playwright/test';

async function addAmericano(page: Page) {
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  await page.getByRole('button', { name: '카페인 5mg 늘리기' }).click();
  await expect(page.locator('.quick-adjust-amount')).toHaveText('155mg');
  await page.getByRole('button', { name: '지금 기록' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
}

test('record, adjust, visualize, create a drink, reload, edit and delete', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByTestId('remaining-mg')).toHaveText('0');
  await expect(page.locator('.body-visual')).toHaveAttribute('data-level', 'LOW');
  await addAmericano(page);
  await expect(page.getByTestId('remaining-mg')).toHaveText('155');
  await expect(page.locator('.body-visual')).toHaveAttribute('data-level', 'FILLED');
  await expect(page.getByRole('status')).not.toBeVisible();
  const forecast = await page.locator('.forecast').boundingBox();
  const addDock = await page.locator('.home-cta').boundingBox();
  expect(forecast!.y + forecast!.height).toBeLessThanOrEqual(addDock!.y);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-home.png` });
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: '커피에 내 음료 추가' }).click();
  await page.getByRole('button', { name: '테이크아웃 컵', exact: true }).click();
  await page.getByLabel('메뉴명').fill('나의 모닝커피');
  await page.getByLabel('카페인량 mg', { exact: true }).fill('85');
  await page.getByRole('button', { name: '음료 저장', exact: true }).click();
  await expect(page.getByRole('button', { name: /나의 모닝커피\s*85\s*mg/ })).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: `test-results/${testInfo.project.name}-sheet.png` });
  await page.getByRole('button', { name: '지금 기록' }).click();
  await expect(page.getByTestId('remaining-mg')).toHaveText('240');
  await expect(page.locator('.body-visual')).toHaveAttribute('data-level', 'HIGH_VISUAL');
  await page.reload();
  await expect(page.getByTestId('remaining-mg')).toHaveText('240');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await expect(page.getByRole('button', { name: /나의 모닝커피\s*85\s*mg/ })).toBeVisible();
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
  await expect(page.locator('.history-entry')).toHaveCount(2);
  await page.getByRole('button', { name: '아메리카노 기록 수정' }).click();
  await page.getByLabel('카페인량 (mg)').fill('100');
  await page.getByRole('button', { name: '수정 저장' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.history-entry').filter({ hasText: '아메리카노' })).toContainText('100mg');
  await page.getByRole('button', { name: '나의 모닝커피 기록 삭제' }).click();
  await page.getByRole('button', { name: '삭제하기', exact: true }).click();
  await expect(page.locator('.history-entry')).toHaveCount(1);
  await page.getByRole('navigation').getByRole('button', { name: '홈', exact: true }).click();
  await expect(page.getByTestId('remaining-mg')).toHaveText('100');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
});

test('back closes a sheet first, deep routes work, half-life is fixed, reset is confirmed', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('heading', { name: '지금 내 카페인' })).toBeVisible();
  await addAmericano(page);
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: '설정', exact: true })).toBeVisible();
  await expect(page.getByRole('slider')).toHaveCount(0);
  await expect(page.getByTestId('half-life-value')).toHaveText('5시간0분');
  await page.reload();
  await expect(page.getByRole('slider')).toHaveCount(0);
  await page.getByRole('button', { name: '모든 데이터 초기화' }).click();
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await page.getByRole('button', { name: '모든 데이터 초기화' }).click();
  await page.getByRole('button', { name: '초기화하기', exact: true }).click();
  await expect(page.getByTestId('half-life-value')).toHaveText('5시간0분');
  await page.getByRole('navigation').getByRole('button', { name: '홈', exact: true }).click();
  await expect(page.getByTestId('remaining-mg')).toHaveText('0');
});

test('light Toss theme and keyboard focus remain usable', async ({ page }) => {
  await page.goto('/?theme=light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: '카페인 추가', exact: true })).toBeFocused();
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  await page.getByRole('button', { name: '지금 기록' }).click();
  await expect(page.getByTestId('remaining-mg')).toHaveText('150');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('finishing a delayed save does not navigate after the sheet was dismissed', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
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
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('finish-test-save')));
  await expect(page.getByRole('status')).toContainText('기록했어요');
  await expect(page).toHaveURL(/\/history$/);
  await expect(page.locator('.history-entry')).toHaveCount(1);
});

test('storage write failure stays visible and does not create a phantom record', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); }; });
  await page.getByRole('button', { name: '지금 기록' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('alert').first()).toContainText('저장');
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await expect(page.getByTestId('remaining-mg')).toHaveText('0');
  await page.reload();
  await expect(page.getByTestId('remaining-mg')).toHaveText('0');
});

test('forward navigation never restores an editor for a deleted record', async ({ page }) => {
  await page.goto('/');
  await addAmericano(page);
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
  await page.getByRole('button', { name: '아메리카노 기록 삭제' }).click();
  await page.getByRole('button', { name: '삭제하기', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.goForward();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('heading', { name: '아직 기록이 없어요' })).toBeVisible();
});

test('the caffeine surface gently sways and stops for reduced motion', async ({ page }) => {
  await page.goto('/');
  await addAmericano(page);

  const frontWave = page.locator('.liquid-wave-front');
  const backWave = page.locator('.liquid-wave-back');
  await expect(frontWave).toBeVisible();
  await expect(backWave).toBeVisible();
  await expect.poll(() => frontWave.evaluate(element => getComputedStyle(element).animationName)).toBe('liquid-sway-front');
  await expect.poll(() => backWave.evaluate(element => getComputedStyle(element).animationName)).toBe('liquid-sway-back');
  await expect.poll(() => frontWave.evaluate(element => getComputedStyle(element).animationDuration)).toBe('2.2s');
  await expect.poll(() => backWave.evaluate(element => getComputedStyle(element).animationDuration)).toBe('2.8s');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => frontWave.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  await expect.poll(() => backWave.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
});
