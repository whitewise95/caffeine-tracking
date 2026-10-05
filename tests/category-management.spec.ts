import { expect, test, type Page } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';
import type { CaffeineState } from '../src/features/caffeine/model/caffeine.types';

const storageKey = 'caffeine-tracker:state:v1';
const originalIds = ['coffee', 'tea', 'energy', 'other'];

async function seed(page: Page, state = createInitialState(), theme = '') {
  await page.clock.install({ time: new Date('2026-10-05T10:00:00+09:00') });
  await page.addInitScript(({ key, state }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
  }, { key: storageKey, state });
  await page.goto(`/${theme}`);
}

async function stored(page: Page): Promise<CaffeineState> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!), storageKey);
}

async function openSettingsManager(page: Page) {
  await page.getByRole('navigation').getByRole('button', { name: '설정', exact: true }).click();
  await page.getByRole('button', { name: '카테고리 관리', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '카테고리 관리', exact: true })).toBeVisible();
}

function row(page: Page, id: string) {
  return page.locator(`li[data-category-row="${id}"]`);
}

async function categoryOrder(page: Page) {
  return page.locator('li[data-category-row]').evaluateAll(elements => elements.map(element => element.getAttribute('data-category-row')));
}

async function expand(page: Page, id: string, name: string) {
  await row(page, id).getByRole('button', { name: `${name} 카테고리 관리`, exact: true }).click();
}

async function startRename(page: Page, id: string, name: string) {
  await expand(page, id, name);
  await row(page, id).getByRole('button', { name: '이름 변경', exact: true }).click();
}

async function startDelete(page: Page, id: string, name: string) {
  await expand(page, id, name);
  await row(page, id).getByRole('button', { name: '삭제', exact: true }).click();
}

async function createCategory(page: Page, name: string) {
  await page.getByRole('button', { name: '카테고리 추가', exact: true }).click();
  await page.getByLabel('카테고리 이름', { exact: true }).fill(name);
  await page.getByRole('button', { name: '추가', exact: true }).click();
  await expect(page.getByRole('button', { name: `${name.normalize('NFC').trim()} 카테고리 관리`, exact: true })).toBeVisible();
}

async function openDrinkList(page: Page) {
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await page.getByRole('navigation').getByRole('button', { name: '홈', exact: true }).click();
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
}

async function failNextWrite(page: Page) {
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) {
        Storage.prototype.setItem = original;
        throw new DOMException('Storage is full', 'QuotaExceededError');
      }
      return original.call(this, name, value);
    };
  }, storageKey);
}

async function photoDataUrl(page: Page, mimeType: 'image/png' | 'image/jpeg') {
  return page.evaluate(type => {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 160;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#f3a6b8';
    context.fillRect(0, 0, 240, 160);
    return canvas.toDataURL(type);
  }, mimeType);
}

async function photoFixture(page: Page) {
  const dataUrl = await photoDataUrl(page, 'image/png');
  return { name: 'category-draft.png', mimeType: 'image/png', buffer: Buffer.from(dataUrl.split(',')[1], 'base64') };
}

