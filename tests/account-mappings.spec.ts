import { test, expect, type Page } from '@playwright/test';

const rows = (page: Page) => page.locator('.am-grid tbody tr');
const chip = (page: Page, name: string, n: number) => page.getByRole('button', { name: new RegExp(`^${name}\\s*${n}$`) });
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Account comparison' });

test.beforeEach(async ({ page }) => {
  await page.goto('/candidates/001234/accounts');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('grid shows six accounts with consistent chip counts and totals', async ({ page }) => {
  await expect(rows(page)).toHaveCount(6);
  await expect(chip(page, 'All', 6)).toBeVisible();
  await expect(chip(page, 'Ready', 2)).toBeVisible();
  await expect(chip(page, 'Review', 2)).toBeVisible();
  await expect(chip(page, 'Blocked', 1)).toBeVisible();
  await expect(chip(page, 'Unmapped', 1)).toBeVisible();
  await expect(chip(page, 'Approved', 0)).toBeVisible();
  await expect(page.getByText('$3,250,000')).toBeVisible();
  await chip(page, 'Review', 2).click();
  await expect(rows(page)).toHaveCount(2);
  await expect(page.getByText('$1,130,000')).toBeVisible();
});

test('filters are collapsed by default and narrow chips and status bar together', async ({ page }) => {
  await expect(page.locator('#am-adv')).toHaveCount(0);
  await page.getByRole('button', { name: /Filters/ }).click();
  await page.getByLabel('Source custodian').selectOption('Schwab');
  await expect(rows(page)).toHaveCount(2);
  await expect(chip(page, 'All', 2)).toBeVisible();
  await expect(chip(page, 'Review', 0)).toBeVisible();
  await expect(page.getByText('$645,000')).toBeVisible();
  await page.getByLabel('Search mapped accounts').fill('nomatch');
  await expect(page.getByText('No accounts match')).toBeVisible();
});

test('comparison opens as a modal over the grid, traps focus, and restores it on Escape', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Review account 7710', exact: true });
  await trigger.click();
  await expect(dialog(page)).toBeVisible();
  await expect(rows(page).first()).toBeVisible();
  await expect(dialog(page).getByText('Patel household').first()).toBeVisible();
  await expect(dialog(page).getByText('Why this match')).toBeVisible();
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role=dialog]'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  await expect(trigger).toBeFocused();
  await page.getByRole('button', { name: 'Chen family trust' }).click();
  await expect(dialog(page)).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(dialog(page)).toBeHidden();
  await page.getByRole('button', { name: 'Review account 4821', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Close account comparison' }).click();
  await expect(dialog(page)).toBeHidden();
  await page.getByRole('button', { name: 'Review account 4821', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog(page)).toBeHidden();
});

test('unknown benefits stay unknown and unsupported items are labelled', async ({ page }) => {
  await page.getByRole('button', { name: 'Review account 7710', exact: true }).click();
  const cmp = dialog(page).locator('.am-cmp');
  await expect(cmp.getByRole('row', { name: /Cash sweep/ }).getByText('Unknown')).toBeVisible();
  await expect(cmp.getByRole('row', { name: /Options permissions/ }).getByText('Action needed')).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Review account 6502', exact: true }).click();
  await expect(dialog(page).locator('.am-cmp').getByRole('row', { name: /Proprietary/ }).getByText('Not supported')).toBeVisible();
});

test('auto-match maps the unmapped account, keeps counts consistent, and persists', async ({ page }) => {
  await page.getByRole('button', { name: 'Run auto-match' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Auto-match suggested 1 mapping' })).toBeVisible();
  await expect(chip(page, 'Unmapped', 0)).toBeVisible();
  await expect(chip(page, 'Review', 3)).toBeVisible();
  await expect(chip(page, 'Ready', 2)).toBeVisible();
  await page.reload();
  await expect(chip(page, 'Review', 3)).toBeVisible();
  await page.getByRole('button', { name: 'Run auto-match' }).click();
  await expect(page.getByText('Auto-match found nothing new')).toBeVisible();
});

test('approval requires resolved gaps and a note; review accounts can be resolved by a reviewer', async ({ page }) => {
  await page.getByRole('button', { name: 'Review account 1934', exact: true }).click();
  await dialog(page).getByRole('tab', { name: /Evidence/ }).click();
  const approve = dialog(page).getByRole('button', { name: 'Approve mapping (mock)' });
  await expect(approve).toBeDisabled();
  await dialog(page).getByLabel(/Review note/).fill('Reviewed IRA registration and requirements.');
  await expect(approve).toBeEnabled();
  await approve.click();
  await expect(dialog(page)).toBeHidden();
  await expect(chip(page, 'Approved', 1)).toBeVisible();
  await expect(chip(page, 'Ready', 1)).toBeVisible();
  await page.reload();
  await expect(chip(page, 'Approved', 1)).toBeVisible();

  await page.getByRole('button', { name: 'Review account 7710', exact: true }).click();
  await dialog(page).getByRole('tab', { name: /Evidence/ }).click();
  await dialog(page).getByLabel(/Review note/).fill('Checked.');
  await expect(approve).toBeDisabled();
  for (const box of await dialog(page).locator('.am-actions input').all()) await box.check();
  await expect(approve).toBeEnabled();
});

test('blocked accounts can never be approved', async ({ page }) => {
  await page.getByRole('button', { name: 'Review account 6502', exact: true }).click();
  await dialog(page).getByRole('tab', { name: /Evidence/ }).click();
  await dialog(page).getByLabel(/Review note/).fill('Trying anyway.');
  await expect(dialog(page).getByRole('button', { name: 'Approve mapping (mock)' })).toBeDisabled();
});

test('pre-registration dropdown navigates to account mappings and background verification', async ({ page }) => {
  await page.goto('/candidates/001234');
  await page.getByLabel('Pre-Registration options').click();
  await page.getByRole('link', { name: 'Account mappings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Account mappings', exact: true })).toBeVisible();
  await expect(page.getByText('Mock data')).toBeVisible();
  await page.getByRole('link', { name: /Michael/ }).first().click();
  await page.getByLabel('Pre-Registration options').click();
  await page.getByRole('link', { name: 'Background verification', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Background verification', exact: true })).toBeVisible();
});
