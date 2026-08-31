/**
 * Accordion Block Tests — NVIDIA Contact Page EDS POC
 * ===================================================
 *
 * Validates the Kaizen-backed Accordion block:
 *  - block decorates and reaches data-block-status="loaded"
 *  - one trigger renders per authored item, with the authored label
 *  - clicking a trigger expands its panel; clicking again collapses it
 *  - single-open behaviour (opening one collapses the previously open one)
 *
 * The KUI Accordion renders each item as a native <details>/<summary>, so
 * "expanded" is asserted via the [open] attribute on the <details> element.
 *
 * Run only this suite:  npx playwright test accordion
 */

import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3001';

async function waitForBlocksLoaded(page) {
  await page.waitForFunction(() => {
    const blocks = [...document.querySelectorAll('[data-block-name]')];
    return blocks.length > 0 && blocks.every((b) => b.dataset.blockStatus === 'loaded');
  }, { timeout: 15000 });
}

test.describe('Accordion Block', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await waitForBlocksLoaded(page);
  });

  test('CSS responds 200: /blocks/accordion/accordion.css', async ({ request }) => {
    const resp = await request.get(`${BASE}/blocks/accordion/accordion.css`);
    expect(resp.status()).toBe(200);
  });

  test('accordion block is decorated and loaded', async ({ page }) => {
    const block = page.locator('.accordion.block');
    await expect(block).toHaveCount(1);
    await expect(block).toHaveAttribute('data-block-status', 'loaded');
  });

  test('renders one trigger per authored item with correct labels', async ({ page }) => {
    const triggers = page.locator('.accordion.block summary');
    await expect(triggers).toHaveCount(4);
    await expect(triggers.first()).toContainText('How do I get technical support');
  });

  test('all panels start collapsed', async ({ page }) => {
    const items = page.locator('.accordion.block details');
    const count = await items.count();
    for (let i = 0; i < count; i += 1) {
      await expect(items.nth(i)).not.toHaveAttribute('open', '');
    }
  });

  test('clicking a trigger expands and collapses its panel', async ({ page }) => {
    const firstItem = page.locator('.accordion.block details').first();
    const firstTrigger = page.locator('.accordion.block summary').first();

    await firstTrigger.click();
    await expect(firstItem).toHaveAttribute('open', '');
    await expect(page.locator('.accordion.block').getByText('NVIDIA Support')).toBeVisible();

    await firstTrigger.click();
    await expect(firstItem).not.toHaveAttribute('open', '');
  });

  test('single-open: opening a second item collapses the first', async ({ page }) => {
    const items = page.locator('.accordion.block details');
    const triggers = page.locator('.accordion.block summary');

    await triggers.nth(0).click();
    await expect(items.nth(0)).toHaveAttribute('open', '');

    await triggers.nth(1).click();
    await expect(items.nth(1)).toHaveAttribute('open', '');
    await expect(items.nth(0)).not.toHaveAttribute('open', '');
  });
});
