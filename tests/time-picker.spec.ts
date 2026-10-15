import { expect, test } from '@playwright/test';
import { pickTime } from './helpers/time-picker';
import { createInitialState } from '../src/features/caffeine/model/caffeine';

test('time selection stays in the same modal and commits only on done', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-04T10:00:00+09:00') });
  await page.addInitScript(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), createInitialState());
  await page.goto('/');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  await page.getByRole('button', { name: '천천히 마시기', exact: true }).click();
  await pickTime(page, '마시기 시작한 시각', '10:00');
  const originalDialog = await page.getByRole('dialog').elementHandle();
  await page.getByRole('button', { name: '마시기 시작한 시각', exact: true }).click();
  await expect(page.getByRole('heading', { name: '시작 시간 선택' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  expect(await originalDialog!.evaluate(element => element === document.querySelector('dialog'))).toBe(true);
  const hour = page.getByRole('spinbutton', { name: '시', exact: true });
  await hour.focus();
  await hour.press('Home');
  await hour.press('ArrowUp');
  await page.getByRole('button', { name: '취소', exact: true }).click();
  const start = page.getByRole('button', { name: '마시기 시작한 시각', exact: true });
  await expect(start).toContainText('오전 10:00');
  await expect(start).toBeFocused();
  await start.click();
  await hour.focus();
  await hour.press('Home');
  await hour.press('ArrowUp');
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(start).toContainText('오전 2:00');
  await expect(page.getByLabel('마시기 시작한 날짜', { exact: true })).toHaveValue('2026-10-04');
  await expect(page.locator('.quick-adjust-amount')).toHaveText('150mg');
});

async function openPicker(page: import('@playwright/test').Page, theme = '') {
  await page.clock.install({ time: new Date('2026-10-04T10:00:00+09:00') });
  await page.addInitScript(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), createInitialState());
  await page.goto(`/${theme}`);
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  await page.getByRole('button', { name: '천천히 마시기', exact: true }).click();
  await pickTime(page, '마시기 시작한 시각', '10:00');
  await page.getByRole('button', { name: '마시기 시작한 시각', exact: true }).click();
}

async function dragWheel(page: import('@playwright/test').Page, label: string, distance: number, duration: number, cancel = false) {
  await page.getByRole('spinbutton', { name: label, exact: true }).evaluate((element, gesture) => {
    const box = element.getBoundingClientRect();
    const startY = box.y + box.height * .6;
    const started = performance.now();
    for (let step = 0; step <= 6; step++) {
      const event = new PointerEvent(step === 0 ? 'pointerdown' : 'pointermove', {
        bubbles: true, pointerId: 7, pointerType: 'touch', isPrimary: true, button: 0,
        buttons: 1, clientX: box.x + box.width / 2, clientY: startY - gesture.distance * step / 6,
      });
      Object.defineProperty(event, 'timeStamp', { value: started + gesture.duration * step / 6 });
      element.dispatchEvent(event);
    }
    const release = new PointerEvent(gesture.cancel ? 'pointercancel' : 'pointerup', {
      bubbles: true, pointerId: 7, pointerType: 'touch', isPrimary: true, button: 0,
      clientX: box.x + box.width / 2, clientY: startY - gesture.distance,
    });
    Object.defineProperty(release, 'timeStamp', { value: started + gesture.duration });
    element.dispatchEvent(release);
  }, { distance, duration, cancel });
}

async function settledWheel(page: import('@playwright/test').Page, label: string) {
  const wheel = page.getByRole('spinbutton', { name: label, exact: true });
  await expect(wheel).not.toHaveAttribute('data-interacting', 'true');
  await expect.poll(() => wheel.evaluate((element, hour) => {
    const height = element.firstElementChild!.getBoundingClientRect().height;
    const selected = Number(element.getAttribute('aria-valuenow')) - (hour ? 1 : 0);
    return Math.abs(element.scrollTop / height - selected);
  }, label === '시')).toBeLessThan(.01);
  return Number(await wheel.getAttribute('aria-valuenow'));
}

test('a fast flick moves farther than the same slow drag and can be stopped by a tap', async ({ page }) => {
  await openPicker(page);
  const minute = page.getByRole('spinbutton', { name: '분', exact: true });
  await minute.focus();
  await minute.press('Home');
  await minute.press('PageUp');
  await minute.press('PageUp');
  await dragWheel(page, '분', 48, 480);
  const slow = await settledWheel(page, '분');
  expect(slow).toBe(21);
  await minute.press('Home');
  await minute.press('PageUp');
  await minute.press('PageUp');
  await dragWheel(page, '분', 48, 40);
  const fast = await settledWheel(page, '분');
  expect(fast).toBeGreaterThanOrEqual(slow + 3);
  expect(fast).toBeLessThanOrEqual(slow + 8);
  await dragWheel(page, '분', -48, 40);
  await minute.press('Home');
  await expect(minute).toHaveAttribute('aria-valuenow', '0');
  await page.waitForTimeout(400);
  expect(await settledWheel(page, '분')).toBe(0);
  await dragWheel(page, '분', 48, 40);
  await page.getByRole('button', { name: '02분 선택', exact: true }).click({ force: true });
  expect(await settledWheel(page, '분')).toBe(2);
  await page.waitForTimeout(400);
  expect(await settledWheel(page, '분')).toBe(2);
});

