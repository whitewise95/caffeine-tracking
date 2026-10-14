import { expect, test, type Locator, type Page } from '@playwright/test'
import { createInitialState } from '../src/features/caffeine/model/caffeine'

async function clippedRingEdges(control: Locator) {
  return control.evaluate(element => {
    const style = getComputedStyle(element)
    if (style.outlineStyle === 'none') return []
    const outside = Math.max(0, parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset))
    const box = element.getBoundingClientRect()
    const clipped: string[] = []
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      const css = getComputedStyle(parent)
      const rect = parent.getBoundingClientRect()
      const left = rect.left + parent.clientLeft
      const top = rect.top + parent.clientTop
      if (/auto|scroll|hidden|clip/.test(css.overflowX)) {
        if (box.left - outside < left - .75) clipped.push(`${parent.className}: left (${box.left - outside} < ${left}, offset ${style.outlineOffset})`)
        if (box.right + outside > left + parent.clientWidth + .75) clipped.push(`${parent.className}: right (${box.right + outside} > ${left + parent.clientWidth}, offset ${style.outlineOffset})`)
      }
      if (/auto|scroll|hidden|clip/.test(css.overflowY)) {
        if (box.top - outside < top - .75) clipped.push(`${parent.className}: top`)
        if (box.bottom + outside > top + parent.clientHeight + .75) clipped.push(`${parent.className}: bottom`)
      }
      // Native modal dialogs paint in the top layer, outside ancestor clipping.
      if (parent.matches('dialog:modal')) break
    }
    return clipped
  })
}

async function auditFocus(page: Page, root: Locator) {
  await page.keyboard.press('Tab')
  // Wheel options transfer focus to their spinbutton and are excluded from Tab.
  const controls = root.locator('button:enabled:not([tabindex="-1"]), input:enabled:not([tabindex="-1"]), select:enabled, textarea:enabled, summary, a[href], [tabindex="0"]')
  for (const control of await controls.all()) {
    if (!await control.isVisible()) continue
    await control.scrollIntoViewIfNeeded()
    await control.focus()
    await expect(control).toBeFocused()
    if (await control.evaluate(element => element.matches('.intake-period-field'))) {
      await expect(control.locator('..').locator('.intake-period-field-label')).toHaveCSS('text-decoration-line', 'underline')
    }
    const name = await control.evaluate(element => element.getAttribute('aria-label') || element.textContent?.trim() || element.tagName)
    const clipped = await clippedRingEdges(control)
    if (clipped.length) await page.screenshot({ path: test.info().outputPath('focus-clipped.png') })
    const diagnostics = clipped.length ? await control.evaluate(element => {
      const css = getComputedStyle(element)
      return { outline: css.outline, offset: css.outlineOffset, token: css.getPropertyValue('--focus-ring-offset'), focusVisible: element.matches(':focus-visible'), box: element.getBoundingClientRect().toJSON() }
    }) : undefined
    expect(clipped, `${name}: focus ring clipped ${JSON.stringify(diagnostics)}`).toEqual([])
  }
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.setFixedTime(new Date('2026-10-14T12:00:00+09:00'))
  const initial = createInitialState()
  initial.entries = [{ id: 'focus-record', drinkId: 'americano', drinkName: '아메리카노', icon: 'coffee', caffeineMg: 150, consumedAt: '2026-10-14T02:00:00Z' }]
  await page.addInitScript(state => {
    if (!localStorage.getItem('caffeine-tracker:state:v1')) localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state))
  }, initial)
})

test('date and time labels preserve borderless keyboard focus at the recording scroll boundaries', async ({ page }, info) => {
  test.setTimeout(60_000)
  await page.goto('/')
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click()
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click()
  await auditFocus(page, page.getByRole('dialog'))
  await page.getByRole('button', { name: '천천히 마시기', exact: true }).click()
  await page.keyboard.press('Tab')
  const date = page.getByLabel('마시기 시작한 날짜', { exact: true })
  await date.focus()
  await expect(date).toBeFocused()
  await expect(date).toHaveCSS('outline-style', 'none')
  await expect(date.locator('..').locator('.intake-period-field-label')).toHaveCSS('text-decoration-line', 'underline')
  expect(await clippedRingEdges(date)).toEqual([])
  await page.screenshot({ path: info.outputPath('date-focus.png') })
  await auditFocus(page, page.getByRole('dialog'))
  await page.getByRole('button', { name: '마시기 시작한 시각', exact: true }).click()
  await auditFocus(page, page.getByRole('dialog'))
  await page.getByRole('button', { name: '완료', exact: true }).click()
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
  await auditFocus(page, page.getByRole('dialog'))
  await page.goto('/history')
  await page.getByRole('button', { name: '아메리카노 기록 수정', exact: true }).click()
  await auditFocus(page, page.getByRole('dialog'))
})

test('page controls and selected calendar rings fit their clipping ancestors', async ({ page }) => {
  test.setTimeout(60_000)
  for (const route of ['/', '/history', '/insights', '/knowledge', '/settings']) {
    await page.goto(route)
    for (const summary of await page.locator('main details > summary').all()) await summary.click()
    await auditFocus(page, page.getByRole('main'))
    for (const cell of await page.locator('button[aria-pressed="true"] > .record-calendar-cell').all()) {
      await cell.scrollIntoViewIfNeeded()
      expect(await clippedRingEdges(cell)).toEqual([])
    }
  }
  await auditFocus(page, page.getByRole('navigation'))
})

test('catalog badges, inline names and deletion buttons retain complete focus rings', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click()
  await auditFocus(page, page.getByRole('dialog'))
  await page.getByRole('button', { name: '편집', exact: true }).click()
  await auditFocus(page, page.getByRole('dialog'))
  await page.getByRole('button', { name: '커피 카테고리 이름 변경', exact: true }).click()
  await auditFocus(page, page.getByRole('dialog'))
  await page.getByRole('button', { name: '카테고리 이름 변경 취소', exact: true }).click()
  await page.getByRole('button', { name: '카테고리 추가', exact: true }).click()
  await auditFocus(page, page.getByRole('dialog').last())
  await page.getByRole('dialog').last().getByRole('button', { name: '취소', exact: true }).click()
  await page.getByRole('button', { name: '아메리카노 음료 편집', exact: true }).click()
  await auditFocus(page, page.getByRole('dialog').last())
  await page.getByRole('dialog').last().getByRole('button', { name: '취소', exact: true }).click()
  await page.getByRole('button', { name: '아메리카노 음료 삭제', exact: true }).click()
  await auditFocus(page, page.getByRole('alertdialog'))
})
