import { expect, test, type Locator, type Page } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';
import type { CaffeineState } from '../src/features/caffeine/model/caffeine.types';
import { installTossHost } from './helpers/tossHost';

const storageKey = 'caffeine-tracker:state:v1';

async function seed(page: Page, state = createInitialState()) {
  await page.clock.install({ time: new Date('2026-10-05T10:00:00+09:00') });
  await page.addInitScript(({ key, state }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
  }, { key: storageKey, state });
  await page.goto('/');
}

async function stored(page: Page): Promise<CaffeineState> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!), storageKey);
}

async function openEditor(page: Page) {
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: '편집', exact: true }).click();
  const editor = page.getByRole('dialog', { name: '어떤 카페인을 마셨나요?', exact: true });
  await expect(editor).toBeVisible();
  // Coordinate gestures begin after the sheet's finite entrance animations settle.
  await editor.evaluate(async element => {
    await Promise.all(element.getAnimations({ subtree: true })
      .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
      .map(animation => animation.finished.catch(() => undefined)));
  });
}

function category(page: Page, id: string) {
  return page.locator(`[data-layout-category="${id}"]`);
}

function drink(page: Page, id: string) {
  return page.locator(`[data-layout-drink="${id}"]`);
}

async function categoryOrder(page: Page) {
  return page.locator('[data-layout-category]').evaluateAll(elements => elements.map(element => element.getAttribute('data-layout-category')));
}

async function drinkOrder(page: Page, categoryId: string) {
  return category(page, categoryId).locator('[data-layout-drink]').evaluateAll(elements => elements.map(element => element.getAttribute('data-layout-drink')));
}

async function startMouseDrag(page: Page, handle: Locator, target: Locator) {
  await handle.scrollIntoViewIfNeeded();
  const start = (await handle.boundingBox())!;
  const end = (await target.boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(end.x + 8, end.y + Math.min(20, end.height / 2), { steps: 8 });
  await expect(page.locator('.catalog-drag-preview')).toBeVisible();
}

async function finishAndReload(page: Page) {
  await page.getByRole('button', { name: '완료', exact: true }).first().click();
  await expect(page.getByRole('button', { name: '편집', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await page.reload();
  await openEditor(page);
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

async function observeDrinkOrderWhilePaused(page: Page, categoryId: string) {
  return category(page, categoryId).evaluate(async element => {
    const samples: Array<Array<string | undefined>> = [];
    for (let frame = 0; frame < 20; frame++) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      samples.push(Array.from(element.querySelectorAll<HTMLElement>('[data-layout-drink]')).map(item => item.dataset.layoutDrink));
    }
    return samples;
  });
}

async function expectOtherItemsUndimmed(page: Page) {
  const appearances = await page.locator('.catalog-editor button, .catalog-editor [data-layout-drink]').evaluateAll(elements => elements
    .filter(element => !element.closest('[data-layout-category].is-dragging, [data-layout-drink].is-dragging'))
    .map(element => {
      let opacity = 1;
      for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) opacity *= Number(getComputedStyle(ancestor).opacity);
      return { label: element.getAttribute('aria-label') ?? element.textContent?.trim(), opacity };
    }));
  expect(appearances.length).toBeGreaterThan(0);
  expect(appearances.filter(item => item.opacity !== 1)).toEqual([]);
}

async function deferNextWrite(page: Page) {
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name !== key) return original.call(this, name, value);
      Storage.prototype.setItem = original;
      return new Promise<void>(resolve => window.addEventListener('complete-catalog-save', () => {
        original.call(this, name, value);
        resolve();
      }, { once: true }));
    };
  }, storageKey);
}

for (const kind of ['drink', 'category'] as const) {
  test(`a quick ${kind} drag previews without waiting and persists on done`, async ({ page }) => {
    await seed(page);
    await openEditor(page);
    const source = kind === 'drink'
      ? page.getByRole('button', { name: '아메리카노 음료 편집', exact: true })
      : page.getByRole('button', { name: '차 카테고리 이름 변경', exact: true });
    const destination = kind === 'drink' ? drink(page, 'green-tea') : category(page, 'coffee').getByRole('heading');
    const start = (await source.boundingBox())!;
    const end = (await destination.boundingBox())!;
    const touch = await page.context().newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start.x + start.width / 2, y: start.y + start.height / 2 }] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: end.x + 8, y: end.y + end.height / 2 }] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await touch.detach();
    if (kind === 'drink') {
      await expect(drink(page, 'americano').locator('xpath=ancestor::section[1]')).toHaveAttribute('data-layout-category', 'tea');
    } else {
      await expect.poll(() => categoryOrder(page)).toEqual(['tea', 'coffee', 'energy', 'other']);
      await expect.poll(() => categoryOrder(page)).toEqual(['tea', 'coffee', 'energy', 'other']);
    }
    await expect(page.getByRole('button', { name: '완료', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '완료', exact: true }).click();
    await expect(page.getByRole('button', { name: '편집', exact: true })).toBeVisible();
    if (kind === 'drink') expect((await stored(page)).defaultDrinkCategoryOverrides?.americano).toBe('tea');
    else expect((await stored(page)).categoryCatalog?.map(item => item.id)).toEqual(['tea', 'coffee', 'energy', 'other']);
  });

  test(`a quick ${kind} release uses the final position when movement events are coalesced`, async ({ page }) => {
    await seed(page);
    await openEditor(page);
    // A short gesture can end before a substantial pointermove is delivered.
    // Keep all events in one task, without a render or animation frame between them.
    await page.evaluate(kind => {
      const source = document.querySelector<HTMLElement>(kind === 'drink'
        ? '[aria-label="아메리카노 음료 편집"]' : '[aria-label="차 카테고리 이름 변경"]')!;
      const destination = document.querySelector<HTMLElement>(kind === 'drink'
        ? '[data-layout-drink="green-tea"]' : '[data-layout-category="coffee"] h3')!;
      const start = source.getBoundingClientRect();
      const end = destination.getBoundingClientRect();
      const init = { bubbles: true, cancelable: true, pointerId: 37, pointerType: 'touch', isPrimary: true, button: 0 };
      const x = start.x + start.width / 2;
      const y = start.y + start.height / 2;
      source.dispatchEvent(new PointerEvent('pointerdown', { ...init, buttons: 1, clientX: x, clientY: y }));
      window.dispatchEvent(new PointerEvent('pointermove', { ...init, buttons: 1, clientX: x + 2, clientY: y }));
      window.dispatchEvent(new PointerEvent('pointerup', { ...init, buttons: 0, clientX: end.x + 8, clientY: end.y + end.height / 2 }));
    }, kind);
    if (kind === 'drink') {
      await expect(drink(page, 'americano').locator('xpath=ancestor::section[1]')).toHaveAttribute('data-layout-category', 'tea');
    } else {
      await expect.poll(() => categoryOrder(page)).toEqual(['tea', 'coffee', 'energy', 'other']);
    }
    await expect(page.getByRole('button', { name: '완료', exact: true })).toBeVisible();
    await expect(page.locator('.catalog-drag-preview')).toHaveCount(0);
    await page.getByRole('button', { name: '완료', exact: true }).click();
    await expect(page.getByRole('button', { name: '편집', exact: true })).toBeVisible();
    if (kind === 'drink') expect((await stored(page)).defaultDrinkCategoryOverrides?.americano).toBe('tea');
    else expect((await stored(page)).categoryCatalog?.map(item => item.id)).toEqual(['tea', 'coffee', 'energy', 'other']);
  });
}

