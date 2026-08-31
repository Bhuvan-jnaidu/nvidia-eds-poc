/**
 * Input Shell Block Tests — NVIDIA Contact Page EDS POC
 * =====================================================
 *
 * Validates the Kaizen-backed Input Shell block:
 *  - block decorates and reaches data-block-status="loaded"
 *  - renders a labelled input with the authored placeholder
 *  - typing a value then clicking the dismiss button clears the input
 *
 * NOTE: requires the KUI bundle to include InputShell. Run `npm run build:kui`
 * once after pulling these changes so the bundle exports InputShell /
 * InputDismissButton, otherwise the block import will fail at runtime.
 *
 * Run only this suite:  npx playwright test input-shell
 */

import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3001';

async function waitForBlocksLoaded(page) {
  await page.waitForFunction(() => {
    const blocks = [...document.querySelectorAll('[data-block-name]')];
    return blocks.length > 0 && blocks.every((b) => b.dataset.blockStatus === 'loaded');
  }, { timeout: 15000 });
}

test.describe('Input Shell Block', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await waitForBlocksLoaded(page);
  });

  test('CSS responds 200: /blocks/input-shell/input-shell.css', async ({ request }) => {
    const resp = await request.get(`${BASE}/blocks/input-shell/input-shell.css`);
    expect(resp.status()).toBe(200);
  });

  test('input-shell block is decorated and loaded', async ({ page }) => {
    const block = page.locator('.input-shell.block');
    await expect(block).toHaveCount(1);
    await expect(block).toHaveAttribute('data-block-status', 'loaded');
  });

  test('renders a labelled input with the authored placeholder', async ({ page }) => {
    const input = page.locator('.input-shell.block input');
    await expect(input).toHaveCount(1);
    await expect(input).toHaveAttribute('placeholder', 'you@example.com');
    await expect(input).toHaveAttribute('type', 'email');
    await expect(page.locator('.input-shell.block label')).toContainText('Email address');
  });

  test('typing then clicking the dismiss button clears the value', async ({ page }) => {
    const input = page.locator('.input-shell.block input');
    const dismiss = page.locator('.input-shell.block button');

    await input.fill('test@nvidia.com');
    await expect(input).toHaveValue('test@nvidia.com');

    await dismiss.click();
    await expect(input).toHaveValue('');
  });
});
