import { expect, test } from '@playwright/test';
import { createInitialState, remainingCaffeine } from '../src/features/caffeine/model/caffeine';

test('each character tap immediately lights the liquid without restarting absorption glow or changing records', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2026-10-06T11:00:00+09:00') });
  await page.clock.pauseAt(new Date('2026-10-06T12:00:00+09:00'));
  await page.addInitScript(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), {
    ...createInitialState(),
    entries: [{ id: 'recent', drinkId: 'coffee', drinkName: '커피', icon: 'coffee', caffeineMg: 200, consumedAt: '2026-10-06T11:45:00+09:00' }],
  });
  await page.goto('/');
  const character = page.getByRole('button', { name: '캐릭터 액체 발광', exact: true });
  const manual = page.locator('.avatar-tap-glow');
  const automatic = page.locator('.avatar-absorption-glow');
  const remaining = await page.getByTestId('remaining-mg').textContent();
  const saved = await page.evaluate(() => localStorage.getItem('caffeine-tracker:state:v1'));
  await automatic.evaluate(element => element.getAnimations().forEach(animation => { animation.pause(); animation.currentTime = 4500; }));
  await expect(automatic).toHaveCSS('opacity', '0.85');
  await character.click();
  await expect(manual).toHaveCount(1);
  // Advance the first response to its faded tail, then tap again immediately.
  await manual.evaluate(element => element.getAnimations().forEach(animation => { animation.pause(); animation.currentTime = 700; }));
  expect(await manual.evaluate(element => Number(getComputedStyle(element).opacity))).toBeLessThan(.2);
  await manual.evaluate(element => Reflect.set(window, 'previousTapLayer', element));
  await character.click();
  // CSS animation time is independent of page.clock. Verify the layer restarted,
  // then sample its first frame deterministically even on a busy browser worker.
  expect(await manual.evaluate(element => element !== Reflect.get(window, 'previousTapLayer'))).toBe(true);
  await manual.evaluate(element => element.getAnimations().forEach(animation => { animation.pause(); animation.currentTime = 0; }));
  expect(await manual.evaluate(element => Number(getComputedStyle(element).opacity))).toBeGreaterThan(.7);
  await expect(automatic).toHaveCSS('opacity', '0.85');
  await expect(page.getByTestId('remaining-mg')).toHaveText(remaining!);
  expect(await page.evaluate(() => localStorage.getItem('caffeine-tracker:state:v1'))).toBe(saved);
  await page.screenshot({ path: testInfo.outputPath('character-tap-glow.png') });
  await page.clock.fastForward(1000);
  await expect(manual).toHaveCount(0);
  await expect(automatic).toHaveCSS('opacity', '0.85');
});

test('character glow supports keyboard and reduced motion after absorption, and keeps empty liquid empty', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-06T12:00:00+09:00') });
  await page.addInitScript(state => {
    if (!localStorage.getItem('caffeine-tracker:state:v1')) localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state));
  }, {
    ...createInitialState(),
    entries: [{ id: 'old', drinkId: 'coffee', drinkName: '커피', icon: 'coffee', caffeineMg: 150, consumedAt: '2026-10-06T09:00:00+09:00' }],
  });
  await page.goto('/');
  const character = page.getByRole('button', { name: '캐릭터 액체 발광', exact: true });
  const manual = page.locator('.avatar-tap-glow');
  await expect(page.locator('.avatar-absorption-glow')).toHaveCount(0);
  await character.focus();
  await page.keyboard.press('Enter');
  await expect(manual).toHaveCount(1);
  await page.clock.fastForward(1000);
  await expect(manual).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.keyboard.press('Space');
  await expect(manual).toHaveCSS('animation-name', 'none');
  expect(await manual.evaluate(element => Number(getComputedStyle(element).opacity))).toBeGreaterThan(0);
  await page.clock.fastForward(1000);
  await expect(manual).toHaveCount(0);
  await page.evaluate(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), createInitialState());
  await page.reload();
  await character.click();
  await expect(manual).toHaveCount(0);
  await expect(page.getByTestId('remaining-mg')).toHaveText('0');
});