test('a quick drop on a visibly moving category heading uses that category instead of its old source', async ({ page }) => {
  await page.setViewportSize({ width: 735, height: 913 });
  const state = createInitialState();
  state.categoryCatalog = [{ id: 'energy', name: '에너지음료' }, { id: 'tea', name: '차' }, { id: 'other', name: '탄산' }];
  state.deletedDefaultDrinkIds = ['cold-brew', 'green-tea', 'oolong-tea'];
  state.defaultDrinkCategoryOverrides = { americano: 'energy', 'caffe-latte': 'energy', 'earl-grey': 'energy', cola: 'energy' };
  state.drinkOrder = ['earl-grey', 'cola', 'americano', 'caffe-latte', 'energy-drink'];
  await seed(page, state);
  await openEditor(page);
  const before = await stored(page);
  await page.evaluate(() => {
    const source = document.querySelector<HTMLElement>('[data-layout-drink="earl-grey"] .catalog-drink-surface')!;
    const start = source.getBoundingClientRect();
    const init = { bubbles: true, cancelable: true, pointerId: 91, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1 };
    source.dispatchEvent(new PointerEvent('pointerdown', { ...init, clientX: start.x + start.width / 2, clientY: start.y + start.height / 2 }));
    window.dispatchEvent(new PointerEvent('pointermove', { ...init, clientX: start.x + start.width / 2 + 8, clientY: start.y + start.height / 2 }));
  });
  await page.locator('.catalog-editor-scroll').evaluate(async container => {
    await Promise.all(container.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => undefined)));
    const energy = container.querySelector<HTMLElement>('[data-layout-category="energy"]')!.getBoundingClientRect();
    window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, cancelable: true, pointerId: 91, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1, clientX: energy.x + 20, clientY: energy.bottom + 8 }));
  });
  await expect.poll(() => drinkOrder(page, 'energy')).toEqual(['cola', 'americano', 'caffe-latte', 'energy-drink', 'earl-grey']);
  const movement = await page.evaluate(() => {
    const heading = document.querySelector<HTMLElement>('[data-layout-category="tea"] .catalog-category-heading')!;
    for (const animation of heading.getAnimations()) { animation.pause(); animation.currentTime = 0; }
    const visible = heading.getBoundingClientRect();
    const section = heading.closest<HTMLElement>('[data-layout-category]')!.getBoundingClientRect();
    const init = { bubbles: true, cancelable: true, pointerId: 91, pointerType: 'touch', isPrimary: true, button: 0, clientX: visible.x + 20, clientY: visible.y + visible.height / 2 };
    window.dispatchEvent(new PointerEvent('pointermove', { ...init, buttons: 1 }));
    window.dispatchEvent(new PointerEvent('pointerup', { ...init, buttons: 0 }));
    return section.top - visible.top;
  });
  expect(movement).toBeGreaterThan(40);
  await expect(drink(page, 'earl-grey').locator('xpath=ancestor::section[1]')).toHaveAttribute('data-layout-category', 'tea');
  await expect.poll(() => drinkOrder(page, 'tea')).toEqual(['earl-grey']);
  expect((await stored(page)).entries).toEqual(before.entries);
  await finishAndReload(page);
  expect(await drinkOrder(page, 'tea')).toEqual(['earl-grey']);
});

for (const movement of ['drink-order', 'drink-category', 'category-order'] as const) {
  test(`a ${movement} drop saves the visible position when the pointer crosses the horizontal list edge`, async ({ page }) => {
    await page.setViewportSize({ width: 735, height: 913 });
    await seed(page);
    await openEditor(page);
    const before = await stored(page);
    const source = movement === 'category-order'
      ? page.getByRole('button', { name: '차 카테고리 이름 변경', exact: true })
      : page.getByRole('button', { name: movement === 'drink-order' ? '카페라떼 음료 편집' : '아메리카노 음료 편집', exact: true });
    const destination = movement === 'drink-category' ? category(page, 'tea') : movement === 'drink-order' ? drink(page, 'americano') : category(page, 'coffee');
    await startMouseDrag(page, source, destination);
    const order = movement === 'drink-category' ? ['americano', 'green-tea', 'earl-grey', 'oolong-tea'] : ['caffe-latte', 'americano', 'cold-brew'];
    if (movement === 'category-order') await expect.poll(() => categoryOrder(page)).toEqual(['tea', 'coffee', 'energy', 'other']);
    else await expect.poll(() => drinkOrder(page, movement === 'drink-category' ? 'tea' : 'coffee')).toEqual(order);
    const viewport = (await page.locator('.catalog-editor-scroll').boundingBox())!;
    const preview = (await page.locator('.catalog-drag-preview').boundingBox())!;
    // Move only sideways: the projected destination and the visible card stay in the list.
    const pointerY = preview.y + (movement === 'category-order' ? 20 : preview.height / 2);
    await page.mouse.move(viewport.x - 2, pointerY);
    const visibleCard = (await page.locator('.catalog-drag-preview').boundingBox())!;
    expect(visibleCard.x).toBeGreaterThanOrEqual(viewport.x);
    expect(visibleCard.x + visibleCard.width).toBeLessThanOrEqual(viewport.x + viewport.width);
    await page.mouse.up();
    await expect(page.locator('.catalog-drag-preview')).toHaveCount(0);
    if (movement === 'category-order') {
      await expect.poll(() => categoryOrder(page)).toEqual(['tea', 'coffee', 'energy', 'other']);
    } else {
      await expect.poll(() => drinkOrder(page, movement === 'drink-category' ? 'tea' : 'coffee')).toEqual(order);
    }
    expect((await stored(page)).entries).toEqual(before.entries);
    await finishAndReload(page);
    if (movement === 'category-order') expect(await categoryOrder(page)).toEqual(['tea', 'coffee', 'energy', 'other']);
    else expect(await drinkOrder(page, movement === 'drink-category' ? 'tea' : 'coffee')).toEqual(order);
  });
}

