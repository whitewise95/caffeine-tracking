import { expect, test } from '@playwright/test';
import { AVATAR_CATEGORIES, AVATAR_ITEMS } from '../src/features/avatar/data/avatarCatalog';
import { emptyOutfit } from '../src/features/avatar/model/avatar';
import { createInitialState } from '../src/features/caffeine/model/caffeine';
import { installTossHost } from './helpers/tossHost';

const avatarKey = 'caffeine-tracker:avatar:v1';

test('outfit previews stay separate until applying and survive reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '캐릭터 꾸미기', exact: true }).click();
  await expect(page.getByRole('heading', { name: '캐릭터 꾸미기' })).toBeVisible();
  await expect(page.getByRole('button', { name: '적용하기', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '비니', exact: true }).click();
  await expect(page.locator('.wardrobe-preview [data-avatar-item="hat-beanie"]').first()).toBeAttached();
  await page.getByRole('button', { name: '홈으로 돌아가기' }).click();
  await expect(page.locator('.home-page [data-avatar-item="hat-beanie"]')).toHaveCount(0);
  await page.getByRole('button', { name: '캐릭터 꾸미기', exact: true }).click();
  await page.getByRole('button', { name: '비니', exact: true }).click();
  await page.getByRole('button', { name: '적용하기', exact: true }).click();
  await expect(page.locator('.home-page [data-avatar-item="hat-beanie"]').first()).toBeAttached();
  await page.reload();
  await expect(page.locator('.home-page [data-avatar-item="hat-beanie"]').first()).toBeAttached();
});

test('slots replace independently, explicit removal and reset remain drafts', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '캐릭터 꾸미기', exact: true }).click();
  await page.getByRole('button', { name: '비니', exact: true }).click();
  await page.getByRole('button', { name: '비니', exact: true }).click();
  await expect(page.getByRole('button', { name: '비니', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('tab', { name: '안경', exact: true }).click();
  await page.getByRole('button', { name: '동그란 안경', exact: true }).click();
  await page.getByRole('tab', { name: /모자/ }).click();
  await page.getByRole('button', { name: '베레모', exact: true }).click();
  await expect(page.locator('.wardrobe-preview [data-avatar-item="glasses-round"]').first()).toBeAttached();
  await expect(page.locator('.wardrobe-preview [data-avatar-item="hat-beanie"]')).toHaveCount(0);
  await page.getByRole('button', { name: '착용 안 함', exact: true }).click();
  await expect(page.locator('.wardrobe-preview [data-avatar-item="hat-beret"]')).toHaveCount(0);
  await page.getByRole('button', { name: '적용하기', exact: true }).click();
  await expect(page.locator('.home-page')).toBeVisible();
  const saved = await page.evaluate(key => localStorage.getItem(key), avatarKey);
  await page.getByRole('button', { name: '캐릭터 꾸미기', exact: true }).click();
  await page.getByRole('button', { name: '모두 벗기기' }).click();
  await expect(page.locator('.wardrobe-preview [data-avatar-item]')).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), avatarKey)).toBe(saved);
  await page.goBack();
  await expect(page.locator('.home-page [data-avatar-item="glasses-round"]').first()).toBeAttached();
  await page.getByRole('button', { name: '캐릭터 꾸미기', exact: true }).click();
  await page.getByRole('button', { name: '모두 벗기기' }).click();
  await page.getByRole('button', { name: '적용하기', exact: true }).click();
  await expect(page.locator('.home-page [data-avatar-item]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.home-page [data-avatar-item]')).toHaveCount(0);
});

