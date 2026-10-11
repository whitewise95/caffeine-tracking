import { expect, test, type Page } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';

async function prepare(page: Page, tiltAnimation = true) {
  await page.clock.setFixedTime(new Date('2026-10-06T12:00:00+09:00'));
  // Exercise the automatic branch independently of the test browser's API version.
  await page.addInitScript(() => Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { configurable: true, value: undefined }));
  await page.addInitScript(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), {
    ...createInitialState(), settings: { ...createInitialState().settings, tiltAnimation }, entries: [{ id: 'tilt', drinkId: 'coffee', drinkName: '커피', caffeineMg: 200, consumedAt: '2026-10-06T11:45:00+09:00', icon: 'coffee' }],
  });
}
async function tilt(page: Page, gamma: number, beta = 45) {
  await page.evaluate(({ beta, gamma }) => window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { beta, gamma })), { beta, gamma });
}
async function surfaceAngle(page: Page) {
  return page.locator('.body-liquid.avatar-gravity-frame').evaluate(element => {
    const matrix = (element as SVGGraphicsElement).getCTM()!;
    return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
  });
}

test('ambient sea-like waves roll with tilt off and pause for sheets and reduced motion', async ({ page }, info) => {
  await prepare(page, false);
  await page.goto('/');
  await expect(page.getByTestId('remaining-mg')).toBeVisible();
  const amount = await page.getByTestId('remaining-mg').textContent();
  const surface = page.locator('.avatar-surface-definition');
  const shape = await surface.getAttribute('d');
  const range = await surface.evaluate(element => {
    const path = element as SVGPathElement;
    const length = path.getTotalLength();
    const heights: number[] = [];
    for (let distance = 0; distance < length; distance += 4) {
      const point = path.getPointAtLength(distance);
      if (point.x >= 80 && point.x <= 240) heights.push(point.y);
    }
    return Math.max(...heights) - Math.min(...heights);
  });
  expect(range).toBeGreaterThan(7);
  expect(range).toBeLessThan(16);
  await expect.poll(() => surface.getAttribute('d')).not.toBe(shape);
  await page.locator('.liquid-avatar').screenshot({ path: info.outputPath('ambient-waves.png') });
  const frames = await page.locator('.avatar-gravity-frame').evaluateAll(elements => elements.map(element => element.getAttribute('transform')));
  expect(new Set(frames).size).toBe(1);
  await expect(page.getByTestId('remaining-mg')).toHaveText(amount!);
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  const paused = await surface.getAttribute('d');
  await page.waitForTimeout(200);
  await expect(surface).toHaveAttribute('d', paused!);
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await expect.poll(() => surface.getAttribute('d')).not.toBe(paused);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(surface).toHaveAttribute('d', /^M-480 0\.00 C-473\.3 0\.00 /);
  const staticShape = await surface.getAttribute('d');
  await page.waitForTimeout(200);
  await expect(surface).toHaveAttribute('d', staticShape!);
});

