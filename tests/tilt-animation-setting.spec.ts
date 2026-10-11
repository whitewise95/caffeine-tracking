import { expect, test, type Page } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';

async function prepare(page: Page, nativePermission = false) {
  await page.clock.setFixedTime(new Date('2026-10-06T12:00:00+09:00'));
  await page.addInitScript(({ state, nativePermission }) => {
    if (!localStorage.getItem('caffeine-tracker:state:v1')) localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state));
    Reflect.set(window, 'permissionRequests', 0);
    Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { configurable: true, value: nativePermission ? async () => {
      Reflect.set(window, 'permissionRequests', Reflect.get(window, 'permissionRequests') + 1);
      if (localStorage.getItem('test:native-sensor-grant') === 'granted') return 'granted';
      if (!navigator.userActivation.isActive) throw new DOMException('A tap is required', 'NotAllowedError');
      localStorage.setItem('test:native-sensor-grant', 'granted');
      return 'granted';
    } : undefined });
  }, { state: { ...createInitialState(), entries: [{ id: 'tilt', drinkId: 'coffee', drinkName: '커피', caffeineMg: 200, consumedAt: '2026-10-06T11:45:00+09:00', icon: 'coffee' }] }, nativePermission });
}
async function tilt(page: Page) {
  await page.evaluate(() => window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { beta: 45, gamma: 60 })));
}
async function angle(page: Page) {
  return page.locator('.body-liquid.avatar-gravity-frame').evaluate(element => {
    const matrix = (element as SVGGraphicsElement).getCTM()!;
    return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
  });
}
async function navigate(page: Page, name: string) {
  await page.getByRole('navigation').getByRole('button', { name, exact: true }).click();
}

