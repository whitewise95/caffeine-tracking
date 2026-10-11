import { expect, test } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';

test('absorption explanation opens by tap or keyboard, cites research and dismisses', async ({ page }, info) => {
  await page.clock.setFixedTime(new Date('2026-10-06T12:00:00+09:00'));
  await page.addInitScript(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), {
    ...createInitialState(), entries: [
      { id: 'first', drinkId: 'coffee', drinkName: '커피', caffeineMg: 150, consumedAt: '2026-10-06T11:45:00+09:00', icon: 'coffee' },
      { id: 'second', drinkId: 'tea', drinkName: '차', caffeineMg: 50, consumedAt: '2026-10-06T11:50:00+09:00', icon: 'tea' },
    ],
  });
  await page.goto('/');
  const button = page.getByRole('button', { name: '흡수 중 2잔 설명', exact: true });
  await expect(button).toBeVisible();
  const box = await button.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await button.tap();
  const bubble = page.getByRole('dialog', { name: '흡수 중이란?' });
  await expect(bubble).toBeVisible();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(bubble).toContainText('실제 흡수 상태를 측정한 값은 아니에요');
  await expect(bubble.getByRole('link', { name: /흡수·분해 연구/ })).toHaveAttribute('href', 'https://pubmed.ncbi.nlm.nih.gov/14674790/');
  await expect(bubble.getByRole('link', { name: /약동학 문헌 검토/ })).toHaveAttribute('href', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6247400/');
  await expect(bubble.getByRole('link', { name: /약동학 문헌 검토/ })).toBeInViewport();
  await page.screenshot({ path: info.outputPath('absorption-info.png') });
  const bubbleBox = await bubble.boundingBox();
  expect(bubbleBox!.x).toBeGreaterThanOrEqual(12);
  expect(bubbleBox!.y).toBeGreaterThanOrEqual(8);
  expect(bubbleBox!.x + bubbleBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width - 12);
  await page.keyboard.press('Escape');
  await expect(bubble).toHaveCount(0);
  await expect(button).toBeFocused();
  await button.press('Enter');
  await expect(bubble).toBeVisible();
  await page.getByTestId('remaining-mg').click();
  await expect(bubble).toHaveCount(0);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await button.click();
  await expect(bubble).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const enlargedBox = await bubble.boundingBox();
  expect(enlargedBox!.y).toBeGreaterThanOrEqual(8);
  expect(enlargedBox!.y + enlargedBox!.height).toBeLessThanOrEqual(page.viewportSize()!.height - 8);
  for (const source of [/흡수·분해 연구/, /약동학 문헌 검토/]) {
    const link = bubble.getByRole('link', { name: source });
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeInViewport();
  }
  await page.screenshot({ path: info.outputPath('absorption-info-enlarged.png') });
  await bubble.getByRole('button', { name: '흡수 설명 닫기' }).click();
  await expect(button).toBeFocused();
});

test('absorption explanation disappears with the last absorbing drink', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-06T12:00:00+09:00'));
  await page.addInitScript(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), {
    ...createInitialState(), entries: [{ id: 'first', drinkId: 'coffee', drinkName: '커피', caffeineMg: 150, consumedAt: '2026-10-06T11:45:00+09:00', icon: 'coffee' }],
  });
  await page.goto('/');
  await page.getByRole('button', { name: '흡수 중 1잔 설명', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '흡수 중이란?' })).toBeVisible();
  await page.clock.setFixedTime(new Date('2026-10-06T14:00:00+09:00'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('dialog', { name: '흡수 중이란?' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /흡수 중 \d+잔 설명/ })).toHaveCount(0);
});