test('editing keeps compact badges and places category add and reset above the catalog', async ({ page }, testInfo) => {
  await seed(page);
  const before = await stored(page);
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '어떤 카페인을 마셨나요?', exact: true });
  await dialog.evaluate(async element => {
    await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => undefined)));
    Reflect.set(window, 'originalCatalogScroll', element.querySelector('.catalog-editor-scroll'));
  });
  const bounds = () => page.locator('[data-layout-drink]').evaluateAll(elements => elements.map(element => {
    const { x, y, width, height } = element.getBoundingClientRect();
    return { id: element.getAttribute('data-layout-drink'), x, y, width, height };
  }));
  const originalBounds = await bounds();
  await page.screenshot({ path: `test-results/${testInfo.project.name}-catalog-selection.png`, animations: 'disabled' });
  await page.getByRole('button', { name: '편집', exact: true }).click();
  await expect(page.getByRole('button', { name: '완료', exact: true })).toBeVisible();
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: '음료 목록으로 돌아가기', exact: true })).toHaveCount(0);
  const editedBounds = await bounds();
  const relativeBounds = (items: typeof originalBounds) => items.map(item => ({ ...item, y: item.y - items[0].y }));
  expect(relativeBounds(editedBounds)).toEqual(relativeBounds(originalBounds));
  const actions = page.locator('.catalog-top-actions');
  await expect(actions.getByRole('button', { name: '카테고리 추가', exact: true })).toBeVisible();
  await expect(actions.getByRole('button', { name: '초기화', exact: true })).toBeDisabled();
  const actionBox = (await actions.boundingBox())!;
  const firstCategory = (await page.locator('[data-layout-category]').first().boundingBox())!;
  expect(actionBox.y + actionBox.height).toBeLessThan(firstCategory.y);
  await expect(page.locator('.sheet-empty-footer')).toHaveCount(0);
  expect(await page.evaluate(() => document.querySelector('.catalog-editor-scroll') === Reflect.get(window, 'originalCatalogScroll'))).toBe(true);
  await expect(page.locator('.sheet-description')).toHaveText('오늘 마신 한 잔, 가볍게 남겨요.');
  await expect(page.getByText('배지를 끌어서 이동해요', { exact: true })).toHaveCount(0);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-catalog-inline-edit.png`, animations: 'disabled' });
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(page.getByRole('button', { name: '편집', exact: true })).toBeVisible();
  expect(await bounds()).toEqual(originalBounds);
  expect(await stored(page)).toEqual(before);
});

test('a release click retargeted to the sheet cannot dismiss editing after a category move', async ({ page }) => {
  await seed(page);
  await openEditor(page);
  await startMouseDrag(page, page.getByRole('button', { name: '아메리카노 음료 편집', exact: true }), drink(page, 'green-tea'));
  await expect.poll(() => drinkOrder(page, 'tea')).toEqual(['americano', 'green-tea', 'earl-grey', 'oolong-tea']);
  // Some hosts retarget the compatibility click when the pressed card changes parent.
  // Dispatch the release separately so its click lands on the dialog rather than the card.
  await page.evaluate(() => {
    const source = document.querySelector('[data-layout-drink="americano"]')!.getBoundingClientRect();
    window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, pointerType: 'mouse', isPrimary: true, clientX: source.x + 8, clientY: source.y + source.height / 2 }));
    document.querySelector('dialog')!.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, clientX: 0, clientY: 0 }));
  });
  await page.mouse.up();
  await expect(page.getByRole('button', { name: '완료', exact: true })).toBeVisible();
  await expect(drink(page, 'americano').locator('xpath=ancestor::section[1]')).toHaveAttribute('data-layout-category', 'tea');
  // A new tap remains usable immediately after the drag's consumed click.
  await finishAndReload(page);
  expect(await drinkOrder(page, 'tea')).toEqual(['americano', 'green-tea', 'earl-grey', 'oolong-tea']);
});

test('catalog edit mode returns to selection with browser back without changing data', async ({ page }, testInfo) => {
  await seed(page);
  const before = await stored(page);
  await openEditor(page);
  await expect(page.getByRole('button', { name: '아메리카노 음료 편집', exact: true })).toBeVisible();
  await page.screenshot({ path: `test-results/${testInfo.project.name}-catalog-layout.png`, animations: 'disabled' });
  await page.goBack();
  await expect(page.getByRole('button', { name: '편집', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /아메리카노\s*150\s*mg/ })).toBeVisible();
  expect(await stored(page)).toEqual(before);
});

test('dragging into an empty category appends the drink and persists after reload', async ({ page }) => {
  const state = createInitialState();
  state.deletedDefaultDrinkIds = ['green-tea', 'earl-grey', 'oolong-tea'];
  await seed(page, state);
  await openEditor(page);
  expect(await drinkOrder(page, 'tea')).toEqual([]);
  await startMouseDrag(page, page.getByRole('button', { name: '아메리카노 음료 편집', exact: true }), page.locator('[data-layout-dropzone="tea"]'));
  // Moving out of coffee shortens it, so aim at the empty category's current position.
  const currentDestination = (await page.locator('[data-layout-dropzone="tea"]').boundingBox())!;
  await page.mouse.move(currentDestination.x + 12, currentDestination.y + 20, { steps: 4 });
  await expect.poll(() => drinkOrder(page, 'tea')).toEqual(['americano']);
  await page.mouse.up();
  await expect.poll(() => drinkOrder(page, 'tea')).toEqual(['americano']);
  await expect.poll(() => drinkOrder(page, 'coffee')).toEqual(['cold-brew', 'caffe-latte']);
  await finishAndReload(page);
  expect(await drinkOrder(page, 'tea')).toEqual(['americano']);
  expect((await stored(page)).deletedDefaultDrinkIds).toEqual(['green-tea', 'earl-grey', 'oolong-tea']);
});

test('holding a dragged drink near the scroll edge reaches an offscreen category before saving', async ({ page }) => {
  const state = createInitialState();
  const extras = Array.from({ length: 8 }, (_, index) => ({ id: `custom:layout-${index}` as const, name: `나의 분류 ${index + 1}` }));
  state.customCategories = extras;
  state.categoryCatalog = [{ id: 'coffee', name: '커피' }, { id: 'tea', name: '차' }, { id: 'energy', name: '에너지음료' }, { id: 'other', name: '탄산' }, ...extras];
  await seed(page, state);
  await openEditor(page);
  const before = await stored(page);
  const scroll = page.locator('.catalog-editor-scroll');
  const bounds = (await scroll.boundingBox())!;
  const handle = page.getByRole('button', { name: '아메리카노 음료 편집', exact: true });
  const start = (await handle.boundingBox())!;
  const touch = await page.context().newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start.x + start.width / 2, y: start.y + start.height / 2 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height - 12 }] });
  await expect(page.locator('.catalog-drag-preview')).toBeVisible();
  await expect.poll(() => scroll.evaluate(element => element.scrollTop >= element.scrollHeight - element.clientHeight - 2), { timeout: 10000 }).toBe(true);
  expect(await stored(page)).toEqual(before);
  const destination = (await page.locator('[data-layout-dropzone="custom:layout-7"]').boundingBox())!;
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: destination.x + 12, y: destination.y + destination.height / 2 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await touch.detach();
  await expect.poll(() => drinkOrder(page, 'custom:layout-7')).toEqual(['americano']);
  expect(await drinkOrder(page, 'coffee')).toEqual(['cold-brew', 'caffe-latte']);
  await finishAndReload(page);
  expect(await drinkOrder(page, 'custom:layout-7')).toEqual(['americano']);
});

test('Android back dismisses catalog actions then editor then selection without exiting the app', async ({ page }) => {
  await installTossHost(page, 'android');
  await page.goto('/');
  const before = await page.evaluate(() => localStorage.getItem('test-toss-native-state'));
  await openEditor(page);
  await page.getByRole('button', { name: '아메리카노 음료 편집', exact: true }).click();
  await expect(page.getByLabel('메뉴명', { exact: true })).toBeVisible();
  const nativeBack = () => page.evaluate(() => (Reflect.get(window, 'testNativeBack') as () => void)());
  await nativeBack();
  await expect(page.getByLabel('메뉴명', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: '어떤 카페인을 마셨나요?', exact: true })).toBeVisible();
  await nativeBack();
  await expect(page.getByRole('button', { name: '편집', exact: true })).toBeVisible();
  await nativeBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  expect(await page.evaluate(() => Reflect.get(window, 'testCloseRequests'))).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem('test-toss-native-state'))).toBe(before);
});

test('enlarged text and reduced motion retain usable edit controls without horizontal overflow', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await openEditor(page);
  const editor = page.getByRole('dialog', { name: '어떤 카페인을 마셨나요?', exact: true });
  expect(await editor.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const action = page.getByRole('button', { name: '아메리카노 음료 편집', exact: true });
  await action.scrollIntoViewIfNeeded();
  await expect(action).toBeInViewport();
  await action.click();
  await page.getByLabel('메뉴명', { exact: true }).fill('큰 글씨 커피');
  await page.getByLabel('카페인량 mg', { exact: true }).fill('85');
  const save = page.getByRole('button', { name: '변경 저장', exact: true });
  await save.scrollIntoViewIfNeeded();
  await expect(save).toBeInViewport();
  expect(await save.evaluate(element => {
    const dialog = element.closest('dialog')!;
    return dialog.scrollWidth <= dialog.clientWidth;
  })).toBe(true);
  await save.click();
  await expect(page.getByRole('button', { name: '큰 글씨 커피 음료 편집', exact: true })).toBeVisible();
  expect(await drinkOrder(page, 'coffee')).toEqual(['americano', 'cold-brew', 'caffe-latte']);
  await page.getByRole('button', { name: '커피 카테고리 이름 변경', exact: true }).click();
  await page.getByLabel('카테고리 이름', { exact: true }).fill('큰 글씨 분류');
  const categorySave = page.getByRole('button', { name: '카테고리 이름 저장', exact: true });
  await expect(categorySave).toBeInViewport();
  expect(await editor.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await categorySave.click();
  await expect(page.getByRole('button', { name: '큰 글씨 분류 카테고리 이름 변경', exact: true })).toBeVisible();
  await page.screenshot({ path: `test-results/${testInfo.project.name}-catalog-layout-200-percent.png`, animations: 'disabled' });
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(page.getByRole('button', { name: '편집', exact: true })).toBeVisible();
});

test('dragging a drink card body previews its live position before saving on done and survives reload', async ({ page }, testInfo) => {
  await seed(page);
  await openEditor(page);
  const before = await stored(page);
  await startMouseDrag(page, page.getByRole('button', { name: '카페라떼 음료 편집', exact: true }), drink(page, 'americano'));
  await expect.poll(() => drinkOrder(page, 'coffee')).toEqual(['caffe-latte', 'americano', 'cold-brew']);
  const source = drink(page, 'caffe-latte');
  await expect(source).toHaveCSS('visibility', 'hidden');
  expect(await source.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  })).toBe(true);
  await expect(page.locator('.catalog-drag-preview')).toContainText('카페라떼');
  await expect(page.locator('.catalog-drag-preview')).toContainText(/100\s*mg/);
  const previewBounds = (await page.locator('.catalog-drag-preview').boundingBox())!;
  expect(previewBounds.x).toBeGreaterThanOrEqual(0);
  expect(previewBounds.x + previewBounds.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await expectOtherItemsUndimmed(page);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-catalog-live-drag.png`, animations: 'disabled' });
  expect(await stored(page)).toEqual(before);
  await page.mouse.up();
  await expect(page.locator('.catalog-drag-preview')).toHaveCount(0);
  await expect.poll(() => drinkOrder(page, 'coffee')).toEqual(['caffe-latte', 'americano', 'cold-brew']);
  await finishAndReload(page);
  expect(await drinkOrder(page, 'coffee')).toEqual(['caffe-latte', 'americano', 'cold-brew']);
});