for (const theme of ['dark']) {
  test(`avatar material and silhouette states in ${theme}`, async ({ page }, testInfo) => {
    await page.clock.install({ time: new Date('2026-10-06T12:00:00+09:00') });
    for (const [amount, stateName] of [[0, 'empty'], [120, 'active'], [220, 'full'], [330, 'high']] as const) {
      const state = createInitialState();
      const sample = { id: 'preview', drinkId: 'coffee', drinkName: '커피', caffeineMg: 1, consumedAt: '2026-10-06T11:00:00+09:00', icon: 'coffee' as const };
      const factor = remainingCaffeine([sample], new Date('2026-10-06T12:00:00+09:00'));
      state.entries = amount ? [{ ...sample, caffeineMg: amount / factor }] : [];
      await page.goto(`/?theme=${theme}`);
      await page.evaluate(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), state);
      await page.reload();
      await expect(page.getByTestId('remaining-mg')).toHaveText(String(amount));
      await expect(page.locator('.liquid-avatar')).toHaveAttribute('data-state', stateName);
      await expect(page.getByRole('img', { name: new RegExp(`추정 잔존 카페인 ${amount}mg`) })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`avatar-${theme}-${amount}.png`), animations: 'disabled' });
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('.avatar-tension')).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.avatar-idle')).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.avatar-wave-front')).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.avatar-current')).toHaveCount(0);
    await expect(page.locator('.avatar-speck').first()).toHaveCSS('animation-name', 'none');
  });
}

test('recording gives one orb response without faking immediate absorption or replaying on reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.liquid-avatar')).toHaveAttribute('data-adding', 'false');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await expect(page.locator('.avatar-wave-front')).toHaveCSS('animation-play-state', 'paused');
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.liquid-avatar')).toHaveAttribute('data-adding', 'true');
  await expect(page.locator('.liquid-avatar')).toHaveAttribute('data-absorbing-count', '1');
  await expect(page.locator('.avatar-sip-cup')).toHaveCSS('animation-name', 'none');
  await expect(page.getByTestId('remaining-mg')).toHaveText('0');
  await expect(page.locator('.liquid-avatar')).toHaveAttribute('data-adding', 'false');
  await page.reload();
  await expect(page.locator('.liquid-avatar')).toHaveAttribute('data-adding', 'false');
  await expect(page.locator('.liquid-avatar')).toHaveAttribute('data-drinking', 'true');
});

for (const theme of ['dark']) {
  test(`absorption pose stays still while liquid glows only during absorption in ${theme}`, async ({ page }, testInfo) => {
    await page.clock.install({ time: new Date('2026-10-06T12:00:00+09:00') });
    const sample = { drinkId: 'coffee', drinkName: '커피', icon: 'coffee' as const };
    await page.addInitScript(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), {
      ...createInitialState(),
      settings: { halfLifeHours: 4.5, theme },
      entries: [
        { ...sample, id: 'old', caffeineMg: 150, consumedAt: '2026-10-06T09:00:00+09:00' },
        { ...sample, id: 'first', caffeineMg: 150, consumedAt: '2026-10-06T11:00:00+09:00' },
        { ...sample, id: 'second', caffeineMg: 100, consumedAt: '2026-10-06T11:30:00+09:00' },
        { ...sample, id: 'third', caffeineMg: 200, consumedAt: '2026-10-06T12:00:00+09:00' },
        { ...sample, id: 'future', caffeineMg: 150, consumedAt: '2026-10-07T12:00:00+09:00' },
      ],
    });
    await page.goto('/');
    const avatar = page.locator('.liquid-avatar');
    const cup = page.locator('.avatar-sip-cup');
    const glow = page.locator('.avatar-absorption-glow');
    await expect(avatar).toHaveAttribute('data-absorbing-count', '3');
    await expect(page.locator('.avatar-stacked-cup')).toHaveCount(0);
    await expect(cup).toHaveCount(1);
    await expect(page.locator('.avatar-current')).toHaveCount(0);
    await expect(page.locator('.avatar-sip-arm')).toHaveCount(1);
    await expect(cup).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.avatar-drinking-body')).toHaveCSS('animation-name', 'none');
    await expect(glow).toHaveCSS('animation-duration', '6s');
    await expect(glow).toHaveCSS('animation-iteration-count', 'infinite');
    await expect(page.getByRole('img', { name: /흡수 중인 음료 3잔/ })).toBeVisible();
    const remaining = await page.getByTestId('remaining-mg').textContent();
    for (const [phase, time] of [['quiet', 0], ['glow', 4500]] as const) {
      await avatar.evaluate((element, time) => element.getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = time; }), time);
      await expect(glow).toHaveCSS('opacity', phase === 'quiet' ? '0' : '0.85');
      await expect(page.getByTestId('remaining-mg')).toHaveText(remaining!);
      await page.screenshot({ path: testInfo.outputPath(`absorption-pose-${theme}-${phase}.png`) });
    }
    await avatar.evaluate(element => element.getAnimations({ subtree: true }).forEach(animation => animation.play()));
    await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
    await expect(glow).toHaveCSS('animation-play-state', 'paused');
    await page.getByRole('button', { name: '닫기', exact: true }).click();
    await expect(glow).toHaveCSS('animation-play-state', 'running');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(glow).toHaveCSS('animation-play-state', 'paused');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(glow).toHaveCSS('animation-play-state', 'running');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(glow).toHaveCSS('animation-name', 'none');
    await expect(glow).toHaveCSS('opacity', '0');
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.clock.fastForward(20 * 60_000);
    await expect(avatar).toHaveAttribute('data-absorbing-count', '2');
    await expect(cup).toHaveCount(1);
    await page.clock.fastForward(20 * 60_000);
    await expect(avatar).toHaveAttribute('data-absorbing-count', '1');
    await expect(page.locator('.avatar-stacked-cup')).toHaveCount(0);
    await page.reload();
    await expect(avatar).toHaveAttribute('data-drinking', 'true');
    await page.clock.fastForward(40 * 60_000);
    await expect(avatar).toHaveAttribute('data-absorbing-count', '0');
    await expect(avatar).toHaveAttribute('data-drinking', 'false');
    await expect(cup).toHaveCount(0);
    await expect(page.locator('.avatar-drinking-body')).toHaveCount(0);
    await expect(glow).toHaveCount(0);
    await expect(page.locator('.avatar-core')).toHaveCSS('animation-name', 'none');
  });
}