test('native write failure keeps preview and records, retry saves, native back discards', async ({ page }) => {
  await installTossHost(page, 'android');
  await page.goto('/');
  await page.getByRole('button', { name: '캐릭터 꾸미기', exact: true }).click();
  const before = await page.evaluate(() => localStorage.getItem('test-toss-native-state'));
  await page.getByRole('button', { name: '비니', exact: true }).click();
  await page.evaluate(() => Reflect.set(window, 'testFailNextStorage', true));
  await page.getByRole('button', { name: '적용하기', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('저장하지 못했어요');
  await expect(page.getByRole('button', { name: '비니', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('test-toss-native-avatar'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('test-toss-native-state'))).toBe(before);
  await page.getByRole('button', { name: '다시 적용하기', exact: true }).click();
  await expect(page.locator('.home-page [data-avatar-item="hat-beanie"]').first()).toBeAttached();
  expect(await page.evaluate(() => localStorage.getItem('test-toss-native-state'))).toBe(before);
  await page.getByRole('button', { name: '캐릭터 꾸미기', exact: true }).click();
  await page.getByRole('button', { name: '베레모', exact: true }).click();
  await page.evaluate(() => Reflect.get(window, 'testNativeBack')());
  await expect(page.locator('.home-page [data-avatar-item="hat-beanie"]').first()).toBeAttached();
  await expect(page.locator('.home-page [data-avatar-item="hat-beret"]')).toHaveCount(0);
});

test('late native save never navigates a later visit and rapid apply writes once', async ({ page }) => {
  await installTossHost(page);
  await page.goto('/');
  await page.getByRole('button', { name: '캐릭터 꾸미기', exact: true }).click();
  await page.getByRole('button', { name: '비니', exact: true }).click();
  await page.evaluate(() => Reflect.set(window, 'testDelayAvatarSave', true));
  await page.getByRole('button', { name: '적용하기', exact: true }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(page.getByRole('button', { name: '저장 중…' })).toBeDisabled();
  expect(await page.evaluate(() => Reflect.get(window, 'testAvatarWrites'))).toBe(1);
  await page.getByRole('button', { name: '홈으로 돌아가기' }).click();
  await page.getByRole('button', { name: '캐릭터 꾸미기', exact: true }).click();
  await page.evaluate(() => Reflect.get(window, 'testResolveAvatarSave')());
  await expect(page.getByRole('heading', { name: '캐릭터 꾸미기' })).toBeVisible();
  await expect(page.getByRole('button', { name: '비니', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: '적용하기', exact: true })).toBeDisabled();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.getByRole('button', { name: '홈으로 돌아가기' }).click();
  await expect(page.locator('.home-page [data-avatar-item="hat-beanie"]').first()).toBeAttached();
});

test('avatar read errors permit caffeine use and require retry before editing', async ({ page }) => {
  await installTossHost(page);
  await page.addInitScript(() => Reflect.set(window, 'testFailAvatarRead', true));
  await page.goto('/');
  await expect(page.getByTestId('remaining-mg')).toBeVisible();
  await page.getByRole('button', { name: '캐릭터 꾸미기', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('불러오지 못했어요');
  await expect(page.getByRole('button', { name: '적용하기', exact: true })).toHaveCount(0);
  await page.evaluate(() => Reflect.set(window, 'testFailAvatarRead', false));
  await page.getByRole('button', { name: '다시 불러오기' }).click();
  await expect(page.getByRole('button', { name: '착용 안 함', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('all sixty items render real artwork, preserve the live character and fit mobile layout', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  await page.goto('/');
  await page.getByRole('button', { name: '캐릭터 꾸미기', exact: true }).click();
  await page.locator('.wardrobe-preview svg[role="img"]').evaluate(svg => svg.setAttribute('data-instance-check', 'preserved'));
  for (const category of AVATAR_CATEGORIES) {
    await page.getByRole('tab', { name: new RegExp(category.label) }).click();
    await expect(page.getByRole('group', { name: `${category.label} 아이템` }).getByRole('button')).toHaveCount(11);
    for (const item of AVATAR_ITEMS.filter(item => item.slot === category.id)) {
      const choice = page.getByRole('button', { name: item.name, exact: true });
      await expect(choice.locator('svg').locator('path,rect,circle,ellipse,polygon,line,polyline').first()).toBeAttached();
      await choice.click();
      await expect(choice).toHaveAttribute('aria-pressed', 'true');
      expect(await page.locator(`.wardrobe-preview [data-avatar-item="${item.id}"]`).locator('path,rect,circle,ellipse,polygon,line,polyline').count()).toBeGreaterThan(0);
      await expect(page.locator('.wardrobe-preview svg[role="img"]')).toHaveAttribute('data-instance-check', 'preserved');
    }
    await page.screenshot({ path: testInfo.outputPath(`wardrobe-${category.id}.png`), animations: 'disabled' });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: '적용하기', exact: true }).click();
  await expect(page.locator('.home-page')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('wardrobe-all-equipped-home.png'), animations: 'disabled' });
});

test('keyboard, enlarged text and short viewport keep all wardrobe controls accessible', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/wardrobe');
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');
  await page.getByRole('tab', { name: '모자', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: '안경', exact: true })).toBeFocused();
  await page.getByRole('button', { name: '동그란 안경', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: '동그란 안경', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('wardrobe-large-text.png'), animations: 'disabled' });
  await page.setViewportSize({ width: 375, height: 540 });
  await page.getByRole('button', { name: '적용하기', exact: true }).click();
  await expect(page.locator('.home-page')).toBeVisible();
});

test('skirt fabric covers boot shafts and category thumbnails include every silhouette', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/wardrobe');
  await page.getByRole('tab', { name: '하의', exact: true }).click();
  await page.getByRole('button', { name: '플리츠 스커트', exact: true }).click();
  await page.getByRole('tab', { name: '신발', exact: true }).click();
  await page.getByRole('button', { name: '레인부츠', exact: true }).click();
  const frontItem = await page.locator('.wardrobe-preview .avatar-shape').evaluate((shape: SVGGElement) => {
    const point = new DOMPoint(110, 280).matrixTransform(shape.getScreenCTM()!);
    // SVG children deliberately ignore pointer events. Resolve painted coverage
    // from the real geometry and SVG painter order instead of hit-testing UI.
    const paths = Array.from(shape.querySelectorAll<SVGGeometryElement>('[data-avatar-item] path, [data-avatar-item] rect, [data-avatar-item] circle')).reverse();
    return paths.find(element => getComputedStyle(element).fill !== 'none' && element.isPointInFill(point.matrixTransform(element.getScreenCTM()!.inverse())))?.closest('[data-avatar-item]')?.getAttribute('data-avatar-item');
  });
  expect(frontItem).toBe('bottom-pleated');
  await page.screenshot({ path: testInfo.outputPath('skirt-boots.png'), animations: 'disabled' });
  for (const category of AVATAR_CATEGORIES) {
    await page.getByRole('tab', { name: new RegExp(category.label) }).click();
    const clipped = await page.locator('.wardrobe-thumbnail').evaluateAll(thumbnails => thumbnails.flatMap(element => {
      const svg = element as SVGSVGElement;
      const box = svg.viewBox.baseVal;
      const artwork = svg.getBBox();
      return artwork.x < box.x || artwork.y < box.y || artwork.x + artwork.width > box.x + box.width || artwork.y + artwork.height > box.y + box.height ? [svg.parentElement?.getAttribute('aria-label')] : [];
    }));
    expect(clipped).toEqual([]);
  }
});

for (const [amount, drinking] of [[0, false], [40, false], [150, true], [350, true]] as const) {
  test(`mixed outfit keeps glass and cup at ${amount}mg dose, drinking ${drinking}`, async ({ page }, testInfo) => {
    await page.clock.install({ time: new Date('2026-10-14T11:00:00+09:00') });
    await page.clock.pauseAt(new Date('2026-10-14T12:00:00+09:00'));
    const state = createInitialState();
    state.entries = amount ? [{ id: 'sample', drinkId: 'coffee', drinkName: '테스트 커피', icon: 'coffee', caffeineMg: amount, consumedAt: drinking ? '2026-10-14T11:45:00+09:00' : '2026-10-14T09:00:00+09:00' }] : [];
    const outfit = { ...emptyOutfit(), hat: 'hat-beret', glasses: 'glasses-round', top: 'top-cardigan', bottom: 'bottom-pleated', shoes: 'shoes-mary-jane', accessory: 'accessory-backpack' };
    await page.addInitScript(({ state, outfit, avatarKey }) => {
      localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state));
      localStorage.setItem(avatarKey, JSON.stringify({ version: 1, outfit }));
    }, { state, outfit, avatarKey });
    await page.goto('/');
    await expect(page.locator('.liquid-avatar')).toHaveAttribute('data-drinking', String(drinking));
    await expect(page.locator('.avatar-sip-cup')).toHaveCount(drinking ? 1 : 0);
    await expect(page.locator('.avatar-outfit--back [data-avatar-item="accessory-backpack"] path').first()).toBeAttached();
    if (amount > 0) {
      await page.getByRole('button', { name: '캐릭터 액체 발광', exact: true }).click();
      await expect(page.locator('.avatar-tap-glow')).toHaveCount(1);
    }
    await page.screenshot({ path: testInfo.outputPath(`mixed-${amount}-${drinking}.png`), animations: 'disabled' });
    await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
}
