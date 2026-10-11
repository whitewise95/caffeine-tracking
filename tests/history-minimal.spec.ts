import { expect, test } from '@playwright/test';

test('empty history keeps its header add action without a duplicate call to action', async ({ page }) => {
  await page.goto('/history');
  await expect(page.getByRole('heading', { name: '한 잔의 기록', exact: true })).toBeVisible();
  await expect(page.getByText('MY JOURNAL', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '아직 기록이 없어요' })).toBeVisible();
  await expect(page.getByRole('button', { name: '첫 카페인 기록하기', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await expect(page.getByRole('heading', { name: '어떤 카페인을 마셨나요?' })).toBeVisible();
});
