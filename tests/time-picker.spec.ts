import { expect, test } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';

test('time selection stays in the same modal and commits only on done', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-04T10:00:00+09:00') });
  await page.addInitScript(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), createInitialState());
  await page.goto('/');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  await page.getByRole('switch', { name: '천천히 마셨어요' }).check();
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
  await expect(start).toHaveText('오전 9:30');
  await expect(start).toBeFocused();
  await start.click();
  await hour.focus();
  await hour.press('Home');
  await hour.press('ArrowUp');
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(start).toHaveText('오전 2:30');
  await expect(page.getByLabel('마시기 시작한 날짜', { exact: true })).toHaveValue('2026-10-04');
  await expect(page.locator('.quick-adjust-amount')).toHaveText('150mg');
});

async function openPicker(page: import('@playwright/test').Page, theme = '') {
  await page.clock.install({ time: new Date('2026-10-04T10:00:00+09:00') });
  await page.addInitScript(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), createInitialState());
  await page.goto(`/${theme}`);
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  await page.getByRole('switch', { name: '천천히 마셨어요' }).check();
  await page.getByRole('button', { name: '마시기 시작한 시각', exact: true }).click();
}

for (const exit of ['back', 'escape', 'arrow']) {
  test(`${exit} cancels a pending time without clearing the drink`, async ({ page }) => {
    await openPicker(page);
    const minute = page.getByRole('spinbutton', { name: '분', exact: true });
    await minute.focus();
    await minute.press('End');
    if (exit === 'back') await page.goBack();
    else if (exit === 'escape') await page.keyboard.press('Escape');
    else await page.getByRole('button', { name: '기록 화면으로 돌아가기' }).click();
    await expect(page.getByRole('button', { name: '마시기 시작한 시각', exact: true })).toHaveText('오전 9:30');
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
  await expect.poll(async () => Number(await wheel.getAttribute('aria-valuenow'))).toBeGreaterThan(30);
  await expect.poll(() => wheel.evaluate(element => {
    const rowHeight = element.firstElementChild!.getBoundingClientRect().height;
    return Math.abs(element.scrollTop / rowHeight - Math.round(element.scrollTop / rowHeight));
  })).toBeLessThan(.01);
  const minute = await wheel.getAttribute('aria-valuenow');
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(page.getByRole('button', { name: '마시기 시작한 시각', exact: true })).toHaveText(`오전 9:${minute}`);
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
  await expect(start).toHaveText('오후 12:00');
  await start.click();
  await page.getByRole('button', { name: '오전 선택', exact: true }).click();
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(start).toHaveText('오전 12:00');
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const entries = await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!).entries);
  expect(entries[0].startedAt).toBe('2026-10-03T15:00:00.000Z');
});

for (const theme of ['', '?theme=light']) {
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
    await expect(page.getByRole('button', { name: '마시기 시작한 시각', exact: true })).toHaveText('오전 9:59');
  });
}

test('visible hour and minute numbers can be tapped without dragging', async ({ page }) => {
  await openPicker(page);
  await page.getByRole('button', { name: '10시 선택', exact: true }).click();
  await page.getByRole('button', { name: '31분 선택', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: '시', exact: true })).toHaveAttribute('aria-valuenow', '10');
  await expect(page.getByRole('spinbutton', { name: '분', exact: true })).toHaveAttribute('aria-valuenow', '31');
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(page.getByRole('button', { name: '마시기 시작한 시각', exact: true })).toHaveText('오전 10:31');
});

test('edit picker cancels browser back and closes the whole flow with the close button', async ({ page }) => {
  await openPicker(page);
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
  await page.getByRole('button', { name: '아메리카노 기록 수정' }).click();
  const dialog = await page.getByRole('dialog').elementHandle();
  await page.getByRole('button', { name: '마신 마지막 시각', exact: true }).click();
  expect(await dialog!.evaluate(element => element === document.querySelector('dialog'))).toBe(true);
  const hour = page.getByRole('spinbutton', { name: '시', exact: true });
  await hour.focus();
  await hour.press('Home');
  await page.goBack();
  await expect(page.getByRole('button', { name: '마신 마지막 시각', exact: true })).toHaveText('오전 10:00');
  await page.getByRole('button', { name: '마신 마지막 시각', exact: true }).click();
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page).toHaveURL(/\/history$/);
  await expect(page.getByRole('heading', { name: '한 잔의 기록', exact: true })).toBeVisible();
});