test('gravity tips one shared liquid surface, settles, and leaves caffeine unchanged', async ({ page }, info) => {
  await prepare(page);
  await page.goto('/');
  await expect(page.getByTestId('remaining-mg')).toBeVisible();
  const amount = await page.getByTestId('remaining-mg').textContent();
  await tilt(page, 60);
  await expect.poll(() => surfaceAngle(page)).toBeLessThan(-35);
  await expect.poll(async () => Math.abs((await surfaceAngle(page)) + 40.89)).toBeLessThan(2);
  await expect(page.getByTestId('remaining-mg')).toHaveText(amount!);
  const frames = await page.locator('.avatar-gravity-frame').evaluateAll(elements => elements.map(element => element.getAttribute('transform')));
  expect(new Set(frames).size).toBe(1);
  await page.locator('.liquid-avatar').screenshot({ path: info.outputPath('liquid-right.png') });
  await tilt(page, -60);
  await expect.poll(async () => Math.abs((await surfaceAngle(page)) - 40.89)).toBeLessThan(2);
  await page.locator('.liquid-avatar').screenshot({ path: info.outputPath('liquid-left.png') });
  await tilt(page, 0, 0);
  expect(await surfaceAngle(page)).toBeGreaterThan(35);
  await page.evaluate(() => {
    Object.defineProperty(screen.orientation, 'angle', { configurable: true, value: 90 });
    screen.orientation.dispatchEvent(new Event('change'));
  });
  // A flat sample has no gravity direction; send the same physical tilt again.
  await tilt(page, -60);
  await expect.poll(async () => Math.abs((await surfaceAngle(page)) + 49.11)).toBeLessThan(2);
  await page.evaluate(() => {
    Object.defineProperty(screen.orientation, 'angle', { configurable: true, value: 0 });
    screen.orientation.dispatchEvent(new Event('change'));
  });
  await tilt(page, 0, -90);
  await expect.poll(async () => Math.abs(Math.abs(await surfaceAngle(page)) - 180)).toBeLessThan(2);
  await expect(page.getByTestId('remaining-mg')).toHaveText(amount!);
  await page.locator('.liquid-avatar').screenshot({ path: info.outputPath('liquid-inverted.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('ending absorption preserves liquid orientation while the arm changes pose', async ({ page }) => {
  await prepare(page);
  await page.goto('/');
  await expect(page.locator('.liquid-avatar')).toHaveAttribute('data-drinking', 'true');
  await tilt(page, 0, -90);
  await expect.poll(async () => Math.abs(Math.abs(await surfaceAngle(page)) - 180)).toBeLessThan(2);
  await page.evaluate(() => {
    const frame = document.querySelector('.body-liquid.avatar-gravity-frame')!;
    const angles: number[] = [];
    Reflect.set(window, 'testPoseAngles', angles);
    const observer = new MutationObserver(() => {
      const matrix = (frame as SVGGraphicsElement).getCTM()!;
      angles.push(Math.atan2(matrix.b, matrix.a) * 180 / Math.PI);
    });
    observer.observe(frame, { attributes: true, attributeFilter: ['transform'] });
  });
  await page.clock.setFixedTime(new Date('2026-10-06T13:45:00+09:00'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('.liquid-avatar')).toHaveAttribute('data-drinking', 'false');
  await page.waitForTimeout(200);
  const angles = await page.evaluate(() => Reflect.get(window, 'testPoseAngles') as number[]);
  expect(angles.length).toBeGreaterThan(0);
  expect(Math.min(...angles.map(Math.abs))).toBeGreaterThan(160);
});

test('motion pauses behind a sheet and reduced motion disables sensor movement', async ({ page }) => {
  await prepare(page);
  await page.goto('/');
  await tilt(page, 60);
  await expect.poll(() => surfaceAngle(page)).toBeLessThan(-35);
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  const before = await page.locator('.avatar-gravity-frame').first().getAttribute('transform');
  await tilt(page, -60);
  await page.waitForTimeout(150);
  await expect(page.locator('.avatar-gravity-frame').first()).toHaveAttribute('transform', before!);
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await expect.poll(() => surfaceAngle(page)).toBeGreaterThan(35);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(async () => Math.abs(await surfaceAngle(page))).toBeLessThan(4);
  await tilt(page, 60);
  await page.waitForTimeout(150);
  expect(Math.abs(await surfaceAngle(page))).toBeLessThan(4);
});

test('sensor permission is requested by a tap, denial keeps the app usable, and retry enables tilt', async ({ page }) => {
  await prepare(page, false);
  await page.addInitScript(() => {
    let attempts = 0;
    Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { value: async () => ++attempts === 1 ? 'denied' : 'granted' });
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: '기울기 켜기', exact: true })).toHaveCount(0);
  await tilt(page, 60);
  expect(Math.abs(await surfaceAngle(page))).toBeLessThan(4);
  await page.getByRole('navigation').getByRole('button', { name: '설정', exact: true }).click();
  const toggle = page.getByRole('switch', { name: '애니메이션', exact: true });
  await toggle.click();
  await expect(page.getByRole('status')).toContainText('센서 권한이 허용되지 않았어요');
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('navigation').getByRole('button', { name: '홈', exact: true }).click();
  await tilt(page, 60);
  await expect.poll(() => surfaceAngle(page)).toBeLessThan(-35);
  await expect(page.getByRole('button', { name: '카페인 추가', exact: true })).toBeVisible();
  await page.getByRole('navigation').getByRole('button', { name: '리포트', exact: true }).click();
  await page.getByRole('navigation').getByRole('button', { name: '홈', exact: true }).click();
  await expect(page.getByRole('button', { name: '기울기 켜기', exact: true })).toHaveCount(0);
  await tilt(page, -60);
  await expect.poll(() => surfaceAngle(page)).toBeGreaterThan(35);
});
