import { expect, test } from '@playwright/test'

test('switches through every MIRAGE state without console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })

  await page.goto('/')
  await expect(page.locator('body')).toBeVisible()

  for (const key of ['1', '2', '3', '4', '5', '6', '7', '8']) {
    await page.keyboard.press(key)
    await page.waitForTimeout(150)
  }

  expect(errors).toEqual([])
})