test('live drink reordering reverses direction without oscillating while the pointer is paused', async ({ page }) => {
  await seed(page);
  await openEditor(page);
  const before = await stored(page);
  await startMouseDrag(page, page.getByRole('button', { name: '카페라떼 음료 편집', exact: true }), drink(page, 'americano'));
  const frontOrder = ['caffe-latte', 'americano', 'cold-brew'];
  await expect.poll(() => drinkOrder(page, 'coffee')).toEqual(frontOrder);
  expect(await observeDrinkOrderWhilePaused(page, 'coffee')).toEqual(Array.from({ length: 20 }, () => frontOrder));
  const last = (await drink(page, 'cold-brew').boundingBox())!;
  await page.mouse.move(last.x + last.width - 8, last.y + last.height / 2, { steps: 8 });
  const originalOrder = ['americano', 'cold-brew', 'caffe-latte'];
  await expect.poll(() => drinkOrder(page, 'coffee')).toEqual(originalOrder);
  expect(await observeDrinkOrderWhilePaused(page, 'coffee')).toEqual(Array.from({ length: 20 }, () => originalOrder));
  expect(await stored(page)).toEqual(before);
  const first = (await drink(page, 'americano').boundingBox())!;
  await page.mouse.move(first.x + 8, first.y + first.height / 2, { steps: 8 });
  await expect.poll(() => drinkOrder(page, 'coffee')).toEqual(frontOrder);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect.poll(() => drinkOrder(page, 'coffee')).toEqual(originalOrder);
  await expect(page.locator('.catalog-drag-preview')).toHaveCount(0);
  expect(await stored(page)).toEqual(before);
});

test('native wheel scrolling retargets a held drink without further pointer movement', async ({ page }) => {
  const state = createInitialState();
  const categories = Array.from({ length: 9 }, (_, index) => ({ id: `custom:wheel-${index}` as const, name: `휠 분류 ${index + 1}` }));
  state.customCategories = categories;
  state.categoryCatalog = categories;
  state.deletedDefaultDrinkIds = ['americano', 'cold-brew', 'caffe-latte', 'green-tea', 'earl-grey', 'oolong-tea', 'energy-drink', 'cola'];
  state.customDrinks = [{ id: 'wheel-drink', categoryId: 'custom:wheel-0', name: '휠 커피', caffeineMg: 75, icon: 'cup', isCustom: true, sourceType: 'custom' }];
  await seed(page, state);
  await openEditor(page);
  const before = await stored(page);
  const scroll = page.locator('.catalog-editor-scroll');
  const bounds = (await scroll.boundingBox())!;
  const handle = (await page.getByRole('button', { name: '휠 커피 음료 편집', exact: true }).boundingBox())!;
  const pointer = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(pointer.x, pointer.y, { steps: 8 });
  await expect(page.locator('.catalog-drag-preview')).toBeVisible();
  const destinationId = 'custom:wheel-5';
  const destination = (await page.locator(`[data-layout-dropzone="${destinationId}"]`).boundingBox())!;
  await page.mouse.wheel(0, destination.y + destination.height / 2 - pointer.y);
  await expect.poll(() => scroll.evaluate(element => element.scrollTop)).toBeGreaterThan(300);
  await expect.poll(() => drinkOrder(page, destinationId)).toEqual(['wheel-drink']);
  expect(await stored(page)).toEqual(before);
  await page.mouse.up();
  await expect(page.locator('.catalog-drag-preview')).toHaveCount(0);
  expect(await drinkOrder(page, destinationId)).toEqual(['wheel-drink']);
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(page.getByRole('button', { name: '편집', exact: true })).toBeVisible();
  await expect.poll(async () => (await stored(page)).customDrinks[0].categoryId).toBe(destinationId);
});

