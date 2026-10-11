import { expect, test, type Locator } from '@playwright/test';
import { installTossHost } from './helpers/tossHost';

async function expectHeader(dialog: Locator, backLabel?: string) {
  const header = dialog.locator(':scope > .sheet-header');
  await expect(header.getByRole('button')).toHaveCount(1);
  await expect(header.getByRole('button', { name: backLabel ?? '닫기', exact: true })).toBeVisible();
}

test('root sheets show close while every drink and time step shows only back', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  const sheet = page.locator('.sheet-dialog--add');
  await expectHeader(sheet);
  await page.getByRole('button', { name: '커피에 내 음료 추가', exact: true }).click();
  await expectHeader(sheet, '음료 목록으로 돌아가기');
  await page.getByLabel('메뉴명', { exact: true }).fill('나의 커피');
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await expectHeader(sheet, '아이콘과 메뉴명으로 돌아가기');
  await page.keyboard.press('Escape');
  await expectHeader(sheet, '음료 목록으로 돌아가기');
  await expect(page.getByLabel('메뉴명', { exact: true })).toHaveValue('나의 커피');
  await page.keyboard.press('Escape');
  await expectHeader(sheet);
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  await expectHeader(sheet, '음료 목록으로 돌아가기');
  await page.getByRole('switch', { name: '천천히 마셨어요' }).check();
  await page.getByRole('button', { name: '마시기 시작한 시각', exact: true }).click();
  await expectHeader(sheet, '기록 화면으로 돌아가기');
  await page.keyboard.press('Escape');
  await expectHeader(sheet, '음료 목록으로 돌아가기');
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await expect(sheet).toHaveCount(0);
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
  await page.getByRole('button', { name: '아메리카노 기록 수정', exact: true }).click();
  const edit = page.locator('.sheet-dialog--edit');
  await expectHeader(edit);
  await page.getByRole('button', { name: '마신 마지막 시각', exact: true }).click();
  await expectHeader(edit, '기록 화면으로 돌아가기');
  await page.keyboard.press('Escape');
  await expectHeader(edit);
  await edit.getByRole('button', { name: '닫기', exact: true }).click();
  await page.getByRole('button', { name: '아메리카노 기록 삭제', exact: true }).click();
  await expectHeader(page.getByRole('dialog'));
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await page.goto('/settings');
  await page.getByRole('button', { name: '모든 데이터 초기화', exact: true }).click();
  await expectHeader(page.getByRole('dialog'));
});

for (const back of ['header', 'browser', 'native', 'escape', 'backdrop'] as const) {
  test(`category child steps return one level and preserve the draft with ${back}`, async ({ page }) => {
    if (back === 'native') await installTossHost(page);
    await page.goto('/settings');
    await page.getByRole('button', { name: '카테고리 관리', exact: true }).click();
    const parent = page.locator('.sheet-dialog--add');
    await expectHeader(parent);
    await page.getByRole('button', { name: '커피 카테고리 관리', exact: true }).click();
    const child = page.locator('.category-action-sheet');
    await expectHeader(child, '카테고리 목록으로 돌아가기');
    await page.getByLabel('카테고리 이름', { exact: true }).fill('작성 중인 이름');
    await page.getByRole('button', { name: '삭제', exact: true }).click();
    await expectHeader(child, '카테고리 수정으로 돌아가기');
    if (back === 'header') await page.getByRole('button', { name: '카테고리 수정으로 돌아가기', exact: true }).click();
    else if (back === 'browser') await page.goBack();
    else if (back === 'native') await page.evaluate(() => (Reflect.get(window, 'testNativeBack') as () => void)());
    else if (back === 'backdrop') await page.mouse.click(4, 4);
    else await page.keyboard.press('Escape');
    await expectHeader(child, '카테고리 목록으로 돌아가기');
    await expect(page.getByLabel('카테고리 이름', { exact: true })).toHaveValue('작성 중인 이름');
    await page.getByRole('button', { name: '카테고리 목록으로 돌아가기', exact: true }).click();
    await expect(child).toHaveCount(0);
    await expectHeader(parent);
    await page.getByRole('button', { name: '카테고리 추가', exact: true }).click();
    await expectHeader(child, '카테고리 목록으로 돌아가기');
    await page.getByLabel('카테고리 이름', { exact: true }).fill('취소할 새 카테고리');
    await page.getByRole('button', { name: '카테고리 목록으로 돌아가기', exact: true }).click();
    await expect(child).toHaveCount(0);
    await expect(page.getByRole('button', { name: '취소할 새 카테고리 카테고리 관리', exact: true })).toHaveCount(0);
    await parent.getByRole('button', { name: '닫기', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
}
