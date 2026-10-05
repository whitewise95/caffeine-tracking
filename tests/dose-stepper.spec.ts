import { expect, test, type Page } from '@playwright/test';

async function openComposer(page: Page, theme = '') {
  await page.clock.install({ time: new Date('2026-10-04T10:00:00+09:00') });
  await page.goto(`/${theme}`);
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: '커피에 내 음료 추가', exact: true }).click();
}

test('dose buttons change exact milligrams, sync the slider and respect limits', async ({ page }) => {
  await openComposer(page);
  const input = page.getByLabel('카페인량 mg', { exact: true });
  const plus = page.getByRole('button', { name: '카페인량 1mg 늘리기', exact: true });
  const minus = page.getByRole('button', { name: '카페인량 1mg 줄이기', exact: true });
  await input.fill('67');
  await plus.click();
  await expect(input).toHaveValue('68');
  await expect(page.getByRole('slider', { name: '카페인량 조절' })).toHaveValue('68');
  await minus.click();
  await expect(input).toHaveValue('67');
  await plus.focus();
  await plus.press('Space');
  await expect(input).toHaveValue('68');
  await minus.focus();
  await minus.press('Enter');
  await expect(input).toHaveValue('67');
  await input.fill('999');
  await plus.click();
  await expect(input).toHaveValue('1000');
  await expect(plus).toBeDisabled();
  await input.fill('1');
  await minus.click();
  await expect(input).toHaveValue('0');
  await expect(minus).toBeDisabled();
});

test('holding accelerates, releasing stops immediately without an extra click', async ({ page }) => {
  await openComposer(page);
  const input = page.getByLabel('카페인량 mg', { exact: true });
  const plus = page.getByRole('button', { name: '카페인량 1mg 늘리기', exact: true });
  await input.fill('100');
  await plus.scrollIntoViewIfNeeded();
  const box = (await plus.boundingBox())!;
  // Keep repeat timing independent of browser protocol latency between reads and release.
  await page.clock.pauseAt(await page.evaluate(() => new Date(Date.now() + 100)));
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.clock.runFor(900);
  const slow = Number(await input.inputValue());
  expect(slow).toBeGreaterThan(100);
  expect(slow).toBeLessThan(110);
  await page.clock.runFor(2100);
  const accelerated = Number(await input.inputValue());
  expect(accelerated - slow).toBeGreaterThan(20);
  await page.mouse.up();
  await expect(input).toHaveValue(String(accelerated));
  await page.clock.runFor(1500);
  await expect(input).toHaveValue(String(accelerated));
  await plus.click();
  await expect(input).toHaveValue(String(accelerated + 1));
  await input.fill('999');
  const boundaryBox = (await plus.boundingBox())!;
  await page.mouse.move(boundaryBox.x + boundaryBox.width / 2, boundaryBox.y + boundaryBox.height / 2);
  await page.mouse.down();
  await page.clock.runFor(2000);
  await expect(input).toHaveValue('1000');
  await expect(plus).toBeDisabled();
  await page.mouse.up();
});

test('touch cancellation and page blur stop a held adjustment', async ({ page }) => {
  await openComposer(page);
  const input = page.getByLabel('카페인량 mg', { exact: true });
  const minus = page.getByRole('button', { name: '카페인량 1mg 줄이기', exact: true });
  await input.fill('500');
  await minus.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', button: 0, isPrimary: true });
  await page.clock.runFor(800);
  expect(Number(await input.inputValue())).toBeLessThan(500);
  await minus.dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'touch' });
  const cancelled = await input.inputValue();
  await page.clock.runFor(1000);
  await expect(input).toHaveValue(cancelled);
  await minus.dispatchEvent('pointerdown', { pointerId: 2, pointerType: 'touch', button: 0, isPrimary: true });
  await page.clock.runFor(800);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const blurred = await input.inputValue();
  await page.clock.runFor(1000);
  await expect(input).toHaveValue(blurred);
});

for (const theme of ['', '?theme=light']) {
  test(`centered input and touch buttons fit enlarged text ${theme || 'dark'}`, async ({ page }, testInfo) => {
    await openComposer(page, theme);
    await page.getByLabel('메뉴명', { exact: true }).fill('내 커피');
    const input = page.getByLabel('카페인량 mg', { exact: true });
    await input.fill('67');
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    const plus = page.getByRole('button', { name: '카페인량 1mg 늘리기', exact: true });
    await plus.scrollIntoViewIfNeeded();
    const box = (await plus.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(48);
    expect(box.height).toBeGreaterThanOrEqual(48);
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await expect(input).toHaveValue('68');
    expect(await input.evaluate(element => getComputedStyle(element).textAlign)).toBe('center');
    expect(await page.getByRole('dialog').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.screenshot({ path: `test-results/${testInfo.project.name}-dose-stepper-${theme ? 'light' : 'dark'}.png` });
    await page.getByRole('button', { name: '음료 저장', exact: true }).click();
    await expect(page.getByRole('heading', { name: '내 커피', exact: true })).toBeVisible();
    await expect(page.locator('.quick-adjust-amount')).toHaveText('68mg');
  });
}

test('record dose uses one milligram taps and a synchronized slider that persists the chosen dose', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-05T10:00:00+09:00') });
  await page.goto('/');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: /얼그레이\s*45\s*mg/ }).click();
  const plus = page.getByRole('button', { name: '카페인량 1mg 늘리기', exact: true });
  const minus = page.getByRole('button', { name: '카페인량 1mg 줄이기', exact: true });
  const slider = page.getByRole('slider', { name: '카페인량 조절', exact: true });
  await plus.click();
  await expect(page.locator('.quick-adjust-amount')).toHaveText('46mg');
  await expect(slider).toHaveValue('46');
  await minus.click();
  await expect(slider).toHaveValue('45');
  await slider.focus();
  await slider.press('End');
  await expect(page.locator('.quick-adjust-amount')).toHaveText('1000mg');
  await expect(plus).toBeDisabled();
  await slider.press('Home');
  await expect(minus).toBeDisabled();
  await expect(page.getByRole('button', { name: '지금 기록', exact: true })).toBeDisabled();
  await slider.press('ArrowRight');
  await page.getByRole('button', { name: '지금 기록', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const entries = await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!).entries);
  expect(entries[0]).toMatchObject({ drinkName: '얼그레이', caffeineMg: 1 });
});

test('held record adjustment accumulates, accelerates and stops on cancellation or leaving the screen', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-05T10:00:00+09:00') });
  await page.goto('/');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  const plus = page.getByRole('button', { name: '카페인량 1mg 늘리기', exact: true });
  const slider = page.getByRole('slider', { name: '카페인량 조절', exact: true });
  await page.clock.pauseAt(await page.evaluate(() => new Date(Date.now() + 100)));
  await plus.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', button: 0, isPrimary: true });
  await page.clock.runFor(900);
  const slow = Number(await slider.inputValue());
  expect(slow).toBeGreaterThan(150);
  expect(slow).toBeLessThan(160);
  await page.clock.runFor(2100);
  const fast = Number(await slider.inputValue());
  expect(fast - slow).toBeGreaterThan(20);
  await plus.dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'touch' });
  await page.clock.runFor(1000);
  await expect(slider).toHaveValue(String(fast));
  await plus.dispatchEvent('pointerdown', { pointerId: 2, pointerType: 'touch', button: 0, isPrimary: true });
  await page.clock.runFor(800);
  await page.getByRole('button', { name: '음료 목록으로 돌아가기', exact: true }).click();
  await page.clock.runFor(4000);
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  await expect(slider).toHaveValue('150');
});