test('starting a drink drag after category reordering does not move unrelated drink surfaces', async ({ page }) => {
  await seed(page);
  await openEditor(page);
  await startMouseDrag(page, page.getByRole('button', { name: '차 카테고리 이름 변경', exact: true }), category(page, 'coffee'));
  await page.mouse.up();
  await expect.poll(() => categoryOrder(page)).toEqual(['tea', 'coffee', 'energy', 'other']);
  await expect(page.locator('.catalog-drag-preview')).toHaveCount(0);
  await page.locator('.catalog-editor-scroll').evaluate(async element => {
    await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => undefined)));
  });
  const before = await stored(page);
  const handle = page.getByRole('button', { name: '녹차 음료 편집', exact: true });
  await handle.scrollIntoViewIfNeeded();
  const start = (await handle.boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-layout-drink]')).filter(element => element.dataset.layoutDrink !== 'green-tea');
    const baseline = new Map(nodes.map(element => [element.dataset.layoutDrink!, element.firstElementChild!.getBoundingClientRect()]));
    Reflect.set(window, 'catalogVisualMovement', new Promise<Array<{ id: string; distance: number }>>(resolve => {
      const maximum = new Map<string, number>();
      let frames = 0;
      function sample() {
        for (const node of nodes) {
          const id = node.dataset.layoutDrink!;
          const initial = baseline.get(id)!;
          const current = node.firstElementChild!.getBoundingClientRect();
          maximum.set(id, Math.max(maximum.get(id) ?? 0, Math.hypot(current.x - initial.x, current.y - initial.y)));
        }
        if (++frames === 24) resolve(Array.from(maximum, ([id, distance]) => ({ id, distance })));
        else requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    }));
  });
  // Cross activation distance while remaining inside the original chip's placeholder.
  await page.mouse.move(start.x + start.width / 2 + 7, start.y + start.height / 2);
  await expect(page.locator('.catalog-drag-preview')).toBeVisible();
  expect(await drinkOrder(page, 'tea')).toEqual(['green-tea', 'earl-grey', 'oolong-tea']);
  const movements: Array<{ id: string; distance: number }> = await page.evaluate(() => Reflect.get(window, 'catalogVisualMovement'));
  expect(movements.filter(item => item.distance > 1)).toEqual([]);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  expect(await stored(page)).toEqual(before);
});