test('category management opens from settings without leaving the current page', async ({ page }, testInfo) => {
  await seed(page);
  await page.getByRole('navigation').getByRole('button', { name: '설정', exact: true }).click();
  const settingsUrl = page.url();
  await page.getByRole('button', { name: '카테고리 관리', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '카테고리 관리', exact: true })).toBeVisible();
  expect(page.url()).toBe(settingsUrl);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-category-manager.png`, animations: 'disabled' });
  await page.goBack();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: '카테고리 관리', exact: true })).toBeFocused();
});

test('renaming a built-in category validates names and preserves its ID and drinks after reload', async ({ page }) => {
  await seed(page);
  await openSettingsManager(page);
  const before = await stored(page);
  await startRename(page, 'coffee', '커피');
  const input = page.getByLabel('카테고리 이름', { exact: true });
  const save = page.getByRole('button', { name: '저장', exact: true });
  for (const invalid of ['   ', ' 차 ']) {
    await input.fill(invalid);
    await save.click();
    await expect(page.getByRole('dialog').getByRole('alert').last()).toBeVisible();
    expect(await stored(page)).toEqual(before);
  }
  await input.fill('카페 음료');
  await save.click();
  await expect(row(page, 'coffee')).toContainText('카페 음료');
  expect((await stored(page)).categoryCatalog?.find(category => category.id === 'coffee')).toEqual({ id: 'coffee', name: '카페 음료' });
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await page.reload();
  await page.getByRole('navigation').getByRole('button', { name: '홈', exact: true }).click();
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  const coffee = page.locator('.sheet-category').filter({ has: page.getByRole('heading', { name: '카페 음료', exact: true }) });
  await expect(coffee.getByRole('button', { name: /아메리카노\s*150\s*mg/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: '커피', exact: true })).toHaveCount(0);
});

test('empty categories can be created and deleted while NFC and whitespace duplicates are rejected', async ({ page }) => {
  await seed(page);
  await openSettingsManager(page);
  await createCategory(page, 'Cafe\u0301');
  const created = (await stored(page)).categoryCatalog!.find(category => category.name === 'Café')!;
  expect(created.id).toMatch(/^custom:/);
  await page.getByRole('button', { name: '카테고리 추가', exact: true }).click();
  await page.getByLabel('카테고리 이름', { exact: true }).fill(' Ca fe\u0301 ');
  await page.getByRole('button', { name: '추가', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert').last()).toContainText('이미');
  expect((await stored(page)).categoryCatalog).toHaveLength(5);
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await startDelete(page, created.id, 'Café');
  await expect(page.getByLabel('음료를 이동할 카테고리', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '카테고리 삭제', exact: true }).click();
  await expect(row(page, created.id)).toHaveCount(0);
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await page.reload();
  await openSettingsManager(page);
  expect(await categoryOrder(page)).toEqual(originalIds);
});

test('deleting a populated category moves built-in and photo drinks without reviving hidden drinks or changing history', async ({ page }) => {
  const state = createInitialState();
  state.customDrinks = [{ id: 'photo-coffee', categoryId: 'coffee', name: '사진 커피', caffeineMg: 67, icon: 'cup', isCustom: true, sourceType: 'custom', photoDataUrl: await photoDataUrl(page, 'image/jpeg') }];
  state.deletedDefaultDrinkIds = ['cold-brew'];
  state.entries = [{ id: 'old-photo', drinkId: 'photo-coffee', drinkName: '사진 커피', caffeineMg: 67, icon: 'cup', sourceType: 'custom', consumedAt: '2026-10-05T09:00:00+09:00' }];
  await seed(page, state);
  await openSettingsManager(page);
  await startDelete(page, 'coffee', '커피');
  const confirm = page.getByRole('button', { name: '음료 이동 후 삭제', exact: true });
  await expect(confirm).toBeDisabled();
  await page.getByLabel('음료를 이동할 카테고리', { exact: true }).selectOption('tea');
  await confirm.click();
  await expect(row(page, 'coffee')).toHaveCount(0);
  const saved = await stored(page);
  expect(saved.entries).toEqual(state.entries);
  expect(saved.customDrinks).toEqual([{ ...state.customDrinks[0], categoryId: 'tea' }]);
  expect(saved.deletedDefaultDrinkIds).toEqual(['cold-brew']);
  expect(saved.defaultDrinkCategoryOverrides?.americano).toBe('tea');
  await openDrinkList(page);
  const tea = page.locator('.sheet-category').filter({ has: page.getByRole('heading', { name: '차', exact: true }) });
  await expect(tea.getByRole('button', { name: /아메리카노\s*150\s*mg/ })).toBeVisible();
  await expect(tea.getByRole('button', { name: /사진 커피\s*67\s*mg/ }).locator('img')).toHaveAttribute('src', state.customDrinks[0].photoDataUrl!);
  await expect(page.getByRole('button', { name: /콜드브루\s*200\s*mg/ })).toHaveCount(0);
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await page.reload();
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
  await expect(page.locator('.history-entry')).toContainText('사진 커피');
  await expect(page.getByTestId('daily-total')).toHaveText('67');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await expect(page.getByRole('heading', { name: '커피', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /콜드브루\s*200\s*mg/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /사진 커피\s*67\s*mg/ })).toBeVisible();
});

test('the last populated category requires a newly created destination before deletion', async ({ page }) => {
  const state = createInitialState();
  state.categoryCatalog = [{ id: 'coffee', name: '커피' }];
  state.defaultDrinkCategoryOverrides = { 'green-tea': 'coffee', 'earl-grey': 'coffee', 'oolong-tea': 'coffee', 'energy-drink': 'coffee', cola: 'coffee' };
  await seed(page, state);
  await openSettingsManager(page);
  await startDelete(page, 'coffee', '커피');
  const confirm = page.getByRole('button', { name: '음료 이동 후 삭제', exact: true });
  await expect(confirm).toBeDisabled();
  await expect(page.getByRole('heading', { name: '새 카테고리 만들기', exact: true })).toBeVisible();
  await page.getByLabel('카테고리 이름', { exact: true }).fill('모든 음료');
  await page.getByRole('button', { name: '추가', exact: true }).click();
  await expect(confirm).toBeEnabled();
  await confirm.click();
  const saved = await stored(page);
  expect(saved.categoryCatalog).toHaveLength(1);
  expect(saved.categoryCatalog![0].name).toBe('모든 음료');
  expect(saved.categoryCatalog![0].id).toMatch(/^custom:/);
  await openDrinkList(page);
  await expect(page.locator('.sheet-category')).toHaveCount(1);
  await expect(page.locator('.drink-badge:not(.drink-badge-add)')).toHaveCount(8);
});

test('button and keyboard reorder persist through reload and control drink section order', async ({ page }) => {
  await seed(page);
  await openSettingsManager(page);
  await expand(page, 'coffee', '커피');
  await row(page, 'coffee').getByRole('button', { name: '아래로 이동', exact: true }).click();
  await expect.poll(() => categoryOrder(page)).toEqual(['tea', 'coffee', 'energy', 'other']);
  await page.getByRole('button', { name: '카테고리 관리 닫기', exact: true }).click();
  const handle = row(page, 'other').getByRole('button', { name: '탄산 카테고리 순서 이동', exact: true });
  await handle.focus();
  await handle.press('Space');
  await handle.press('ArrowUp');
  await handle.press('Space');
  await expect.poll(() => categoryOrder(page)).toEqual(['tea', 'coffee', 'other', 'energy']);
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await page.reload();
  await openSettingsManager(page);
  expect(await categoryOrder(page)).toEqual(['tea', 'coffee', 'other', 'energy']);
  await openDrinkList(page);
  await expect(page.locator('.sheet-category h3')).toHaveText(['차', '커피', '탄산', '에너지음료']);
  await page.getByRole('button', { name: '차에 내 음료 추가', exact: true }).click();
  await expect(page.getByRole('group', { name: '기존 카테고리' }).getByRole('button')).toHaveText(['차', '커피', '탄산', '에너지음료']);
});

test('long-press reorder commits only on drop and pointer cancellation and back leave order unchanged', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', error => pageErrors.push(error));
  await seed(page);
  await openSettingsManager(page);
  const handle = row(page, 'coffee').getByRole('button', { name: '커피 카테고리 순서 이동', exact: true });
  const start = (await handle.boundingBox())!;
  const target = (await row(page, 'tea').locator('.category-manager-row').boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(450); // Hold through the long-press threshold before dragging.
  await page.mouse.move(start.x + start.width / 2, target.y + target.height * .75, { steps: 5 });
  expect((await stored(page)).categoryCatalog).toBeUndefined();
  await page.mouse.up();
  await expect.poll(() => categoryOrder(page)).toEqual(['tea', 'coffee', 'energy', 'other']);
  const saved = await stored(page);
  const cancelHandle = row(page, 'tea').getByRole('button', { name: '차 카테고리 순서 이동', exact: true });
  const cancelStart = (await cancelHandle.boundingBox())!;
  const cancelEnd = (await row(page, 'coffee').locator('.category-manager-row').boundingBox())!;
  const touch = await page.context().newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cancelStart.x + 20, y: cancelStart.y + 20 }] });
  await page.waitForTimeout(450);
  await expect(cancelHandle).toHaveAttribute('aria-pressed', 'true');
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cancelStart.x + 20, y: cancelEnd.y + cancelEnd.height * .75 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await touch.detach();
  await expect(cancelHandle).toHaveAttribute('aria-pressed', 'false');
  expect(await stored(page)).toEqual(saved);
  expect(await categoryOrder(page)).toEqual(['tea', 'coffee', 'energy', 'other']);
  await cancelHandle.focus();
  await cancelHandle.press('Space');
  await cancelHandle.press('ArrowDown');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '카테고리 관리', exact: true })).toBeVisible();
  expect(await stored(page)).toEqual(saved);
  await cancelHandle.press('Space');
  await cancelHandle.press('ArrowDown');
  await page.goBack();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(await stored(page)).toEqual(saved);
  expect(pageErrors).toEqual([]);
});

test('a real touch swipe scrolls the list and a held handle auto-scrolls to the last category before drop', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', error => pageErrors.push(error));
  const state = createInitialState();
  const extras = Array.from({ length: 12 }, (_, index) => ({ id: `custom:extra-${index}` as const, name: `나의 분류 ${index + 1}` }));
  state.customCategories = extras;
  state.categoryCatalog = [
    { id: 'coffee', name: '커피' }, { id: 'tea', name: '차' },
    { id: 'energy', name: '에너지음료' }, { id: 'other', name: '탄산' }, ...extras,
  ];
  await seed(page, state);
  await openSettingsManager(page);
  const scroll = page.locator('.category-manager-scroll');
  const bounds = (await scroll.boundingBox())!;
  const touch = await page.context().newCDPSession(page);
  const x = bounds.x + bounds.width / 2;
  const swipeStart = bounds.y + bounds.height * .8;
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: swipeStart }] });
  for (let step = 1; step <= 6; step++) {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: swipeStart - bounds.height * .5 * step / 6 }] });
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => scroll.evaluate(element => element.scrollTop)).toBeGreaterThan(100);
  expect(await stored(page)).toEqual(state);
  await scroll.evaluate(element => { element.scrollTop = 0; });
  const handle = row(page, 'coffee').getByRole('button', { name: '커피 카테고리 순서 이동', exact: true });
  await handle.scrollIntoViewIfNeeded();
  const start = (await handle.boundingBox())!;
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start.x + start.width / 2, y: start.y + start.height / 2 }] });
  await page.waitForTimeout(450);
  await expect(handle).toHaveAttribute('aria-pressed', 'true');
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + start.width / 2, y: bounds.y + bounds.height - 10 }] });
  await expect.poll(() => scroll.evaluate(element => element.scrollTop >= element.scrollHeight - element.clientHeight - 2)).toBe(true);
  expect(await stored(page)).toEqual(state);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await touch.detach();
  const wanted = ['tea', 'energy', 'other', ...extras.map(category => category.id), 'coffee'];
  await expect.poll(() => categoryOrder(page)).toEqual(wanted);
  expect((await stored(page)).categoryCatalog?.map(category => category.id)).toEqual(wanted);
  expect(pageErrors).toEqual([]);
});

test('category management preserves an unsaved drink name photo and dose while following a category rename', async ({ page }) => {
  await seed(page);
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: '커피에 내 음료 추가', exact: true }).click();
  await page.getByLabel('메뉴명', { exact: true }).fill('작성 중인 사진 음료');
  await page.getByLabel('카페인량 mg', { exact: true }).fill('67');
  await page.locator('input[type=file]').setInputFiles(await photoFixture(page));
  await expect(page.getByRole('button', { name: '앨범 사진 변경', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const photo = (await page.locator('.sheet-photo-option img').getAttribute('src'))!;
  await page.locator('dialog').evaluate(element => element.setAttribute('data-draft-modal', 'true'));
  await page.getByRole('button', { name: '카테고리 관리', exact: true }).click();
  await expect(page.locator('dialog[data-draft-modal="true"]')).toBeVisible();
  await startRename(page, 'coffee', '커피');
  await page.getByLabel('카테고리 이름', { exact: true }).fill('나의 카페');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await page.getByRole('button', { name: '음료 작성으로 돌아가기', exact: true }).click();
  await expect(page.getByLabel('카테고리', { exact: true })).toHaveValue('나의 카페');
  await expect(page.getByLabel('메뉴명', { exact: true })).toHaveValue('작성 중인 사진 음료');
  await expect(page.getByLabel('카페인량 mg', { exact: true })).toHaveValue('67');
  await expect(page.locator('.sheet-photo-option img')).toHaveAttribute('src', photo);
  await page.getByRole('button', { name: '카테고리 관리', exact: true }).click();
  await page.goBack();
  await expect(page.getByRole('dialog', { name: '내 음료 추가', exact: true })).toBeVisible();
  await expect(page.locator('.sheet-photo-option img')).toHaveAttribute('src', photo);
  await page.getByRole('button', { name: '음료 저장', exact: true }).click();
  await expect(page.getByRole('heading', { name: '작성 중인 사진 음료', exact: true })).toBeVisible();
  expect((await stored(page)).customDrinks).toEqual([expect.objectContaining({ categoryId: 'coffee', name: '작성 중인 사진 음료', caffeineMg: 67, photoDataUrl: photo })]);
  expect((await stored(page)).categoryCatalog).toHaveLength(4);
});

test('failed rename delete and reorder writes preserve state and allow a single successful retry', async ({ page }) => {
  await seed(page);
  await openSettingsManager(page);
  await startRename(page, 'coffee', '커피');
  await page.getByLabel('카테고리 이름', { exact: true }).fill('카페');
  const before = await stored(page);
  await failNextWrite(page);
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert').last()).toContainText('저장');
  expect(await stored(page)).toEqual(before);
  await expect(page.getByLabel('카테고리 이름', { exact: true })).toHaveValue('카페');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(row(page, 'coffee')).toContainText('카페');
  await startDelete(page, 'coffee', '카페');
  await page.getByLabel('음료를 이동할 카테고리', { exact: true }).selectOption('tea');
  const renamed = await stored(page);
  await failNextWrite(page);
  await page.getByRole('button', { name: '음료 이동 후 삭제', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert').last()).toBeVisible();
  expect(await stored(page)).toEqual(renamed);
  await expect(page.getByLabel('음료를 이동할 카테고리', { exact: true })).toHaveValue('tea');
  await page.getByRole('button', { name: '음료 이동 후 삭제', exact: true }).click();
  await expect(row(page, 'coffee')).toHaveCount(0);
  await expand(page, 'tea', '차');
  const deleted = await stored(page);
  await failNextWrite(page);
  await row(page, 'tea').getByRole('button', { name: '아래로 이동', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert').last()).toBeVisible();
  expect(await stored(page)).toEqual(deleted);
  expect(await categoryOrder(page)).toEqual(['tea', 'energy', 'other']);
  await page.getByRole('button', { name: '순서 다시 저장', exact: true }).click();
  await expect.poll(() => categoryOrder(page)).toEqual(['energy', 'tea', 'other']);
  expect((await stored(page)).categoryCatalog).toHaveLength(3);
});

for (const theme of ['', '?theme=light']) {
  test(`category management stays usable with 200% text and 48px controls ${theme || 'dark'}`, async ({ page }, testInfo) => {
    await seed(page, createInitialState(), theme);
    await openSettingsManager(page);
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await createCategory(page, '아주긴카테고리이름도화면을넘지않아요');
    await expand(page, 'coffee', '커피');
    const dialog = page.getByRole('dialog', { name: '카테고리 관리', exact: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    const targets = dialog.locator('.category-manager-row button');
    for (const target of await targets.all()) {
      const box = (await target.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(48);
      expect(box.height).toBeGreaterThanOrEqual(48);
    }
    await row(page, 'coffee').getByRole('button', { name: '이름 변경', exact: true }).click();
    await page.getByLabel('카테고리 이름', { exact: true }).fill('확대해도 편한 카페');
    const save = page.getByRole('button', { name: '저장', exact: true });
    await save.scrollIntoViewIfNeeded();
    await expect(save).toBeInViewport();
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.screenshot({ path: `test-results/${testInfo.project.name}-category-manager-200-${theme ? 'light' : 'dark'}.png`, animations: 'disabled' });
    await save.click();
    await expect(row(page, 'coffee')).toContainText('확대해도 편한 카페');
  });
}
