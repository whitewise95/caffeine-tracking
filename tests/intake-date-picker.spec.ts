import { expect, test } from '@playwright/test'

test('tapping any date field immediately opens its native picker without a field border', async ({ page }, info) => {
  await page.clock.setFixedTime(new Date('2026-10-14T12:00:00+09:00'))
  await page.addInitScript(() => {
    const original = HTMLInputElement.prototype.showPicker
    HTMLInputElement.prototype.showPicker = function () {
      original.call(this)
      this.dataset.pickerOpened = String(Number(this.dataset.pickerOpened || '0') + 1)
    }
  })
  await page.goto('/')
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click()
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click()
  const checkDate = async (name: string) => {
    const date = page.getByLabel(name, { exact: true })
    const originalValue = await date.inputValue()
    await date.click({ position: { x: 12, y: 40 } })
    await expect(date).toHaveAttribute('data-picker-opened', '1')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(date).toHaveValue(originalValue)
    await expect(date).toHaveCSS('border-width', '0px')
    await expect(date).toHaveCSS('outline-style', 'none')
    await expect(date.locator('..').locator('.intake-period-field-label')).toHaveCSS('text-decoration-line', 'underline')
  }
  await checkDate('마신 날짜')
  const instantDate = page.getByLabel('마신 날짜', { exact: true })
  await instantDate.press('Enter')
  await expect(instantDate).toHaveAttribute('data-picker-opened', '2')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: '천천히 마시기', exact: true }).click()
  await checkDate('마시기 시작한 날짜')
  await checkDate('마신 마지막 날짜')
  await page.getByText('마신 시간', { exact: true }).click()
  await page.screenshot({ path: info.outputPath('date-time-no-field-border.png') })
  await page.getByRole('button', { name: '기록 저장', exact: true }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click()
  await page.getByRole('button', { name: '아메리카노 기록 수정', exact: true }).click()
  await checkDate('마시기 시작한 날짜')
  await checkDate('마신 마지막 날짜')
})

for (const fallback of ['missing', 'blocked']) {
  test(`date remains editable when the programmatic native picker is ${fallback}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(mode => {
      Object.defineProperty(HTMLInputElement.prototype, 'showPicker', {
        configurable: true,
        value: mode === 'missing' ? undefined : function () { throw new DOMException('Picker unavailable', 'SecurityError') },
      })
    }, fallback)
    await page.goto('/')
    await page.getByRole('button', { name: '카페인 추가', exact: true }).click()
    await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click()
    const date = page.getByLabel('마신 날짜', { exact: true })
    await date.click({ position: { x: 12, y: 40 } })
    await date.fill('2026-10-12')
    await expect(date).toHaveValue('2026-10-12')
    expect(errors).toEqual([])
  })
}
