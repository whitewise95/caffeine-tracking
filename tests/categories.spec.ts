import { expect, test } from '@playwright/test';

test('typing a new category after an existing name preserves spaces and the draft across management', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: '커피에 내 음료 추가' }).click();
  const category = page.getByLabel('카테고리', { exact: true });
  await category.fill('커피');
  await category.press('End');
  await category.pressSequentially(' 모음');
  await expect(category).toHaveValue('커피 모음');
  await page.getByRole('button', { name: '카테고리 관리', exact: true }).click();
  await page.goBack();
  await expect(category).toHaveValue('커피 모음');
});

test('custom categories persist and whitespace-equivalent names reuse the same section', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: '커피에 내 음료 추가' }).click();
  await page.getByLabel('카테고리', { exact: true }).fill('단백질 쉐이크');
  await page.getByLabel('메뉴명').fill('초코 쉐이크');
  await page.getByLabel('카페인량 mg', { exact: true }).fill('67');
  await page.getByRole('button', { name: '음료 저장', exact: true }).click();
  await expect(page.getByRole('heading', { name: '초코 쉐이크', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '음료 목록으로 돌아가기' }).click();
  const category = page.locator('.sheet-category').filter({ has: page.getByRole('heading', { name: '단백질 쉐이크', exact: true }) });
  await expect(category).toHaveCount(1);
  await expect(category.getByRole('button', { name: /초코 쉐이크\s*67\s*mg/ })).toBeVisible();
  await page.getByRole('button', { name: '차에 내 음료 추가' }).click();
  await page.getByLabel('카테고리', { exact: true }).fill(' 단 백 질쉐 이크 ');
  await page.getByLabel('메뉴명').fill('커피 쉐이크');
  await page.getByLabel('카페인량 mg', { exact: true }).fill('80');
  await page.getByRole('button', { name: '음료 저장', exact: true }).click();
  await expect(page.getByRole('heading', { name: '커피 쉐이크', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await expect(category).toHaveCount(1);
  await expect(category.locator('.drink-badge:not(.drink-badge-add)')).toHaveCount(2);
  await category.getByRole('button', { name: '단백질 쉐이크에 내 음료 추가' }).click();
  await expect(page.getByLabel('카테고리', { exact: true })).toHaveValue('단백질 쉐이크');
  await page.screenshot({ path: `test-results/${testInfo.project.name}-category-composer.png` });
});

test('blank categories are rejected and whitespace variants of built-in categories do not create duplicates', async ({ page }) => {
  await page.goto('/?theme=light');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: '차에 내 음료 추가' }).click();
  await page.getByLabel('카테고리', { exact: true }).fill('   ');
  await page.getByLabel('메뉴명').fill('나의 커피');
  await page.getByLabel('카페인량 mg', { exact: true }).fill('40');
  await page.getByRole('button', { name: '음료 저장', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('카테고리');
  await expect(page.getByLabel('카테고리', { exact: true })).toBeFocused();
  await page.getByLabel('카테고리', { exact: true }).fill(' 커 피 ');
  await page.getByRole('button', { name: '음료 저장', exact: true }).click();
  await expect(page.getByRole('heading', { name: '나의 커피', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '음료 목록으로 돌아가기' }).click();
  await expect(page.locator('.sheet-category')).toHaveCount(4);
  await expect(page.locator('.sheet-category').filter({ has: page.getByRole('heading', { name: '커피', exact: true }) })).toContainText('나의 커피');
});

for (const theme of ['', '?theme=light']) {
  test(`category input and suggestions work with 200% text ${theme || 'dark'}`, async ({ page }, testInfo) => {
    await page.goto(`/${theme}`);
    await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
    await page.getByRole('button', { name: '차에 내 음료 추가' }).click();
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await page.getByRole('group', { name: '기존 카테고리' }).getByRole('button', { name: '커피', exact: true }).click();
    await expect(page.getByLabel('카테고리', { exact: true })).toHaveValue('커피');
    await page.getByLabel('카테고리', { exact: true }).fill('아주긴카테고리이름도화면밖으로넘어가지않아요');
    await page.getByLabel('메뉴명').fill('내 음료');
    await page.getByLabel('카페인량 mg', { exact: true }).fill('67');
    await page.getByRole('button', { name: '음료 저장', exact: true }).click();
    await expect(page.getByRole('heading', { name: '내 음료', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '음료 목록으로 돌아가기' }).click();
    await page.getByRole('button', { name: '아주긴카테고리이름도화면밖으로넘어가지않아요에 내 음료 추가' }).click();
    await expect(page.getByLabel('카테고리', { exact: true })).toHaveValue('아주긴카테고리이름도화면밖으로넘어가지않아요');
    await page.screenshot({ path: `test-results/${testInfo.project.name}-category-zoom-${theme ? 'light' : 'dark'}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const scroll = page.locator('.sheet-step--compose .sheet-scroll');
    expect(await scroll.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  });
}

test('a failed write creates neither a category nor a drink and retry succeeds once', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: '커피에 내 음료 추가' }).click();
  await page.getByLabel('카테고리', { exact: true }).fill('운동 음료');
  await page.getByLabel('메뉴명').fill('내 부스터');
  await page.getByLabel('카페인량 mg', { exact: true }).fill('80');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      Storage.prototype.setItem = original;
      throw new DOMException(`Cannot store ${key} (${value.length})`, 'QuotaExceededError');
    };
  });
  await page.getByRole('button', { name: '음료 저장', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert').first()).toContainText('저장');
  expect(await page.evaluate(() => localStorage.getItem('caffeine-tracker:state:v1'))).toBeNull();
  await page.getByRole('button', { name: '음료 저장', exact: true }).click();
  await expect(page.getByRole('heading', { name: '내 부스터', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '음료 목록으로 돌아가기' }).click();
  const category = page.locator('.sheet-category').filter({ has: page.getByRole('heading', { name: '운동 음료', exact: true }) });
  await expect(category).toHaveCount(1);
  await expect(category.locator('.drink-badge:not(.drink-badge-add)')).toHaveCount(1);
});