test('a delayed successful save holds the live drop position until persistence finishes', async ({ page }) => {
  await seed(page);
  await openEditor(page);
  const before = await stored(page);
  await deferNextWrite(page);
  await startMouseDrag(page, page.getByRole('button', { name: '카페라떼 음료 편집', exact: true }), drink(page, 'americano'));
  const wanted = ['caffe-latte', 'americano', 'cold-brew'];
  await expect.poll(() => drinkOrder(page, 'coffee')).toEqual(wanted);
  await page.mouse.up();
  await expect(page.locator('.catalog-drag-preview')).toHaveCount(0);
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(page.locator('.catalog-editor')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('.catalog-drag-preview')).toHaveCount(0);
  await expect(drink(page, 'caffe-latte')).toBeVisible();
  await expect(drink(page, 'caffe-latte')).toHaveCSS('opacity', '1');
  expect(await observeDrinkOrderWhilePaused(page, 'coffee')).toEqual(Array.from({ length: 20 }, () => wanted));
  expect(await stored(page)).toEqual(before);
  await page.evaluate(() => window.dispatchEvent(new Event('complete-catalog-save')));
  await expect(page.getByRole('button', { name: '편집', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '편집', exact: true }).click();
  await expect.poll(() => drinkOrder(page, 'coffee')).toEqual(wanted);
  await finishAndReload(page);
  expect(await drinkOrder(page, 'coffee')).toEqual(wanted);
});

test('touch dragging a drink card body into another category persists membership and insertion order', async ({ page }, testInfo) => {
  await seed(page);
  await openEditor(page);
  const before = await stored(page);
  const handle = page.getByRole('button', { name: '아메리카노 음료 편집', exact: true });
  await handle.scrollIntoViewIfNeeded();
  const start = (await handle.boundingBox())!;
  const end = (await drink(page, 'green-tea').boundingBox())!;
  const touch = await page.context().newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start.x + start.width / 2, y: start.y + start.height / 2 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: end.x + 8, y: end.y + end.height / 2 }] });
  await expect(page.locator('.catalog-drag-preview')).toBeVisible();
  await expect.poll(() => drinkOrder(page, 'coffee')).toEqual(['cold-brew', 'caffe-latte']);
  await expect.poll(() => drinkOrder(page, 'tea')).toEqual(['americano', 'green-tea', 'earl-grey', 'oolong-tea']);
  await expect(drink(page, 'americano')).toHaveCount(1);
  await expect(category(page, 'tea').locator('[data-layout-drink="americano"]')).toHaveCSS('visibility', 'hidden');
  await expect(page.locator('.catalog-drag-preview')).toContainText(/150\s*mg/);
  await expectOtherItemsUndimmed(page);
  expect(await stored(page)).toEqual(before);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-catalog-card-cross-category.png`, animations: 'disabled' });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await touch.detach();
  await expect.poll(() => drinkOrder(page, 'coffee')).toEqual(['cold-brew', 'caffe-latte']);
  await expect.poll(() => drinkOrder(page, 'tea')).toEqual(['americano', 'green-tea', 'earl-grey', 'oolong-tea']);
  await finishAndReload(page);
  expect(await drinkOrder(page, 'coffee')).toEqual(['cold-brew', 'caffe-latte']);
  expect(await drinkOrder(page, 'tea')).toEqual(['americano', 'green-tea', 'earl-grey', 'oolong-tea']);
  expect((await stored(page)).entries).toEqual([]);
});

test('card edge padding drags across category headings and leaves deletion available after drop', async ({ page }) => {
  await seed(page);
  await openEditor(page);
  const before = await stored(page);
  const source = (await drink(page, 'americano').locator('.catalog-drink-surface').boundingBox())!;
  const destination = (await category(page, 'tea').locator('[data-layout-heading]').boundingBox())!;
  await page.mouse.move(source.x + source.width / 2, source.y + source.height - 1);
  await page.mouse.down();
  await page.mouse.move(destination.x + destination.width / 2, destination.y + destination.height / 2, { steps: 12 });
  await expect(page.locator('.catalog-drag-preview')).toBeVisible();
  await expect.poll(() => drinkOrder(page, 'tea')).toEqual(['americano', 'green-tea', 'earl-grey', 'oolong-tea']);
  expect(await stored(page)).toEqual(before);
  await page.mouse.up();
  await expect(page.locator('.catalog-drag-preview')).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: '어떤 카페인을 마셨나요?', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '아메리카노 음료 삭제', exact: true }).click();
  await expect(page.getByRole('button', { name: '삭제하기', exact: true })).toBeVisible();
  await expect(page.locator('.catalog-drag-preview')).toHaveCount(0);
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await finishAndReload(page);
  expect(await drinkOrder(page, 'coffee')).toEqual(['cold-brew', 'caffe-latte']);
  expect(await drinkOrder(page, 'tea')).toEqual(['americano', 'green-tea', 'earl-grey', 'oolong-tea']);
});

test('category title bars reorder entire sections without changing their drink membership', async ({ page }) => {
  await seed(page);
  await openEditor(page);
  const before = await stored(page);
  await startMouseDrag(page, page.getByRole('button', { name: '차 카테고리 이름 변경', exact: true }), category(page, 'coffee'));
  await expect.poll(() => categoryOrder(page)).toEqual(['tea', 'coffee', 'energy', 'other']);
  const pausedOrders = await page.locator('.catalog-editor-scroll').evaluate(async element => {
    const samples: Array<Array<string | undefined>> = [];
    for (let frame = 0; frame < 20; frame++) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      samples.push(Array.from(element.querySelectorAll<HTMLElement>('[data-layout-category]')).map(item => item.dataset.layoutCategory));
    }
    return samples;
  });
  expect(pausedOrders).toEqual(Array.from({ length: 20 }, () => ['tea', 'coffee', 'energy', 'other']));
  await expectOtherItemsUndimmed(page);
  expect(await stored(page)).toEqual(before);
  await page.mouse.up();
  await expect.poll(() => categoryOrder(page)).toEqual(['tea', 'coffee', 'energy', 'other']);
  expect(await drinkOrder(page, 'coffee')).toEqual(['americano', 'cold-brew', 'caffe-latte']);
  expect(await drinkOrder(page, 'tea')).toEqual(['green-tea', 'earl-grey', 'oolong-tea']);
  await finishAndReload(page);
  expect(await categoryOrder(page)).toEqual(['tea', 'coffee', 'energy', 'other']);
});

test('touch dragging the category name moves its section and preserves title actions', async ({ page }) => {
  await seed(page);
  await openEditor(page);
  const before = await stored(page);
  const title = (await category(page, 'tea').getByRole('heading').boundingBox())!;
  const destination = (await category(page, 'coffee').getByRole('heading').boundingBox())!;
  const touch = await page.context().newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: title.x + 8, y: title.y + title.height / 2 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: destination.x + 8, y: destination.y + destination.height / 2 }] });
  await expect(page.locator('.catalog-drag-preview--category')).toBeVisible();
  await expect.poll(() => categoryOrder(page)).toEqual(['tea', 'coffee', 'energy', 'other']);
  await expectOtherItemsUndimmed(page);
  expect(await stored(page)).toEqual(before);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await touch.detach();
  await expect(page.locator('.catalog-drag-preview')).toHaveCount(0);
  await page.getByRole('button', { name: '차 카테고리 이름 변경', exact: true }).click();
  await expect(category(page, 'tea').getByLabel('카테고리 이름', { exact: true })).toBeVisible();
  await page.goBack();
  await finishAndReload(page);
  expect(await categoryOrder(page)).toEqual(['tea', 'coffee', 'energy', 'other']);
  expect(await drinkOrder(page, 'tea')).toEqual(['green-tea', 'earl-grey', 'oolong-tea']);
});

test('a normal touch swipe scrolls without changing the catalog layout', async ({ page }) => {
  const state = createInitialState();
  state.customCategories = Array.from({ length: 6 }, (_, index) => ({ id: `custom:swipe-${index}` as const, name: `스크롤 분류 ${index + 1}` }));
  await seed(page, state);
  await openEditor(page);
  const before = await stored(page);
  const scroll = page.locator('.catalog-editor-scroll');
  const bounds = (await scroll.boundingBox())!;
  const touch = await page.context().newCDPSession(page);
  // Swipe in the padding, outside the delete controls that overlap badge corners.
  const x = bounds.x + bounds.width - 8;
  const y = bounds.y + bounds.height * .8;
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let step = 1; step <= 6; step++) {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - bounds.height * .5 * step / 6 }] });
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => scroll.evaluate(element => element.scrollTop)).toBeGreaterThan(30);
  await expect(page.locator('.catalog-drag-preview')).toHaveCount(0);
  expect(await stored(page)).toEqual(before);
  await touch.detach();
});

test('touch cancellation and Escape restore the original layout after live reordering', async ({ page }) => {
  await seed(page);
  await openEditor(page);
  const before = await stored(page);
  const touch = await page.context().newCDPSession(page);
  const handle = page.getByRole('button', { name: '카페라떼 음료 편집', exact: true });
  await handle.scrollIntoViewIfNeeded();
  const start = (await handle.boundingBox())!;
  const end = (await drink(page, 'americano').boundingBox())!;
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start.x + start.width / 2, y: start.y + start.height / 2 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: end.x + 8, y: end.y + end.height / 2 }] });
  await expect(page.locator('.catalog-drag-preview')).toBeVisible();
  await expect.poll(() => drinkOrder(page, 'coffee')).toEqual(['caffe-latte', 'americano', 'cold-brew']);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await touch.detach();
  await expect(page.locator('.catalog-drag-preview')).toHaveCount(0);
  expect(await drinkOrder(page, 'coffee')).toEqual(['americano', 'cold-brew', 'caffe-latte']);
  expect(await stored(page)).toEqual(before);
  await startMouseDrag(page, handle, drink(page, 'americano'));
  await expect.poll(() => drinkOrder(page, 'coffee')).toEqual(['caffe-latte', 'americano', 'cold-brew']);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(page.getByRole('dialog', { name: '어떤 카페인을 마셨나요?', exact: true })).toBeVisible();
  await expect(page.locator('.catalog-drag-preview')).toHaveCount(0);
  expect(await drinkOrder(page, 'coffee')).toEqual(['americano', 'cold-brew', 'caffe-latte']);
  expect(await stored(page)).toEqual(before);
});

test('direct drink deletion returns to editing and preserves recorded intake across reload', async ({ page }, testInfo) => {
  const state = createInitialState();
  state.entries = [{ id: 'recorded-americano', drinkId: 'americano', drinkName: '아메리카노', caffeineMg: 150, icon: 'coffee', sourceType: 'sample', consumedAt: '2026-10-05T09:00:00+09:00' }];
  await seed(page, state);
  await openEditor(page);
  const listScrollTop = await page.locator('.catalog-editor-scroll').evaluate(element => element.scrollTop);
  await page.getByRole('button', { name: '아메리카노 음료 삭제', exact: true }).click();
  const confirmation = page.getByRole('alertdialog', { name: '아메리카노 음료를 삭제할까요?', exact: true });
  await expect(confirmation).toBeVisible();
  await expect(confirmation.getByRole('button', { name: '취소', exact: true })).toBeFocused();
  const bounds = (await confirmation.boundingBox())!;
  expect(bounds.height).toBeLessThan(page.viewportSize()!.height / 2);
  expect(Math.abs(bounds.y + bounds.height / 2 - page.viewportSize()!.height / 2)).toBeLessThan(2);
  expect(await page.locator('.catalog-editor-scroll').evaluate(element => element.scrollTop)).toBe(listScrollTop);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-catalog-delete-dialog.png`, animations: 'disabled' });
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await expect(drink(page, 'americano')).toBeVisible();
  await expect(confirmation).toHaveCount(0);
  expect(await page.locator('.catalog-editor-scroll').evaluate(element => element.scrollTop)).toBe(listScrollTop);
  expect(await stored(page)).toEqual(state);
  await page.getByRole('button', { name: '아메리카노 음료 삭제', exact: true }).click();
  await page.getByRole('button', { name: '삭제하기', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '어떤 카페인을 마셨나요?', exact: true })).toBeVisible();
  await expect(drink(page, 'americano')).toHaveCount(0);
  expect((await stored(page)).entries).toEqual(state.entries);
  await finishAndReload(page);
  await expect(drink(page, 'americano')).toHaveCount(0);
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(page.getByRole('button', { name: '편집', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
  await expect(page.locator('.history-entry')).toContainText('아메리카노');
  await expect(page.getByTestId('daily-total')).toHaveText('150');
});

test('the category minus opens a modal and deletes an empty category with retry and cancellation', async ({ page }, testInfo) => {
  const state = createInitialState();
  state.customCategories = [{ id: 'custom:empty', name: '빈 분류' }];
  await seed(page, state);
  await openEditor(page);
  await expect(page.getByRole('button', { name: '커피 카테고리 편집', exact: true })).toHaveCount(0);
  const remove = page.getByRole('button', { name: '빈 분류 카테고리 삭제', exact: true });
  await remove.scrollIntoViewIfNeeded();
  const scrollTop = await page.locator('.catalog-editor-scroll').evaluate(element => element.scrollTop);
  await remove.click();
  const confirmation = page.getByRole('alertdialog', { name: '카테고리 삭제', exact: true });
  await expect(confirmation).toBeVisible();
  await expect(confirmation.getByRole('button', { name: '취소', exact: true })).toBeFocused();
  const bounds = (await confirmation.boundingBox())!;
  expect(bounds.height).toBeLessThan(page.viewportSize()!.height / 2);
  expect(Math.abs(bounds.y + bounds.height / 2 - page.viewportSize()!.height / 2)).toBeLessThan(2);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-catalog-category-delete.png`, animations: 'disabled' });
  await page.keyboard.press('Escape');
  await expect(confirmation).toHaveCount(0);
  await expect(remove).toBeFocused();
  expect(await page.locator('.catalog-editor-scroll').evaluate(element => element.scrollTop)).toBe(scrollTop);
  expect(await stored(page)).toEqual(state);
  await remove.click();
  await page.goBack();
  await expect(confirmation).toHaveCount(0);
  await expect(page.getByRole('button', { name: '완료', exact: true })).toBeVisible();
  await remove.click();
  await failNextWrite(page);
  await confirmation.getByRole('button', { name: '카테고리 삭제', exact: true }).click();
  await expect(confirmation).toHaveCount(0);
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert').first()).toBeVisible();
  expect(await stored(page)).toEqual(state);
  await expect(category(page, 'custom:empty')).toHaveCount(0);
  await finishAndReload(page);
  await expect(category(page, 'custom:empty')).toHaveCount(0);
});

test('the category minus moves its drinks before deleting and preserves intake history', async ({ page }, testInfo) => {
  const state = createInitialState();
  state.entries = [{ id: 'recorded-americano', drinkId: 'americano', drinkName: '아메리카노', caffeineMg: 150, icon: 'coffee', sourceType: 'sample', consumedAt: '2026-10-05T09:00:00+09:00' }];
  await seed(page, state);
  await openEditor(page);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-catalog-category-minus.png`, animations: 'disabled' });
  await page.getByRole('button', { name: '커피 카테고리 삭제', exact: true }).click();
  const confirmation = page.getByRole('alertdialog', { name: '카테고리 삭제', exact: true });
  await expect(confirmation).toBeVisible();
  const confirm = confirmation.getByRole('button', { name: '음료 이동 후 삭제', exact: true });
  await expect(confirm).toBeDisabled();
  await confirmation.getByLabel('음료를 이동할 카테고리', { exact: true }).selectOption('tea');
  await confirm.click();
  await expect(category(page, 'coffee')).toHaveCount(0);
  await expect(category(page, 'tea').getByRole('button', { name: '아메리카노 음료 편집', exact: true })).toBeVisible();
  expect((await stored(page)).entries).toEqual(state.entries);
  await finishAndReload(page);
  await expect(category(page, 'coffee')).toHaveCount(0);
  await expect(drink(page, 'americano').locator('xpath=ancestor::section[1]')).toHaveAttribute('data-layout-category', 'tea');
  expect((await stored(page)).entries).toEqual(state.entries);
});

