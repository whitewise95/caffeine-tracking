import { expect, test } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';
import { AVATAR_STORAGE_KEY } from '../src/features/avatar/repository/LocalAvatarRepository';

const caffeineKey = 'caffeine-tracker:state:v1';
const outfit = { hat: 'hat-crown', glasses: 'glasses-round', top: 'top-tee', bottom: 'bottom-wide', shoes: 'shoes-low', accessory: 'accessory-backpack' };

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-15T12:00:00+09:00'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const state = createInitialState();
  state.entries = [{ id: 'visibility-sample', drinkId: 'coffee', drinkName: '가상 커피', icon: 'coffee', caffeineMg: 150, consumedAt: '2026-10-15T11:45:00+09:00' }];
  await page.addInitScript(({ state, outfit, caffeineKey, avatarKey }) => {
    if (!localStorage.getItem(caffeineKey)) localStorage.setItem(caffeineKey, JSON.stringify(state));
    if (!localStorage.getItem(avatarKey)) localStorage.setItem(avatarKey, JSON.stringify({ version: 1, outfit }));
  }, { state, outfit, caffeineKey, avatarKey: AVATAR_STORAGE_KEY });
  await page.goto('/');
});

test('temporarily hiding an outfit preserves the live avatar, cup and stored data', async ({ page }, testInfo) => {
  const toggle = page.getByRole('checkbox', { name: '겉멋 잠깐 끄기' });
  await expect(toggle).toBeVisible();
  await expect(toggle).not.toBeChecked();
  for (const id of Object.values(outfit)) await expect(page.locator(`.home-page [data-avatar-item="${id}"]`).first()).toBeAttached();
  const saved = await page.evaluate(keys => keys.map(key => localStorage.getItem(key)), [AVATAR_STORAGE_KEY, caffeineKey]);
  const remaining = await page.getByTestId('remaining-mg').textContent();
  const body = page.locator('.liquid-avatar svg[role="img"]');
  await body.evaluate(element => element.setAttribute('data-live-instance', 'preserved'));
  await page.screenshot({ path: testInfo.outputPath('outfit-visible.png'), animations: 'disabled' });

  await toggle.check();
  await expect(page.locator('.home-page [data-avatar-item]')).toHaveCount(0);
  await expect(page.locator('.avatar-sip-cup')).toHaveCount(1);
  await expect(body).toHaveAttribute('data-live-instance', 'preserved');
  await expect(page.getByTestId('remaining-mg')).toHaveText(remaining!);
  expect(await page.evaluate(keys => keys.map(key => localStorage.getItem(key)), [AVATAR_STORAGE_KEY, caffeineKey])).toEqual(saved);
  await page.screenshot({ path: testInfo.outputPath('outfit-hidden.png'), animations: 'disabled' });

  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).not.toBeChecked();
  for (const id of Object.values(outfit)) await expect(page.locator(`.home-page [data-avatar-item="${id}"]`).first()).toBeAttached();
  await expect(body).toHaveAttribute('data-live-instance', 'preserved');
  expect(await page.evaluate(keys => keys.map(key => localStorage.getItem(key)), [AVATAR_STORAGE_KEY, caffeineKey])).toEqual(saved);

  const target = await page.getByText('겉멋 잠깐 끄기', { exact: true }).locator('..').boundingBox();
  expect(target!.height).toBeGreaterThanOrEqual(48);
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('button', { name: '캐릭터 꾸미기', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('outfit-toggle-large-text.png'), animations: 'disabled' });
});

test('hidden outfits stay editable and the latest saved outfit returns when revealed', async ({ page }) => {
  const toggle = page.getByRole('checkbox', { name: '겉멋 잠깐 끄기' });
  await toggle.check();
  await page.getByRole('button', { name: '기록', exact: true }).click();
  await page.getByRole('button', { name: '홈', exact: true }).click();
  await expect(toggle).toBeChecked();
  await expect(page.locator('.home-page [data-avatar-item]')).toHaveCount(0);

  await page.getByRole('button', { name: '캐릭터 꾸미기', exact: true }).click();
  for (const id of Object.values(outfit)) await expect(page.locator(`.wardrobe-preview [data-avatar-item="${id}"]`).first()).toBeAttached();
  await page.getByRole('button', { name: '베레모', exact: true }).click();
  await page.getByRole('button', { name: '적용하기', exact: true }).click();
  await expect(toggle).toBeChecked();
  await expect(page.locator('.home-page [data-avatar-item]')).toHaveCount(0);
  await toggle.uncheck();
  await expect(page.locator('.home-page [data-avatar-item="hat-beret"]').first()).toBeAttached();
  await expect(page.locator('.home-page [data-avatar-item="hat-crown"]')).toHaveCount(0);

  await toggle.check();
  await page.reload();
  await expect(toggle).not.toBeChecked();
  await expect(page.locator('.home-page [data-avatar-item="hat-beret"]').first()).toBeAttached();
});

test('removing all items while hidden leaves an escape from hidden mode', async ({ page }) => {
  const toggle = page.getByRole('checkbox', { name: '겉멋 잠깐 끄기' });
  await toggle.check();
  await page.getByRole('button', { name: '캐릭터 꾸미기', exact: true }).click();
  await page.getByRole('button', { name: '모두 벗기기' }).click();
  await page.getByRole('button', { name: '적용하기', exact: true }).click();
  await expect(toggle).toBeChecked();
  // This empty-outfit control removes itself on click, so assert its removal
  // instead of asking uncheck() to wait for a now-detached input's state.
  await page.getByText('겉멋 잠깐 끄기', { exact: true }).click();
  await expect(toggle).toHaveCount(0);
  await expect(page.locator('.home-page [data-avatar-item]')).toHaveCount(0);
  await page.getByRole('button', { name: '캐릭터 꾸미기', exact: true }).click();
  await page.getByRole('button', { name: '비니', exact: true }).click();
  await page.getByRole('button', { name: '적용하기', exact: true }).click();
  await expect(toggle).not.toBeChecked();
  await expect(page.locator('.home-page [data-avatar-item="hat-beanie"]').first()).toBeAttached();
});