test('fast drags respect bounds, pointer cancellation, and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPicker(page);
  const minute = page.getByRole('spinbutton', { name: '분', exact: true });
  await minute.focus();
  await minute.press('Home');
  await dragWheel(page, '분', 48, 40, true);
  expect(await settledWheel(page, '분')).toBe(1);
  await dragWheel(page, '분', 48, 40);
  expect(await settledWheel(page, '분')).toBeGreaterThanOrEqual(5);
  await minute.press('End');
  await dragWheel(page, '분', 120, 40);
  expect(await settledWheel(page, '분')).toBe(59);
  await minute.press('Home');
  await dragWheel(page, '분', -120, 40);
  expect(await settledWheel(page, '분')).toBe(0);
});

for (const exit of ['back', 'escape', 'arrow']) {
  test(`${exit} cancels a pending time without clearing the drink`, async ({ page }) => {
    await openPicker(page);
    const minute = page.getByRole('spinbutton', { name: '분', exact: true });
    await minute.focus();
    await minute.press('End');
    if (exit === 'back') await page.goBack();
    else if (exit === 'escape') await page.keyboard.press('Escape');
    else await page.getByRole('button', { name: '기록 화면으로 돌아가기' }).click();
    await expect(page.getByRole('button', { name: '마시기 시작한 시각', exact: true })).toContainText('오전 10:00');
    await expect(page.getByRole('heading', { name: '아메리카노', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '음료 목록으로 돌아가기' }).click();
    await expect(page.getByRole('button', { name: /아메리카노\s*150\s*mg/ })).toHaveAttribute('aria-pressed', 'false');
  });
}

test('vertical touch swipe changes and snaps the minute wheel', async ({ page }) => {
  await openPicker(page);
  const wheel = page.getByRole('spinbutton', { name: '분', exact: true });
  const box = (await wheel.boundingBox())!;
  const session = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2;
  const y = box.y + box.height * .75;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 6; i++) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - i * 15 }] });
    await page.waitForTimeout(35);
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => Number(await wheel.getAttribute('aria-valuenow'))).toBeGreaterThan(0);
  await expect.poll(() => wheel.evaluate(element => {
    const rowHeight = element.firstElementChild!.getBoundingClientRect().height;
    return Math.abs(element.scrollTop / rowHeight - Math.round(element.scrollTop / rowHeight));
  })).toBeLessThan(.01);
  const minute = await wheel.getAttribute('aria-valuenow');
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(page.getByRole('button', { name: '마시기 시작한 시각', exact: true })).toContainText(`오전 10:${minute!.padStart(2, '0')}`);
  await session.detach();
});