test('delete confirmation closes only itself on Escape or back and allows retry after a failed write', async ({ page }) => {
  await seed(page);
  await openEditor(page);
  const before = await stored(page);
  const remove = page.getByRole('button', { name: '아메리카노 음료 삭제', exact: true });
  const confirmation = page.getByRole('alertdialog', { name: '아메리카노 음료를 삭제할까요?', exact: true });
  await remove.click();
  await confirmation.press('Escape');
  await expect(confirmation).toHaveCount(0);
  await expect(page.getByRole('button', { name: '완료', exact: true })).toBeVisible();
  await remove.click();
  await page.goBack();
  await expect(confirmation).toHaveCount(0);
  await expect(remove).toBeVisible();
  expect(await stored(page)).toEqual(before);
  await remove.click();
  await failNextWrite(page);
  await confirmation.getByRole('button', { name: '삭제하기', exact: true }).click();
  await expect(confirmation).toHaveCount(0);
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert').first()).toBeVisible();
  expect(await stored(page)).toEqual(before);
  await expect(confirmation).toHaveCount(0);
  await expect(drink(page, 'americano')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '완료', exact: true })).toBeVisible();
});

test('adding a category and drink returns to editing without recording an intake', async ({ page }) => {
  await seed(page);
  await openEditor(page);
  await page.getByRole('button', { name: '카테고리 추가', exact: true }).click();
  await page.getByLabel('카테고리 이름', { exact: true }).fill('작업실 음료');
  await page.getByRole('button', { name: '추가', exact: true }).click();
  await expect(page.getByRole('button', { name: '작업실 음료 카테고리 이름 변경', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '작업실 음료에 내 음료 추가', exact: true }).click();
  await page.getByLabel('메뉴명', { exact: true }).fill('오후 디카페인');
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await page.getByLabel('카페인량 mg', { exact: true }).fill('15');
  await page.getByRole('button', { name: '음료 저장', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '어떤 카페인을 마셨나요?', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '오후 디카페인 음료 편집', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '기록 저장', exact: true })).toHaveCount(0);
  expect((await stored(page)).entries).toEqual([]);
  await finishAndReload(page);
  const addedCategory = page.locator('[data-layout-category]').filter({ has: page.getByRole('button', { name: '작업실 음료 카테고리 이름 변경', exact: true }) });
  await expect(addedCategory.getByRole('button', { name: '오후 디카페인 음료 편집', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('button', { name: '편집', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect((await stored(page)).entries).toEqual([]);
});

test('failed layout writes retain the saved arrangement and allow retry', async ({ page }) => {
  await seed(page);
  await openEditor(page);
  const before = await stored(page);
  await failNextWrite(page);
  await startMouseDrag(page, page.getByRole('button', { name: '카페라떼 음료 편집', exact: true }), drink(page, 'americano'));
  await expect.poll(() => drinkOrder(page, 'coffee')).toEqual(['caffe-latte', 'americano', 'cold-brew']);
  await page.mouse.up();
  await expect(page.locator('.catalog-drag-preview')).toHaveCount(0);
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert').first()).toBeVisible();
  expect(await drinkOrder(page, 'coffee')).toEqual(['caffe-latte', 'americano', 'cold-brew']);
  expect(await stored(page)).toEqual(before);
  await expect.poll(() => drinkOrder(page, 'coffee')).toEqual(['caffe-latte', 'americano', 'cold-brew']);
  await finishAndReload(page);
  expect(await drinkOrder(page, 'coffee')).toEqual(['caffe-latte', 'americano', 'cold-brew']);
});

test('tapping a category edits its name inline with validation, cancellation and retry', async ({ page }, testInfo) => {
  await seed(page);
  await openEditor(page);
  const before = await stored(page);
  await page.getByRole('button', { name: '커피 카테고리 이름 변경', exact: true }).click();
  const field = category(page, 'coffee').getByLabel('카테고리 이름', { exact: true });
  await expect(field).toBeVisible();
  await expect(field).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await field.fill('차');
  await page.getByRole('button', { name: '카테고리 이름 저장', exact: true }).click();
  await expect(category(page, 'coffee').getByRole('alert')).toContainText('이미');
  await field.fill('내 커피');
  await page.screenshot({ path: `test-results/${testInfo.project.name}-catalog-inline-rename.png`, animations: 'disabled' });
  await failNextWrite(page);
  await page.getByRole('button', { name: '카테고리 이름 저장', exact: true }).click();
  await expect(page.getByRole('button', { name: '내 커피 카테고리 이름 변경', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert').first()).toBeVisible();
  expect(await stored(page)).toEqual(before);
  await expect(page.getByRole('button', { name: '내 커피 카테고리 이름 변경', exact: true })).toBeVisible();
  expect(await drinkOrder(page, 'coffee')).toEqual(['americano', 'cold-brew', 'caffe-latte']);
  await page.getByRole('button', { name: '내 커피 카테고리 이름 변경', exact: true }).click();
  await field.fill('취소할 이름');
  await page.keyboard.press('Escape');
  await expect(field).toHaveCount(0);
  await expect(page.getByRole('button', { name: '완료', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '내 커피 카테고리 이름 변경', exact: true }).click();
  await field.fill('뒤로가기로 취소');
  await page.goBack();
  await expect(field).toHaveCount(0);
  await expect(page.getByRole('button', { name: '내 커피 카테고리 이름 변경', exact: true })).toBeVisible();
  await finishAndReload(page);
  await expect(page.getByRole('button', { name: '내 커피 카테고리 이름 변경', exact: true })).toBeVisible();
});

test('tapping a drink edits icon name and caffeine together and applies them to future records', async ({ page }, testInfo) => {
  const state = createInitialState();
  state.entries = [{ id: 'old', drinkId: 'americano', drinkName: '아메리카노', caffeineMg: 150, icon: 'coffee', sourceType: 'sample', consumedAt: '2026-10-05T09:00:00+09:00' }];
  await seed(page, state);
  await openEditor(page);
  await page.getByRole('button', { name: '아메리카노 음료 편집', exact: true }).click();
  const editor = page.getByRole('dialog', { name: '음료 수정', exact: true });
  await expect(editor).toBeVisible();
  await expect(editor.getByLabel('메뉴명', { exact: true })).toHaveValue('아메리카노');
  await expect(editor.getByLabel('카페인량 mg', { exact: true })).toHaveValue('150');
  await expect(editor.getByRole('button', { name: '커피잔', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(editor.getByLabel('옮길 카테고리', { exact: true })).toHaveCount(0);
  await editor.getByRole('button', { name: '차', exact: true }).click();
  await editor.getByLabel('메뉴명', { exact: true }).fill('내 아메리카노');
  await editor.getByLabel('카페인량 mg', { exact: true }).fill('75');
  await page.screenshot({ path: `test-results/${testInfo.project.name}-catalog-drink-edit.png`, animations: 'disabled' });
  await editor.getByRole('button', { name: '변경 저장', exact: true }).click();
  await expect(page.getByRole('button', { name: '내 아메리카노 음료 편집', exact: true })).toBeVisible();
  expect((await stored(page)).entries).toEqual(state.entries);
  await finishAndReload(page);
  await page.getByRole('button', { name: '내 아메리카노 음료 편집', exact: true }).click();
  await expect(editor.getByLabel('카페인량 mg', { exact: true })).toHaveValue('75');
  await expect(editor.getByRole('button', { name: '차', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await editor.getByRole('button', { name: '취소', exact: true }).click();
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await page.getByRole('button', { name: /내 아메리카노\s*75\s*mg/ }).click();
  await expect(page.getByText('수정한 기본값 · 355ml', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  const entries = (await stored(page)).entries;
  expect(entries[0]).toEqual(state.entries[0]);
  expect(entries[1]).toMatchObject({ drinkId: 'americano', drinkName: '내 아메리카노', caffeineMg: 75, icon: 'tea', sourceType: 'custom' });
});

test('drink edits retain the draft on failure and leave the saved drink unchanged on cancel', async ({ page }) => {
  await seed(page);
  await openEditor(page);
  const before = await stored(page);
  await page.getByRole('button', { name: '아메리카노 음료 편집', exact: true }).click();
  const editor = page.getByRole('dialog', { name: '음료 수정', exact: true });
  await expect(editor).toBeVisible();
  const name = editor.getByLabel('메뉴명', { exact: true });
  const amount = editor.getByLabel('카페인량 mg', { exact: true });
  await name.fill('');
  await editor.getByRole('button', { name: '변경 저장', exact: true }).click();
  await expect(name).toBeFocused();
  await name.fill('새 커피');
  await amount.fill('501');
  await editor.getByRole('button', { name: '변경 저장', exact: true }).click();
  await expect(amount).toBeFocused();
  await amount.fill('95');
  await failNextWrite(page);
  await editor.getByRole('button', { name: '변경 저장', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert').first()).toBeVisible();
  expect(await stored(page)).toEqual(before);
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await expect(page.getByRole('button', { name: '아메리카노 음료 편집', exact: true })).toBeVisible();
  expect(await stored(page)).toEqual(before);
});

test('editing a custom drink preserves its photo until a different icon is selected', async ({ page }) => {
  const photo = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#f3a6b8';
    context.fillRect(0, 0, 16, 16);
    return canvas.toDataURL('image/jpeg');
  });
  const state = createInitialState();
  state.customDrinks = [{ id: 'photo-coffee', categoryId: 'coffee', name: '사진 커피', caffeineMg: 67, icon: 'cup', isCustom: true, sourceType: 'custom', photoDataUrl: photo }];
  await seed(page, state);
  await openEditor(page);
  await page.getByRole('button', { name: '사진 커피 음료 편집', exact: true }).click();
  const editor = page.getByRole('dialog', { name: '음료 수정', exact: true });
  await expect(editor.getByRole('button', { name: '앨범 사진 변경', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await editor.getByLabel('메뉴명', { exact: true }).fill('내 사진 커피');
  await editor.getByLabel('카페인량 mg', { exact: true }).fill('80');
  await editor.getByRole('button', { name: '변경 저장', exact: true }).click();
  await expect(page.getByRole('button', { name: '내 사진 커피 음료 편집', exact: true }).locator('img')).toHaveAttribute('src', photo);
  expect((await stored(page)).customDrinks[0].name).toBe('사진 커피');
  await page.getByRole('button', { name: '내 사진 커피 음료 편집', exact: true }).click();
  await editor.getByRole('button', { name: '차', exact: true }).click();
  await editor.getByRole('button', { name: '변경 저장', exact: true }).click();
  await expect(page.getByRole('button', { name: '내 사진 커피 음료 편집', exact: true }).locator('img')).toHaveCount(0);
  await finishAndReload(page);
  const drink = (await stored(page)).customDrinks[0];
  expect(drink).toMatchObject({ id: 'photo-coffee', categoryId: 'coffee', name: '내 사진 커피', caffeineMg: 80, icon: 'tea', isCustom: true });
  expect(drink).not.toHaveProperty('photoDataUrl');
});