test('drinking arm tint follows the liquid height instead of absorption alone', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2026-10-06T11:00:00+09:00') });
  await page.clock.pauseAt(new Date('2026-10-06T12:00:00+09:00'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const sample = { id: 'preview', drinkId: 'coffee', drinkName: '커피', caffeineMg: 1, consumedAt: '2026-10-06T11:45:00+09:00', icon: 'coffee' as const };
  const factor = remainingCaffeine([sample], new Date('2026-10-06T12:00:00+09:00'));
  await page.goto('/');
  for (const amount of [10, 150, 330]) {
    await page.evaluate(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), {
      ...createInitialState(), entries: [{ ...sample, caffeineMg: amount / factor }],
    });
    await page.reload();
    await expect(page.getByTestId('remaining-mg')).toHaveText(String(amount));
    await expect(page.locator('.liquid-avatar')).toHaveAttribute('data-drinking', 'true');
    await page.getByRole('button', { name: '캐릭터 액체 발광', exact: true }).click();
    // Sample the rendered upper/lower forearm rim, away from the cup and hand grip.
    const points = await page.locator('.avatar-sip-arm').evaluate(element => {
      const matrix = (element as SVGGraphicsElement).getScreenCTM()!;
      return [[246, 151], [254, 194]].map(([x, y]) => {
        const point = new DOMPoint(x, y).matrixTransform(matrix);
        return { x: point.x, y: point.y };
      });
    });
    const screenshot = await page.screenshot();
    const [upperTint, lowerTint] = await page.evaluate(async ({ data, points }) => {
      const image = new Image();
      image.src = data;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);
      return points.map(({ x, y }) => {
        const pixels = context.getImageData(Math.round(x) - 3, Math.round(y) - 3, 7, 7).data;
        let pink = 0;
        for (let i = 0; i < pixels.length; i += 4) pink = Math.max(pink, pixels[i] - pixels[i + 1]);
        return pink;
      });
    }, { data: `data:image/png;base64,${screenshot.toString('base64')}`, points });
    console.log(`${amount}mg arm tint: upper=${upperTint}, lower=${lowerTint}`);
    if (amount === 10) expect(Math.max(upperTint, lowerTint)).toBeLessThan(45);
    else if (amount === 150) expect(lowerTint).toBeGreaterThan(upperTint + 15);
    else expect(Math.min(upperTint, lowerTint)).toBeGreaterThan(55);
    await page.locator('.liquid-avatar').screenshot({ path: testInfo.outputPath(`drinking-arm-${amount}.png`) });
  }
});
