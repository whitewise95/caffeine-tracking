import { expect, test, type Page } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';

async function openComposer(page: Page, suffix = '') {
  await page.clock.install({ time: new Date('2026-10-04T10:00:00+09:00') });
  await page.addInitScript(state => {
    if (!localStorage.getItem('caffeine-tracker:state:v1')) localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state));
  }, createInitialState());
  await page.goto(`/${suffix}`);
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: '커피에 내 음료 추가', exact: true }).click();
}

async function photoFixture(page: Page) {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#f3a6b8';
    context.fillRect(0, 0, 1200, 800);
    context.fillStyle = '#12151a';
    context.fillRect(400, 200, 400, 400);
    return canvas.toDataURL('image/png');
  });
  return { name: 'my-drink.png', mimeType: 'image/png', buffer: Buffer.from(dataUrl.split(',')[1], 'base64') };
}

for (const hasPhoto of [false, true]) {
  test(`cancelling the album keeps the composer and draft ${hasPhoto ? 'with an existing photo' : 'without a photo'}`, async ({ page }) => {
    await openComposer(page);
    const input = page.locator('input[type=file]');
    if (hasPhoto) {
      await input.setInputFiles(await photoFixture(page));
      await expect(page.getByRole('button', { name: '앨범 사진 변경', exact: true })).toHaveAttribute('aria-pressed', 'true');
    }
    await page.getByLabel('카테고리', { exact: true }).fill('내 차');
    await page.getByLabel('메뉴명', { exact: true }).fill('작성 중인 음료');
    await page.getByLabel('카페인량 mg', { exact: true }).fill('67');
    const originalPhoto = hasPhoto ? await page.locator('.sheet-photo-option img').getAttribute('src') : null;
    const route = await page.evaluate(() => window.history.state);
    // Browsers emit this bubbling, non-cancelable input event for Cancel,
    // Escape/back in the picker, and re-selecting the same file.
    await input.dispatchEvent('cancel', { bubbles: true, cancelable: false });
    expect(await page.evaluate(() => window.history.state)).toEqual(route);
    await expect(page.getByRole('dialog', { name: '내 음료 추가' })).toBeVisible();
    await expect(page.getByLabel('카테고리', { exact: true })).toHaveValue('내 차');
    await expect(page.getByLabel('메뉴명', { exact: true })).toHaveValue('작성 중인 음료');
    await expect(page.getByLabel('카페인량 mg', { exact: true })).toHaveValue('67');
    if (hasPhoto) await expect(page.locator('.sheet-photo-option img')).toHaveAttribute('src', originalPhoto!);
    else await expect(page.getByRole('button', { name: '커피잔', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: '음료 저장', exact: true })).toBeEnabled();
    await expect(page.getByRole('alert')).toHaveCount(0);
    // Actual sheet back and dismissal still work after cancelling a picker.
    await page.getByRole('button', { name: '음료 목록으로 돌아가기', exact: true }).click();
    await expect(page.getByRole('dialog', { name: '어떤 카페인을 마셨나요?' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('button', { name: '카페인 추가', exact: true })).toBeVisible();
  });
}

test('compressed album photo and exact slider dose persist across reload and appear in the journal', async ({ page }) => {
  await openComposer(page);
  const categories = page.getByRole('group', { name: '기존 카테고리' });
  for (const name of ['커피', '차', '에너지음료', '탄산']) await expect(categories.getByRole('button', { name, exact: true })).toBeVisible();
  await expect(categories.getByRole('button', { name: '기타', exact: true })).toHaveCount(0);
  await categories.getByRole('button', { name: '커피', exact: true }).click();
  const fixture = await photoFixture(page);
  await expect(page.getByRole('button', { name: '앨범 사진 추가', exact: true })).toBeVisible({ timeout: 1500 });
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: '앨범 사진 추가', exact: true }).click();
  await (await chooserPromise).setFiles(fixture);
  await expect(page.getByRole('button', { name: '앨범 사진 변경', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('메뉴명', { exact: true }).fill('사진 커피');
  await page.getByLabel('카페인량 mg', { exact: true }).fill('67');
  const slider = page.getByRole('slider', { name: '카페인량 조절', exact: true });
  await expect(slider).toHaveValue('67');
  await slider.focus();
  await slider.press('ArrowRight');
  await expect(page.getByLabel('카페인량 mg', { exact: true })).toHaveValue('68');
  await slider.press('ArrowLeft');
  await page.getByRole('button', { name: '음료 저장', exact: true }).click();
  const photo = page.locator('.quick-adjust-icon img');
  await expect(photo).toBeVisible();
  const src = (await photo.getAttribute('src'))!;
  expect(src).toMatch(/^data:image\/jpeg;base64,/);
  expect(src.length).toBeLessThan(48_000);
  expect(await photo.evaluate((image: HTMLImageElement) => Math.max(image.naturalWidth, image.naturalHeight))).toBeLessThanOrEqual(160);
  await page.getByRole('button', { name: '지금 기록', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!));
  expect(state.customDrinks[0]).toMatchObject({ categoryId: 'coffee', caffeineMg: 67, photoDataUrl: src });
  expect(state.entries[0]).not.toHaveProperty('photoDataUrl');
  await page.reload();
  await page.getByRole('button', { name: '아직 남아 있는 카페인 보기', exact: true }).click();
  await expect(page.locator('.remaining-drink-icon img')).toHaveAttribute('src', src);
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
  await expect(page.locator('.drink-icon-container img')).toHaveAttribute('src', src);
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await expect(page.getByRole('button', { name: /사진 커피\s*67\s*mg/ }).locator('img')).toHaveAttribute('src', src);
});

test('failed photo replacement preserves the selection and a built-in icon can replace it', async ({ page }) => {
  await openComposer(page);
  const input = page.locator('input[type=file]');
  await input.setInputFiles(await photoFixture(page));
  const selected = page.getByRole('button', { name: '앨범 사진 변경', exact: true });
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  const original = await selected.locator('img').getAttribute('src');
  await input.setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('not a photo') });
  await expect(page.getByRole('alert')).toHaveText('사진을 읽지 못했어요. 다른 사진을 선택해 주세요.');
  await expect(selected.locator('img')).toHaveAttribute('src', original!);
  await page.getByRole('button', { name: '커피잔', exact: true }).click();
  await expect(page.getByRole('button', { name: '앨범 사진 추가', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.getByLabel('메뉴명', { exact: true }).fill('아이콘 커피');
  await page.getByLabel('카페인량 mg', { exact: true }).fill('67');
  await page.getByRole('button', { name: '음료 저장', exact: true }).click();
  await expect(page.locator('.quick-adjust-icon img')).toHaveCount(0);
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!));
  expect(state.customDrinks[0]).not.toHaveProperty('photoDataUrl');
  expect(state.customDrinks[0].icon).toBe('coffee');
});

test('a storage failure keeps the compressed photo available for retry without saving a partial drink', async ({ page }) => {
  await openComposer(page);
  await page.locator('input[type=file]').setInputFiles(await photoFixture(page));
  await expect(page.getByRole('button', { name: '앨범 사진 변경', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('메뉴명', { exact: true }).fill('저장 재시도 커피');
  await page.getByLabel('카페인량 mg', { exact: true }).fill('67');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      Storage.prototype.setItem = original;
      if (key === 'caffeine-tracker:state:v1') throw new DOMException('full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.getByRole('button', { name: '음료 저장', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert').first()).toContainText('저장하지 못했어요');
  await expect(page.getByRole('button', { name: '앨범 사진 변경', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!).customDrinks)).toHaveLength(0);
  await page.getByRole('button', { name: '음료 저장', exact: true }).click();
  await expect(page.locator('.quick-adjust-icon img')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!).customDrinks)).toHaveLength(1);
});

for (const theme of ['', '?theme=light']) {
  test(`photo and range controls are usable with 200% text ${theme || 'dark'}`, async ({ page }, testInfo) => {
    await openComposer(page, theme);
    await page.locator('input[type=file]').setInputFiles(await photoFixture(page));
    await expect(page.getByRole('button', { name: '앨범 사진 변경', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('group', { name: '기존 카테고리' }).getByRole('button', { name: '에너지음료', exact: true }).click();
    await page.getByLabel('메뉴명', { exact: true }).fill('나의 음료');
    await page.getByLabel('카페인량 mg', { exact: true }).fill('67');
    await page.screenshot({ path: `test-results/${testInfo.project.name}-photo-composer-${theme ? 'light' : 'dark'}.png` });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    const slider = page.getByRole('slider', { name: '카페인량 조절', exact: true });
    await slider.scrollIntoViewIfNeeded();
    const box = (await slider.boundingBox())!;
    await page.touchscreen.tap(box.x + box.width * .5, box.y + box.height / 2);
    const amount = page.getByLabel('카페인량 mg', { exact: true });
    expect(Number(await amount.inputValue())).toBeGreaterThan(400);
    expect(Number(await amount.inputValue())).toBeLessThan(600);
    await amount.fill('67');
    await expect(slider).toHaveValue('67');
    const save = page.getByRole('button', { name: '음료 저장', exact: true });
    await save.scrollIntoViewIfNeeded();
    await expect(save).toBeInViewport();
    expect(await page.getByRole('dialog').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/${testInfo.project.name}-photo-composer-zoom-${theme ? 'light' : 'dark'}.png` });
    await save.click();
    await expect(page.getByRole('heading', { name: '나의 음료', exact: true })).toBeVisible();
  });
}
