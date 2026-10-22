import { test as base, expect } from '@playwright/test';

// Every test also fails on uncaught errors or console errors.
const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
    await use(page);
    expect(errors).toEqual([]);
  }
});

test('home shows the four series', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('.series-card');
  await expect(cards).toHaveCount(4);
  await expect(cards.locator('.card-title')).toContainText([
    'Primary Series',
    'Intermediate Series',
    'Third Series',
    'Fourth Series'
  ]);
});

test('opens a series and returns with the back button', async ({ page }) => {
  await page.goto('/');
  await page.locator('a[data-series="intermediate"]').click();
  await expect(page).toHaveURL(/#\/intermediate$/);
  await expect(page.locator('.topbar h1')).toHaveText('Intermediate Series');
  await expect(page.locator('.pose-sk', { hasText: 'Kapotasana A' })).toBeAttached();

  await page.locator('.back-btn').click();
  await expect(page).toHaveURL(/\/(#\/)?$/);
  await expect(page.locator('.series-card')).toHaveCount(4);
});

test('search filters by partial Sanskrit or English name', async ({ page }) => {
  await page.goto('/#/primary');
  const search = page.getByRole('searchbox', { name: 'Search postures' });
  const visible = page.locator('.pose:not([hidden]) .pose-sk');

  await search.fill('supta kurma');
  await expect(visible).toHaveText(['Supta Kurmasana']);

  await search.fill('trikona');
  await expect(visible).toHaveText(['Utthita Trikonasana', 'Parivrtta Trikonasana']);

  await search.fill('tortoise');
  await expect(visible).toHaveText(['Kurmasana', 'Supta Kurmasana']);
  await expect(page.locator('.pose:not([hidden]) mark').first()).toHaveText('Tortoise');

  await search.fill('zzz');
  await expect(visible).toHaveCount(0);
  await expect(page.locator('.empty')).toHaveText('No postures match “zzz”');

  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(search).toHaveValue('');
  await expect(page.locator('.empty')).toBeHidden();
});

test('search reaches postures in collapsed shared sections', async ({ page }) => {
  await page.goto('/#/third');
  const standing = page.locator('.section[data-section="standing"]');
  await expect(standing).toHaveClass(/is-collapsed/);
  await page.getByRole('searchbox').fill('parsvottana');
  await expect(standing.locator('.pose:not([hidden]) .pose-sk')).toBeVisible();
});

test('expanding a posture shows its vinyasa count', async ({ page }) => {
  await page.goto('/#/primary');
  const row = page.locator('.pose', { has: page.locator('.pose-sk', { hasText: /^Paschimottanasana$/ }) }).first();
  await row.locator('.pose-row').click();
  await expect(row.locator('.pose-row')).toHaveAttribute('aria-expanded', 'true');
  await expect(row.locator('.meta')).toContainText('Vinyasas16');
  await expect(row.locator('.meta')).toContainText('State9');
  await expect(row.locator('.step.is-state .step-n')).toHaveText(['9']);

  // Grouped steps expand to show each vinyasa.
  const group = row.locator('.step-group-toggle').first();
  await group.click();
  await expect(row.locator('.steps.is-nested').first().locator('.step')).toHaveCount(6);
});

test('a sub-posture shows its place in the parent count', async ({ page }) => {
  await page.goto('/#/primary');
  const row = page.locator('.pose', { has: page.locator('.pose-sk', { hasText: /^Supta Kurmasana$/ }) });
  await expect(row.locator('.pill')).toContainText('8');
  await row.locator('.pose-row').click();
  await expect(row.locator('.detail-lead')).toContainText('Kurmasana');
  await expect(row.locator('.step.is-focus .step-n')).toHaveText(['8']);
});

test('reference sheet: tabs, video link, pager and back gesture', async ({ page }) => {
  await page.goto('/#/primary');
  const row = page.locator('.pose', { has: page.locator('.pose-sk', { hasText: /^Navasana$/ }) });
  await row.locator('.pose-row').click();
  await row.getByRole('button', { name: 'Alignment' }).click();

  const sheet = page.locator('#sheet');
  await expect(sheet).toBeVisible();
  await expect(page).toHaveURL(/#\/primary\/navasana\/alignment$/);
  await expect(sheet.getByRole('heading', { level: 2 })).toHaveText('Navasana');
  await expect(sheet.getByRole('tab', { name: 'Alignment' })).toHaveAttribute('aria-selected', 'true');
  await expect(sheet.locator('.drishti')).toContainText('Padhayoragrai');

  await sheet.getByRole('tab', { name: 'Modifications' }).click();
  await expect(page).toHaveURL(/#\/primary\/navasana\/modifications$/);
  await expect(sheet.locator('.cue-list li').first()).toContainText('Bend the knees');

  await sheet.getByRole('tab', { name: 'Photo' }).click();
  await expect(sheet.locator('.photo')).toContainText('Photo coming soon');

  const video = sheet.getByRole('link', { name: /Kino MacGregor/ });
  await expect(video).toHaveAttribute('href', /youtube\.com\/results\?search_query=Kino%20MacGregor%20Navasana/);
  await expect(video).toHaveAttribute('target', '_blank');

  await sheet.getByRole('button', { name: /Next/ }).click();
  await expect(sheet.getByRole('heading', { level: 2 })).toHaveText('Bhujapidasana');
  await expect(page).toHaveURL(/#\/primary\/bhujapidasana\/photo$/);

  // The phone back gesture closes the sheet without leaving the series.
  await page.goBack();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/#\/primary$/);
});

test('close button and Escape both dismiss the sheet', async ({ page }) => {
  await page.goto('/#/intermediate/pasasana/alignment');
  const sheet = page.locator('#sheet');
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Close' }).click();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/#\/intermediate$/);

  await page.goto('/#/intermediate/pasasana/photo');
  await expect(sheet).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
});

test('deep link opens the sheet and expands the row', async ({ page }) => {
  await page.goto('/#/fourth/kandasana/alignment');
  await expect(page.locator('#sheet h2')).toHaveText('Kandasana');
  await expect(page.locator('.pose.is-open .pose-sk')).toHaveText('Kandasana');
});

test('about sheet opens from home', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'About this app' }).click();
  await expect(page.locator('#sheet h2')).toHaveText('How to use this guide');
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/\/(#\/)?$/);
});

for (const id of ['primary', 'intermediate', 'third', 'fourth']) {
  test(`every ${id} posture expands without errors`, async ({ page }) => {
    await page.goto(`/#/${id}`);
    const rows = page.locator('.pose-row');
    const count = await rows.count();
    expect(count).toBeGreaterThan(20);
    for (let i = 0; i < count; i++) {
      await rows.nth(i).evaluate((el) => el.click());
    }
    await expect(page.locator('.pose-panel-inner .detail')).toHaveCount(count);
  });
}