test('native touch flicks accelerate hours and minutes while a held drag stays precise', async ({ page }) => {
  await openPicker(page);
  const session = await page.context().newCDPSession(page);
  async function swipe(label: string, delay: number, hold = 0) {
    const wheel = page.getByRole('spinbutton', { name: label, exact: true });
    const box = (await wheel.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height * .65;
    // Keep input speed independent of browser/CI scheduling while exercising
    // native hit testing, implicit capture, pointer events and generated clicks.
    const started = Date.now() / 1000;
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', timestamp: started, touchPoints: [{ x, y }] });
    for (let step = 1; step <= 2; step++) {
      await page.waitForTimeout(delay);
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', timestamp: started + delay * step / 1000, touchPoints: [{ x, y: y - step * 24 }] });
    }
    if (hold) await page.waitForTimeout(hold);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', timestamp: started + (delay * 2 + hold) / 1000, touchPoints: [] });
    return settledWheel(page, label);
  }
  const minute = page.getByRole('spinbutton', { name: '분', exact: true });
  await minute.focus();
  await minute.press('Home');
  await minute.press('PageUp');
  await minute.press('PageUp');
  expect(await swipe('분', 140)).toBe(21);
  await minute.press('Home');
  await minute.press('PageUp');
  await minute.press('PageUp');
  expect(await swipe('분', 8)).toBeGreaterThanOrEqual(24);
  await minute.press('Home');
  await minute.press('PageUp');
  await minute.press('PageUp');
  expect(await swipe('분', 8, 200)).toBe(21);
  const hour = page.getByRole('spinbutton', { name: '시', exact: true });
  await hour.focus();
  await hour.press('Home');
  for (let i = 0; i < 4; i++) await hour.press('ArrowUp');
  expect(await swipe('시', 140)).toBe(6);
  await hour.press('Home');
  for (let i = 0; i < 4; i++) await hour.press('ArrowUp');
  await swipe('시', 8);
  await expect.poll(async () => Number(await hour.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(8);
  await session.detach();
});

test('tapping numbers and keyboard boundaries convert noon and midnight correctly', async ({ page }) => {
  await openPicker(page);
  await page.getByRole('button', { name: '오후 선택', exact: true }).click();
  const hour = page.getByRole('spinbutton', { name: '시', exact: true });
  await hour.focus();
  await hour.press('End');
  const minute = page.getByRole('spinbutton', { name: '분', exact: true });
  await minute.focus();
  await minute.press('Home');
  await minute.press('ArrowDown');
  await expect(minute).toHaveAttribute('aria-valuenow', '0');
  await page.getByRole('button', { name: '완료', exact: true }).click();
  const start = page.getByRole('button', { name: '마시기 시작한 시각', exact: true });
  await expect(start).toContainText('오후 12:00');
  await start.click();
  await page.getByRole('button', { name: '오전 선택', exact: true }).click();
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(start).toContainText('오전 12:00');
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const entries = await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!).entries);
  expect(entries[0].startedAt).toBe('2026-10-03T15:00:00.000Z');
});

for (const theme of ['']) {
  test(`time wheel stays usable with enlarged text ${theme || 'dark'}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openPicker(page, theme);
    await page.screenshot({ path: `test-results/${testInfo.project.name}-time-picker-${theme ? 'light' : 'dark'}.png` });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    const minute = page.getByRole('spinbutton', { name: '분', exact: true });
    await minute.focus();
    await minute.press('End');
    await expect(minute).toHaveAttribute('aria-valuenow', '59');
    await expect.poll(() => minute.evaluate(element => {
      const height = element.firstElementChild!.getBoundingClientRect().height;
      return Math.abs(element.scrollTop / height - 59);
    })).toBeLessThan(.01);
    await page.getByRole('button', { name: '완료', exact: true }).scrollIntoViewIfNeeded();
    expect(await page.getByRole('dialog').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/${testInfo.project.name}-time-picker-zoom-${theme ? 'light' : 'dark'}.png` });
    await page.getByRole('button', { name: '완료', exact: true }).click();
    await expect(page.getByRole('button', { name: '마시기 시작한 시각', exact: true })).toContainText('오전 10:59');
  });
}

test('visible hour and minute numbers can be tapped without dragging', async ({ page }) => {
  await openPicker(page);
  await page.getByRole('button', { name: '10시 선택', exact: true }).click();
  await page.getByRole('button', { name: '31분 선택', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: '시', exact: true })).toHaveAttribute('aria-valuenow', '10');
  await expect(page.getByRole('spinbutton', { name: '분', exact: true })).toHaveAttribute('aria-valuenow', '31');
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(page.getByRole('button', { name: '마시기 시작한 시각', exact: true })).toContainText('오전 10:31');
});

test('a touch tap with slight finger movement still selects the intended number', async ({ page }) => {
  await openPicker(page);
  const option = page.getByRole('button', { name: '02분 선택', exact: true });
  const box = (await option.boundingBox())!;
  const session = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + 8 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.getByRole('spinbutton', { name: '분', exact: true })).toHaveAttribute('aria-valuenow', '2');
  await session.detach();
});

test('edit picker returns to its form before the root close button dismisses editing', async ({ page }) => {
  await openPicker(page);
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
  await page.getByRole('button', { name: '아메리카노 기록 수정' }).click();
  const dialog = await page.getByRole('dialog').elementHandle();
  await page.getByRole('button', { name: '마신 시각', exact: true }).click();
  expect(await dialog!.evaluate(element => element === document.querySelector('dialog'))).toBe(true);
  const hour = page.getByRole('spinbutton', { name: '시', exact: true });
  await hour.focus();
  await hour.press('Home');
  await page.goBack();
  await expect(page.getByRole('button', { name: '마신 시각', exact: true })).toContainText('오전 10:00');
  await page.getByRole('button', { name: '마신 시각', exact: true }).click();
  await expect(page.getByRole('button', { name: '닫기', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '기록 화면으로 돌아가기', exact: true }).click();
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page).toHaveURL(/\/history$/);
  await expect(page.getByRole('heading', { name: '한 잔의 기록', exact: true })).toBeVisible();
});
