import { expect, test } from "@playwright/test"

test.use({
  permissions: ["camera", "microphone"],
  launchOptions: {
    executablePath: process.env.MIRAGE_CHROMIUM_PATH,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  },
})

test("media, navigation, and listening aura smoke test", async ({ page }) => {
  const errors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })

  await page.goto("/")
  await expect(page.locator("body")).toBeVisible()
  await page.getByRole("button", { name: "Vision" }).click()
  await page.getByRole("button", { name: "Allow camera" }).click()
  await expect(page.locator("video")).toBeVisible()
  await expect
    .poll(() => page.locator("video").evaluate((video) => video.videoWidth))
    .toBeGreaterThan(0)
  await page.getByRole("button", { name: "Talk" }).click()

  for (const key of ["1", "2", "3", "4", "5", "6", "7", "8"]) {
    await page.keyboard.press(key)
    await expect(page.locator("nav")).toBeVisible()
    expect(
      await page
        .locator("nav")
        .evaluate((node) => Number.parseFloat(getComputedStyle(node).opacity)),
    ).toBeGreaterThanOrEqual(0.3)
  }

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport)
    await page.keyboard.press("2")
    await expect(page.getByTestId("listening-orb-container")).toBeVisible()
  }

  expect(errors).toEqual([])
})

test.describe("listening orb round-trip regression", () => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    test(`remains circular after 15 returns at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await page.goto("/")
      await page.keyboard.press("2")
      const orb = page.getByTestId("listening-orb-container")
      await expect(orb).toBeVisible()
      await page.waitForTimeout(1000)
      const firstBox = await orb.boundingBox()
      expect(firstBox).not.toBeNull()
      expect(
        Math.abs((firstBox?.width ?? 0) - (firstBox?.height ?? 0)),
      ).toBeLessThanOrEqual(1)
      const firstMetrics = await page.evaluate(() =>
        window.__mirageMetrics?.(),
      )

      for (let cycle = 0; cycle < 15; cycle += 1) {
        for (const key of ["3", "7", "8", "1", "2"]) {
          await page.keyboard.press(key)
          await page.waitForTimeout(400)
        }
        await expect(orb).toBeVisible()
        await page.waitForTimeout(400)
        const box = await orb.boundingBox()
        expect(
          Math.abs((box?.width ?? 0) - (box?.height ?? 0)),
        ).toBeLessThanOrEqual(1)
      }

      const lastMetrics = await page.evaluate(() =>
        window.__mirageMetrics?.(),
      )
      expect(lastMetrics).toEqual(firstMetrics)
    })
  }
})
