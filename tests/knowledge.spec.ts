import { expect, test } from '@playwright/test';

const questions = [
  '반감기가 뭐예요?',
  '커피를 마시면 바로 전부 흡수되나요?',
  '여러 잔을 마시면 마지막 잔부터 계산하나요?',
  '한 잔을 천천히 마시면 계산이 달라지나요?',
  '사람마다 반감기가 다른가요?',
  '저녁에 마신 카페인이 잠에도 영향을 주나요?',
  '디카페인에도 카페인이 있나요?',
  '같은 커피인데 카페인량이 왜 달라요?',
];

test('knowledge tab follows navigation, direct routes, reload and back', async ({ page }) => {
  await page.goto('/settings');
  const nav = page.getByRole('navigation', { name: '주요 메뉴' });
  await expect(nav.getByRole('button')).toHaveText(['홈', '기록', '지식', '설정']);
  await nav.getByRole('button', { name: '지식', exact: true }).tap();
  await expect(page).toHaveURL(/\/knowledge$/);
  await expect(page.getByRole('heading', { name: '지식', exact: true })).toBeVisible();
  await expect(nav.getByRole('button', { name: '지식', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page).toHaveTitle('카페인 지식 · 카페인');
  await page.goBack();
  await expect(page.getByRole('heading', { name: '설정', exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { name: '지식', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: '지식', exact: true })).toBeVisible();
  await nav.getByRole('button', { name: '기록', exact: true }).tap();
  await expect(page).toHaveURL(/\/history$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/knowledge$/);
  await page.goto('/knowledge/');
  await expect(page.getByRole('heading', { name: '지식', exact: true })).toBeVisible();
  await nav.getByRole('button', { name: '홈', exact: true }).tap();
  await expect(page.getByRole('button', { name: '카페인 추가', exact: true })).toBeVisible();
});

test('FAQ answers and sources expand by touch or keyboard and retain research limits', async ({ page }) => {
  await page.goto('/knowledge');
  const faqs = page.locator('.knowledge-faq');
  await expect(faqs).toHaveCount(8);
  await expect(page.locator('.knowledge-faq[open]')).toHaveCount(0);
  const firstQuestion = page.getByText(questions[0], { exact: true });
  await firstQuestion.tap();
  await expect(faqs.first()).toHaveAttribute('open', '');
  await expect(faqs.first()).toContainText('100mg');
  await expect(faqs.first()).toContainText('50mg');
  await expect(faqs.first()).toContainText('4시간 30분');
  await expect(faqs.first()).not.toContainText('5시간');
  await expect(faqs.first()).toContainText('2~8시간');
  await expect(faqs.first()).toContainText('카페인 트래커에서는');
  await expect(faqs.first().getByRole('link', { name: /EFSA/ })).toHaveAttribute('href', 'https://www.efsa.europa.eu/sites/default/files/corporate_publications/files/efsaexplainscaffeine150527.pdf');
  const summary = faqs.first().locator('summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(faqs.first()).not.toHaveAttribute('open');
  await page.keyboard.press('Space');
  await expect(faqs.first()).toHaveAttribute('open', '');
  await page.keyboard.press('Tab');
  await expect(faqs.first().getByRole('link').first()).toBeFocused();
  for (const question of questions.slice(1)) await page.getByText(question, { exact: true }).tap();
  await expect(page.locator('.knowledge-faq[open]')).toHaveCount(8);
  await expect(faqs.nth(1)).toContainText('34명');
  await expect(faqs.nth(2)).toContainText('따로 계산해 더해요');
  await expect(faqs.nth(3)).toContainText('가정');
  await expect(faqs.nth(4)).toContainText('141편');
  await expect(faqs.nth(5)).toContainText('400mg');
  await expect(faqs.nth(5)).toContainText('특정 양');
  await expect(faqs.nth(6)).toContainText('2006년');
  await expect(faqs.nth(6)).toContainText('모든 커피');
  await expect(faqs.nth(7)).toContainText('67mg');
  const expectedSources = [
    'https://www.efsa.europa.eu/sites/default/files/corporate_publications/files/efsaexplainscaffeine150527.pdf',
    'https://pubmed.ncbi.nlm.nih.gov/14674790/',
    'https://pubmed.ncbi.nlm.nih.gov/19125908/',
    'https://pubmed.ncbi.nlm.nih.gov/19125908/',
    'https://pubmed.ncbi.nlm.nih.gov/35280254/',
    'https://pubmed.ncbi.nlm.nih.gov/24235903/',
    'https://pubmed.ncbi.nlm.nih.gov/17132260/',
    'https://www.efsa.europa.eu/en/topics/topic/caffeine',
  ];
  for (let index = 0; index < expectedSources.length; index++) {
    const source = faqs.nth(index).getByRole('link').first();
    await expect(source).toHaveAttribute('href', expectedSources[index]);
    await expect(source).toHaveAttribute('target', '_blank');
    await expect(source).toHaveAttribute('rel', /noreferrer/);
  }
});

test('bundled FAQ remains readable offline without fetching content', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation')).toBeVisible();
  await context.setOffline(true);
  const requests: string[] = [];
  page.on('request', request => {
    // Chrome may ask for the app icon after a History API navigation.
    // Track every other request to detect remote answers or route loading.
    if (new URL(request.url()).pathname !== '/favicon.svg') requests.push(request.url());
  });
  await page.getByRole('navigation').getByRole('button', { name: '지식', exact: true }).tap();
  for (const question of questions) await page.getByText(question, { exact: true }).tap();
  await expect(page.locator('.knowledge-faq[open]')).toHaveCount(8);
  expect(requests).toEqual([]);
});

for (const theme of ['dark', 'light']) {
  test(`knowledge FAQ is readable with enlarged text and reduced motion in ${theme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/knowledge${theme === 'light' ? '?theme=light' : ''}`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await page.screenshot({ path: `test-results/${testInfo.project.name}-knowledge-${theme}.png`, fullPage: true });
    await page.getByText(questions[0], { exact: true }).tap();
    await page.screenshot({ path: `test-results/${testInfo.project.name}-knowledge-answer-${theme}.png`, fullPage: true });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    for (const question of questions.slice(1)) await page.getByText(question, { exact: true }).tap();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const controls = page.locator('.knowledge-faq summary, .knowledge-faq a, .bottom-nav button');
    for (const control of await controls.all()) {
      const bounds = await control.boundingBox();
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
    }
    const lastSource = page.locator('.knowledge-faq').last().getByRole('link').last();
    await lastSource.focus();
    await expect(lastSource).toBeInViewport();
    const sourceBounds = await lastSource.boundingBox();
    const navBounds = await page.getByRole('navigation').boundingBox();
    expect(sourceBounds!.y + sourceBounds!.height).toBeLessThanOrEqual(navBounds!.y);
    await page.screenshot({ path: `test-results/${testInfo.project.name}-knowledge-enlarged-${theme}.png`, fullPage: true });
  });
}
