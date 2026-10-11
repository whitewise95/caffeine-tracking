import { expect, test, type Page } from '@playwright/test';
import { installTossHost } from './helpers/tossHost';

const back = (page: Page) => page.evaluate(() => (Reflect.get(window, 'testNativeBack') as () => void)());
const closes = (page: Page) => page.evaluate(() => Number(Reflect.get(window, 'testCloseRequests')));

test('Android home back confirms exit, cancels without leaving and closes only on confirmation', async ({ page }, info) => {
  await installTossHost(page, 'android');
  await page.goto('/');
  await expect(page.getByRole('button', { name: '카페인 추가', exact: true })).toBeVisible();
  await back(page);
  const dialog = page.getByRole('alertdialog', { name: '앱을 나가시겠습니까?', exact: true });
  await expect(dialog).toBeVisible();
  expect(await closes(page)).toBe(0);
  await back(page);
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await back(page);
  await dialog.getByRole('button', { name: '취소', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(await closes(page)).toBe(0);
  await page.getByRole('button', { name: '설정', exact: true }).click();
  await page.getByRole('button', { name: '홈', exact: true }).click();
  await back(page);
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await dialog.screenshot({ path: info.outputPath('exit-confirmation.png') });
  await dialog.getByRole('button', { name: '나가기', exact: true }).click();
  await expect.poll(() => closes(page)).toBe(1);
});

test('Android back matches the page back and dismisses nested sheet steps first', async ({ page }) => {
  await installTossHost(page, 'android');
  await page.goto('/remaining');
  await expect(page.getByRole('heading', { name: '음료별 잔존 카페인' })).toBeVisible();
  await back(page);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await page.getByRole('button', { name: '아직 남아 있는 카페인 보기' }).click();
  await page.getByRole('button', { name: '홈으로 돌아가기' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.locator('[data-drink-id="americano"]').click();
  await back(page);
  await expect(page.getByRole('heading', { name: '어떤 카페인을 마셨나요?' })).toBeVisible();
  await back(page);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await back(page);
  await expect(page.getByRole('alertdialog')).toBeVisible();
  expect(await closes(page)).toBe(0);
});

test('a failed native exit stays open with a retry and preserves records', async ({ page }) => {
  await installTossHost(page, 'android');
  await page.goto('/');
  await expect(page.getByRole('button', { name: '카페인 추가', exact: true })).toBeVisible();
  const before = await page.evaluate(() => localStorage.getItem('test-toss-native-state'));
  await back(page);
  const dialog = page.getByRole('alertdialog');
  await page.evaluate(() => Reflect.set(window, 'testFailNextClose', true));
  await dialog.getByRole('button', { name: '나가기', exact: true }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(dialog.getByRole('button', { name: '나가기', exact: true })).toBeEnabled();
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await dialog.getByRole('button', { name: '나가기', exact: true }).click();
  await expect.poll(() => closes(page)).toBe(2);
  expect(await page.evaluate(() => localStorage.getItem('test-toss-native-state'))).toBe(before);
});

test('rapid Android back cancels the exit prompt once without skipping home', async ({ page }) => {
  await installTossHost(page, 'android');
  await page.goto('/');
  await page.getByRole('button', { name: '설정', exact: true }).click();
  await page.getByRole('button', { name: '홈', exact: true }).click();
  await back(page);
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.evaluate(() => {
    const nativeBack = Reflect.get(window, 'testNativeBack') as () => void;
    nativeBack();
    nativeBack();
  });
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: '카페인 추가', exact: true })).toBeVisible();
  await back(page);
  await expect(page.getByRole('alertdialog')).toBeVisible();
});
