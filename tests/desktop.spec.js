import { test, expect } from '@playwright/test';

test('wide screens dock the sheet beside the list', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto('/#/third/hanumanasana/modifications');
  const sheet = page.locator('#sheet');
  await expect(sheet).toBeVisible();
  const box = await sheet.boundingBox();
  expect(box.x).toBeGreaterThan(800);
  // The list stays usable while the panel is open.
  const first = page.locator('.section[data-section="third-series"] .pose').first();
  await first.locator('.pose-row').click();
  await expect(first).toHaveClass(/is-open/);
});