test('settings toggle controls tilt, persists both choices and keeps Home clean', async ({ page }, info) => {
  await prepare(page);
  await page.goto('/');
  await expect(page.getByTestId('remaining-mg')).toBeVisible();
  await expect(page.getByRole('button', { name: '기울기 켜기', exact: true })).toHaveCount(0);
  await tilt(page);
  await page.waitForTimeout(150);
  expect(Math.abs(await angle(page))).toBeLessThan(4);
  await navigate(page, '설정');
  const toggle = page.getByRole('switch', { name: '애니메이션', exact: true });
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  expect((await toggle.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await toggle.press('Space');
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await page.screenshot({ path: info.outputPath('tilt-setting.png'), animations: 'disabled' });
  expect(await toggle.locator('.tilt-animation-thumb').evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m41)).toBe(20);
  await navigate(page, '홈');
  await tilt(page);
  await expect.poll(() => angle(page)).toBeLessThan(-35);
  await page.reload();
  await expect(page.getByTestId('remaining-mg')).toBeVisible();
  await tilt(page);
  await expect.poll(() => angle(page)).toBeLessThan(-35);
  await navigate(page, '설정');
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await toggle.tap();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await navigate(page, '홈');
  await tilt(page);
  await page.waitForTimeout(150);
  expect(Math.abs(await angle(page))).toBeLessThan(4);
  await page.reload();
  await navigate(page, '설정');
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await expect(toggle).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

async function enableNativeTilt(page: Page) {
  await prepare(page, true);
  await page.goto('/settings');
  const toggle = page.getByRole('switch', { name: '애니메이션', exact: true });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
}

test('native sensor reconnects after a full document reload with the saved toggle still on', async ({ page }) => {
  await enableNativeTilt(page);
  await navigate(page, '홈');
  await page.reload();
  await expect(page.getByTestId('remaining-mg')).toBeVisible();
  await expect.poll(() => page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(1);
  await expect(page.getByRole('button', { name: '기울기 센서 연결', exact: true })).toHaveCount(0);
  await tilt(page);
  await expect.poll(() => angle(page)).toBeLessThan(-35);
  await navigate(page, '설정');
  await expect(page.getByRole('switch', { name: '애니메이션', exact: true })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('button', { name: '센서 권한 허용', exact: true })).toHaveCount(0);
});

test('character tap restores needed sensor permission and keeps its glow effect', async ({ page }) => {
  await enableNativeTilt(page);
  await navigate(page, '홈');
  await page.evaluate(() => localStorage.removeItem('test:native-sensor-grant'));
  await page.reload();
  await expect(page.getByTestId('remaining-mg')).toBeVisible();
  await expect.poll(() => page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(1);
  const character = page.getByRole('button', { name: '캐릭터 액체 발광', exact: true });
  await character.tap();
  await expect(page.locator('.avatar-tap-glow')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(2);
  await expect(page).toHaveURL(/\/$/);
  await tilt(page);
  await expect.poll(() => angle(page)).toBeLessThan(-35);
  await character.tap();
  await expect(page.locator('.avatar-tap-glow')).toHaveCount(1);
  expect(await page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(2);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!).settings.tiltAnimation)).toBe(true);
});

test('empty character can request permission, avoids duplicate prompts and can retry denial', async ({ page }) => {
  await enableNativeTilt(page);
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!);
    state.entries = [];
    localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state));
  });
  await navigate(page, '홈');
  await page.addInitScript(() => {
    Reflect.set(window, 'permissionRequests', 0);
    Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { configurable: true, value: () => {
      const requests = Reflect.get(window, 'permissionRequests') + 1;
      Reflect.set(window, 'permissionRequests', requests);
      if (requests === 1) return Promise.reject(new DOMException('A tap is required', 'NotAllowedError'));
      if (requests === 2) return new Promise(resolve => Reflect.set(window, 'finishNativePermission', () => resolve('denied')));
      return Promise.resolve('granted');
    } });
  });
  await page.reload();
  await expect(page.getByTestId('remaining-mg')).toHaveText('0');
  await expect.poll(() => page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(1);
  const character = page.getByRole('button', { name: '캐릭터 액체 발광', exact: true });
  await character.tap();
  await expect.poll(() => page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(2);
  await character.tap();
  expect(await page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(2);
  await expect(page.locator('.avatar-tap-glow')).toHaveCount(0);
  await page.evaluate(() => Reflect.get(window, 'finishNativePermission')());
  await navigate(page, '설정');
  await expect(page.getByRole('button', { name: '센서 권한 허용', exact: true })).toBeVisible();
  await expect(page.getByRole('switch', { name: '애니메이션', exact: true })).toHaveAttribute('aria-checked', 'true');
  await navigate(page, '홈');
  await character.tap();
  await expect.poll(() => page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(3);
  await character.tap();
  expect(await page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(3);
});

test('character taps leave sensor permission untouched when animation is OFF', async ({ page }) => {
  await prepare(page, true);
  await page.goto('/');
  await expect(page.getByTestId('remaining-mg')).toBeVisible();
  await page.getByRole('button', { name: '캐릭터 액체 발광', exact: true }).tap();
  await expect(page.locator('.avatar-tap-glow')).toHaveCount(1);
  expect(await page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(0);
});

test('tab navigation requests sensor permission before leaving Home and waits for the response', async ({ page }) => {
  await enableNativeTilt(page);
  await navigate(page, '홈');
  await page.addInitScript(() => {
    Reflect.set(window, 'permissionRequests', 0);
    Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { configurable: true, value: () => {
      const requests = Reflect.get(window, 'permissionRequests') + 1;
      Reflect.set(window, 'permissionRequests', requests);
      if (requests === 1) return Promise.reject(new DOMException('A tap is required', 'NotAllowedError'));
      Reflect.set(window, 'permissionRequestPath', location.pathname);
      Reflect.set(window, 'permissionRequestActivated', navigator.userActivation.isActive);
      return new Promise(resolve => Reflect.set(window, 'finishNativePermission', () => resolve('granted')));
    } });
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(1);
  await expect(page.getByRole('button', { name: '기울기 센서 연결', exact: true })).toHaveCount(0);
  await navigate(page, '설정');
  await expect.poll(() => page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(2);
  expect(await page.evaluate(() => Reflect.get(window, 'permissionRequestPath'))).toBe('/');
  expect(await page.evaluate(() => Reflect.get(window, 'permissionRequestActivated'))).toBe(true);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('remaining-mg')).toBeVisible();
  await expect(page.getByRole('heading', { name: '설정', exact: true })).toHaveCount(0);
  await expect(page.getByRole('navigation').getByRole('button', { name: '리포트', exact: true })).toBeDisabled();
  await page.evaluate(() => Reflect.get(window, 'finishNativePermission')());
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole('heading', { name: '설정', exact: true })).toBeVisible();
  await expect(page.getByRole('switch', { name: '애니메이션', exact: true })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('button', { name: '센서 권한 허용', exact: true })).toHaveCount(0);
  await navigate(page, '홈');
  expect(await page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(2);
  await tilt(page);
  await expect.poll(() => angle(page)).toBeLessThan(-35);
});

test('cancelled tab permission still navigates, preserves ON and does not repeat prompts', async ({ page }) => {
  await enableNativeTilt(page);
  await navigate(page, '홈');
  await page.addInitScript(() => {
    Reflect.set(window, 'permissionRequests', 0);
    Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { configurable: true, value: () => {
      const requests = Reflect.get(window, 'permissionRequests') + 1;
      Reflect.set(window, 'permissionRequests', requests);
      if (requests === 1) return Promise.reject(new DOMException('A tap is required', 'NotAllowedError'));
      return new Promise(resolve => Reflect.set(window, 'finishNativePermission', () => resolve('denied')));
    } });
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(1);
  await navigate(page, '기록');
  await expect.poll(() => page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(2);
  await expect(page).toHaveURL(/\/$/);
  await page.evaluate(() => Reflect.get(window, 'finishNativePermission')());
  await expect(page).toHaveURL(/\/history$/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!).settings.tiltAnimation)).toBe(true);
  await navigate(page, '설정');
  await expect(page.getByRole('button', { name: '센서 권한 허용', exact: true })).toBeVisible();
  expect(await page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(2);
});

test('reduced motion prevents sensor requests at startup and during tab navigation', async ({ page }) => {
  await enableNativeTilt(page);
  await navigate(page, '홈');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => localStorage.removeItem('test:native-sensor-grant'));
  await page.reload();
  await expect(page.getByTestId('remaining-mg')).toBeVisible();
  expect(await page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(0);
  await page.getByRole('button', { name: '캐릭터 액체 발광', exact: true }).tap();
  expect(await page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(0);
  await expect(page.getByRole('button', { name: '기울기 센서 연결', exact: true })).toHaveCount(0);
  await navigate(page, '설정');
  await expect(page.getByRole('switch', { name: '애니메이션', exact: true })).toHaveAttribute('aria-checked', 'true');
  expect(await page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(0);
});

test('foreground recovery retries once, while explicit denial is not requested again', async ({ page }) => {
  await enableNativeTilt(page);
  await page.addInitScript(() => {
    Reflect.set(window, 'permissionRequests', 0);
    Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { configurable: true, value: async () => {
      const requests = Reflect.get(window, 'permissionRequests') + 1;
      Reflect.set(window, 'permissionRequests', requests);
      if (requests === 1) throw new DOMException('Not available yet', 'NotAllowedError');
      return 'denied';
    } });
  });
  await page.reload();
  await expect(page.getByRole('button', { name: '센서 권한 허용', exact: true })).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(1);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(2);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  expect(await page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(2);
  await expect(page.getByRole('switch', { name: '애니메이션', exact: true })).toHaveAttribute('aria-checked', 'true');
});

test('a fresh native permission requirement keeps the saved preference on and can be resolved separately', async ({ page }) => {
  await enableNativeTilt(page);
  await page.evaluate(() => localStorage.removeItem('test:native-sensor-grant'));
  await page.reload();
  const toggle = page.getByRole('switch', { name: '애니메이션', exact: true });
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  const permission = page.getByRole('button', { name: '센서 권한 허용', exact: true });
  await expect(permission).toBeVisible();
  expect((await permission.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await permission.click();
  await expect(permission).toHaveCount(0);
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await navigate(page, '홈');
  await tilt(page);
  await expect.poll(() => angle(page)).toBeLessThan(-35);
  await page.evaluate(() => localStorage.removeItem('test:native-sensor-grant'));
  await page.reload();
  await expect(page.getByTestId('remaining-mg')).toBeVisible();
  await page.evaluate(() => {
    history.pushState({ page: 'settings', overlay: null, depth: 1 }, '', '/settings');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect(permission).toBeVisible();
  await page.evaluate(() => localStorage.removeItem('test:native-sensor-grant'));
  await page.reload();
  await expect(permission).toBeVisible();
  // Turning a saved preference OFF must not require granting sensor access.
  const requests = await page.evaluate(() => Reflect.get(window, 'permissionRequests'));
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  expect(await page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(requests);
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  expect(await page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(0);
  await navigate(page, '리포트');
  await expect(page.getByRole('heading', { name: '카페인 리포트', exact: true })).toBeVisible();
  expect(await page.evaluate(() => Reflect.get(window, 'permissionRequests'))).toBe(0);
});

test('unavailable sensor disables the toggle and failed saves retain the previous choice', async ({ page }) => {
  await prepare(page);
  await page.goto('/settings');
  const toggle = page.getByRole('switch', { name: '애니메이션', exact: true });
  await expect(toggle).toBeVisible();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'caffeine-tracker:state:v1') throw new Error('저장 실패');
      original.call(this, key, value);
    };
  });
  await toggle.click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await page.addInitScript(() => Object.defineProperty(window, 'DeviceOrientationEvent', { configurable: true, value: undefined }));
  await page.reload();
  await expect(toggle).toBeDisabled();
  await expect(page.getByRole('status')).toContainText('이 환경에서는 기울기 센서를 사용할 수 없어요');
});

test('native restoration denial never erases the saved opt-in, and OFF needs no permission', async ({ page }) => {
  await enableNativeTilt(page);
  await page.addInitScript(() => {
    Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { configurable: true, value: async () => 'denied' });
  });
  await page.reload();
  const toggle = page.getByRole('switch', { name: '애니메이션', exact: true });
  const permission = page.getByRole('button', { name: '센서 권한 허용', exact: true });
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await permission.click();
  await expect(permission).toBeEnabled();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!).settings.tiltAnimation)).toBe(true);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
});

test('a saved ON choice can be switched OFF while native recovery is pending', async ({ page }) => {
  await enableNativeTilt(page);
  await page.addInitScript(() => {
    Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { configurable: true, value: () => new Promise(resolve => {
      Reflect.set(window, 'finishNativePermission', () => resolve('granted'));
    }) });
  });
  await page.reload();
  const toggle = page.getByRole('switch', { name: '애니메이션', exact: true });
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect(toggle).toHaveAttribute('aria-busy', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await page.evaluate(() => Reflect.get(window, 'finishNativePermission')());
  await expect(toggle).toHaveAttribute('aria-busy', 'false');
  await navigate(page, '홈');
  await tilt(page);
  await page.waitForTimeout(150);
  expect(Math.abs(await angle(page))).toBeLessThan(4);
  await navigate(page, '설정');
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await expect(toggle).toHaveAttribute('aria-busy', 'false');
});
