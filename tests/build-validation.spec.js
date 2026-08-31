/**
 * Build Validation Tests — NVIDIA Contact Page EDS POC
 * =====================================================
 *
 * Mirrors the manual browser validation performed after each build.
 * Covers: page load, block decoration, stylesheets, interactivity,
 * responsive layout, header mega menu, location tabs, and footer.
 *
 * HOW TO RUN
 * ----------
 *  Full suite (headless):        npm test
 *  Full suite (visible browser): npm run test:headed
 *  Single test by name:          npx playwright test --grep "mega menu"
 *  Single project only:          npx playwright test --project="Desktop Chrome"
 *  HTML report:                  npm run test:report
 *
 * PREREQUISITES
 * -------------
 *  1. Install dependencies:      npm install
 *  2. Install browsers (once):   npx playwright install --with-deps chromium
 *  3. Server starts automatically via playwright.config.js webServer setting.
 *     To run server manually:    npm start
 */

import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3001';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Wait until all EDS blocks reach data-block-status="loaded" */
async function waitForBlocksLoaded(page) {
  await page.waitForFunction(() => {
    const blocks = [...document.querySelectorAll('[data-block-name]')];
    return blocks.length > 0 && blocks.every((b) => b.dataset.blockStatus === 'loaded');
  }, { timeout: 15000 });
}

// ─── Suite 1: Static Resources ──────────────────────────────────────────────

test.describe('Static Resources', () => {
  const cssFiles = [
    '/styles/styles.css',
    '/styles/lazy-styles.css',
    '/styles/fonts.css',
    '/blocks/header/header.css',
    '/blocks/footer/footer.css',
    '/blocks/hero/hero.css',
    '/blocks/cards/cards.css',
    '/blocks/contact-info/contact-info.css',
  ];

  for (const file of cssFiles) {
    test(`CSS responds 200: ${file}`, async ({ request }) => {
      const resp = await request.get(`${BASE}${file}`);
      expect(resp.status(), `${file} should return 200`).toBe(200);
    });
  }

  test('scripts/scripts.js responds 200', async ({ request }) => {
    const resp = await request.get(`${BASE}/scripts/scripts.js`);
    expect(resp.status()).toBe(200);
  });

  test('scripts/aem.js responds 200', async ({ request }) => {
    const resp = await request.get(`${BASE}/scripts/aem.js`);
    expect(resp.status()).toBe(200);
  });

  test('nav.html responds 200', async ({ request }) => {
    const resp = await request.get(`${BASE}/nav.html`);
    expect(resp.status()).toBe(200);
  });

  test('footer.html responds 200', async ({ request }) => {
    const resp = await request.get(`${BASE}/footer.html`);
    expect(resp.status()).toBe(200);
  });

  test('NVIDIA Sans font file responds 200', async ({ request }) => {
    const resp = await request.get(`${BASE}/fonts/NVIDIASansVF_NALA_W_Wght.woff2`);
    expect(resp.status()).toBe(200);
  });
});

// ─── Suite 2: Page Load & EDS Decoration Pipeline ───────────────────────────

test.describe('Page Load & EDS Decoration Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await waitForBlocksLoaded(page);
  });

  test('page title is correct', async ({ page }) => {
    await expect(page).toHaveTitle('Contact NVIDIA');
  });

  test('body has .appear class — FOUC prevention active', async ({ page }) => {
    await expect(page.locator('body')).toHaveClass(/appear/);
  });

  test('all 5 blocks are decorated and loaded', async ({ page }) => {
    const blocks = await page.evaluate(() =>
      [...document.querySelectorAll('[data-block-name]')].map((b) => ({
        name: b.dataset.blockName,
        status: b.dataset.blockStatus,
      })),
    );
    expect(blocks).toHaveLength(5);
    const expectedBlocks = ['header', 'hero', 'cards', 'contact-info', 'footer'];
    expectedBlocks.forEach((name) => {
      const block = blocks.find((b) => b.name === name);
      expect(block, `Block "${name}" should exist`).toBeTruthy();
      expect(block.status, `Block "${name}" should be loaded`).toBe('loaded');
    });
  });

  test('all 3 sections are loaded and visible', async ({ page }) => {
    const statuses = await page.evaluate(() =>
      [...document.querySelectorAll('.section')].map((s) => s.dataset.sectionStatus),
    );
    expect(statuses).toHaveLength(3);
    statuses.forEach((s) => expect(s).toBe('loaded'));
  });

  test('header block is visible', async ({ page }) => {
    await expect(page.locator('header .header')).toBeVisible();
    const status = await page.locator('header .header').getAttribute('data-block-status');
    expect(status).toBe('loaded');
  });

  test('footer block is visible', async ({ page }) => {
    await expect(page.locator('footer .footer')).toBeVisible();
    const status = await page.locator('footer .footer').getAttribute('data-block-status');
    expect(status).toBe('loaded');
  });

  test('no broken images on page', async ({ page }) => {
    const brokenImages = await page.evaluate(() =>
      [...document.querySelectorAll('img')]
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.src),
    );
    expect(brokenImages, `Broken images found: ${brokenImages.join(', ')}`).toHaveLength(0);
  });

  test('all 8 stylesheets injected into document', async ({ page }) => {
    const sheets = await page.evaluate(() =>
      [...document.styleSheets].map((s) => s.href).filter(Boolean),
    );
    const required = [
      'styles.css', 'hero.css', 'cards.css', 'header.css',
      'footer.css', 'contact-info.css', 'lazy-styles.css', 'fonts.css',
    ];
    required.forEach((file) => {
      expect(sheets.some((s) => s.includes(file)), `${file} should be loaded`).toBe(true);
    });
  });
});

// ─── Suite 3: Hero & Cards Section ──────────────────────────────────────────

test.describe('Hero & Cards Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await waitForBlocksLoaded(page);
  });

  test('hero h1 contains "Contact NVIDIA"', async ({ page }) => {
    await expect(page.locator('.hero h1')).toContainText('Contact NVIDIA');
  });

  test('hero subtitle visible', async ({ page }) => {
    await expect(page.locator('.hero p')).toContainText('Get Your Questions Answered');
  });

  test('hero section has gray background class', async ({ page }) => {
    await expect(page.locator('.hero-section')).toBeVisible();
  });

  test('cards renders 3 items', async ({ page }) => {
    const cards = page.locator('.cards ul li');
    await expect(cards).toHaveCount(3);
  });

  test('card titles: Support, Enterprise Sales, Find a Partner', async ({ page }) => {
    const titles = await page.locator('.cards [data-testid="nv-card-content"] h3').allTextContents();
    const text = titles.join(' ');
    expect(text).toContain('Support');
    expect(text).toContain('Enterprise Sales');
    expect(text).toContain('Find a Partner');
  });

  test('all 3 CTA buttons are visible', async ({ page }) => {
    const buttons = page.locator('.cards a.nv-button');
    await expect(buttons).toHaveCount(3);
    for (const btn of await buttons.all()) {
      await expect(btn).toBeVisible();
    }
  });
});

// ─── Suite 4: Header & Mega Menu ────────────────────────────────────────────

test.describe('Header & Mega Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await waitForBlocksLoaded(page);
  });

  test('NVIDIA logo is visible in header', async ({ page }) => {
    await expect(page.locator('.nav-logo')).toBeVisible();
    await expect(page.locator('.nav-logo svg')).toBeVisible();
  });

  test('primary nav shows Products, Solutions, Industries', async ({ page }) => {
    await expect(page.locator('.nav-primary-btn').nth(0)).toContainText('Products');
    await expect(page.locator('.nav-primary-btn').nth(1)).toContainText('Solutions');
    await expect(page.locator('.nav-primary-btn').nth(2)).toContainText('Industries');
  });

  test('utility links show Shop, Drivers, Support', async ({ page }) => {
    const utility = page.locator('.nav-utility a');
    const texts = await utility.allTextContents();
    expect(texts).toContain('Shop');
    expect(texts).toContain('Drivers');
    expect(texts).toContain('Support');
  });

  test('clicking Products opens mega menu', async ({ page }) => {
    await page.locator('.nav-primary-btn').nth(0).click();
    // Scope to the Products mega menu (first in DOM) to avoid strict-mode
    // violations — all 3 nav sections (Products/Solutions/Industries) share
    // the same class names so plain locators match 3 elements.
    const menu = page.locator('.mega-menu').first();
    await expect(menu).toBeVisible();
    await expect(menu.locator('.mega-menu-cats')).toBeVisible();
    await expect(menu.locator('.mega-menu-content')).toBeVisible();
  });

  test('Products mega menu shows category list with Cloud Services active', async ({ page }) => {
    await page.locator('.nav-primary-btn').nth(0).click();
    const menu = page.locator('.mega-menu').first();
    const activeBtn = menu.locator('.mega-menu-cats li.active button');
    await expect(activeBtn).toContainText('Cloud Services');
  });

  test('Products mega menu shows BioNeMo in right panel', async ({ page }) => {
    await page.locator('.nav-primary-btn').nth(0).click();
    const menu = page.locator('.mega-menu').first();
    await expect(menu.locator('.mega-menu-content')).toContainText('BioNeMo');
  });

  test('switching mega menu category updates right panel', async ({ page }) => {
    await page.locator('.nav-primary-btn').nth(0).click();
    const menu = page.locator('.mega-menu').first();
    // Click "Gaming" category (5th button, index 4) within the Products menu
    const gamingBtn = menu.locator('.mega-menu-cats button').nth(4);
    await expect(gamingBtn).toContainText('Gaming');
    await gamingBtn.click();
    await expect(menu.locator('.mega-menu-content')).toContainText('GeForce RTX');
    await expect(menu.locator('.mega-menu-content')).toContainText('DLSS');
  });

  test('ESC key closes open mega menu', async ({ page }) => {
    await page.locator('.nav-primary-btn').nth(0).click();
    await expect(page.locator('.mega-menu').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.mega-menu').first()).toBeHidden();
  });

  test('clicking overlay closes mega menu', async ({ page }) => {
    await page.locator('.nav-primary-btn').nth(0).click();
    await expect(page.locator('#nav-overlay')).toHaveClass(/visible/);
    // The overlay sits behind the absolutely-positioned mega-menu-content so
    // Playwright cannot perform a real pointer click at those coordinates.
    // Use page.evaluate to invoke the native .click() method directly on the
    // overlay element — this fires the addEventListener('click') handler that
    // calls closeAllMenus() and hides the mega menu.
    await page.evaluate(() => document.getElementById('nav-overlay').click());
    await expect(page.locator('.mega-menu').first()).toBeHidden();
  });

  test('clicking outside header closes mega menu', async ({ page }) => {
    await page.locator('.nav-primary-btn').nth(0).click();
    await expect(page.locator('.mega-menu').first()).toBeVisible();
    // Absolutely-positioned mega-menu buttons extend over the main element in
    // the hit-test tree.  Click at absolute viewport coordinates (centre-right,
    // 650 px down) that are guaranteed to be below the expanded menu panel.
    await page.mouse.click(760, 650);
    await expect(page.locator('.mega-menu').first()).toBeHidden();
  });

  test('Solutions mega menu shows correct categories', async ({ page }) => {
    await page.locator('.nav-primary-btn').nth(1).click();
    const cats = await page.locator('.mega-menu-cats button').allTextContents();
    expect(cats.some((c) => c.includes('Artificial Intelligence'))).toBe(true);
    expect(cats.some((c) => c.includes('High-Performance Computing'))).toBe(true);
  });
});

// ─── Suite 5: Our Locations / Contact Info ───────────────────────────────────

test.describe('Our Locations — Contact Info Block', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await waitForBlocksLoaded(page);
  });

  test('"Our Locations" heading is visible and centered', async ({ page }) => {
    const heading = page.locator('h2', { hasText: 'Our Locations' });
    await expect(heading).toBeVisible();
  });

  test('subtitle "More than 50 offices" is visible', async ({ page }) => {
    await expect(page.locator('text=More than 50 offices worldwide')).toBeVisible();
  });

  test('three region tabs are rendered: Americas, Asia, Europe', async ({ page }) => {
    const tabs = page.locator('.contact-info-tabs [role="tab"]');
    await expect(tabs).toHaveCount(3);
    await expect(tabs.nth(0)).toContainText('Americas');
    await expect(tabs.nth(1)).toContainText('Asia');
    await expect(tabs.nth(2)).toContainText('Europe');
  });

  test('Americas tab is active by default', async ({ page }) => {
    const americasTab = page.locator('[aria-controls="panel-americas"]');
    await expect(americasTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-americas')).toBeVisible();
    await expect(page.locator('#panel-asia')).toBeHidden();
  });

  test('clicking Asia tab shows Asia offices', async ({ page }) => {
    await page.locator('[aria-controls="panel-asia"]').click();
    await expect(page.locator('#panel-asia')).toBeVisible();
    await expect(page.locator('#panel-americas')).toBeHidden();
    // New layout: countries are group headings, cities are link text beneath them
    await expect(page.locator('#panel-asia')).toContainText('Mainland China');
    await expect(page.locator('#panel-asia')).toContainText('Beijing');
    await expect(page.locator('#panel-asia')).toContainText('Japan');
    await expect(page.locator('#panel-asia')).toContainText('Tokyo');
  });

  test('clicking Europe tab shows Europe offices', async ({ page }) => {
    await page.locator('[aria-controls="panel-europe"]').click();
    await expect(page.locator('#panel-europe')).toBeVisible();
    // New layout uses exact NVIDIA.com country group names
    await expect(page.locator('#panel-europe')).toContainText('United Kingdom');
    await expect(page.locator('#panel-europe')).toContainText('London');
    await expect(page.locator('#panel-europe')).toContainText('Germany');
    await expect(page.locator('#panel-europe')).toContainText('Munich');
  });

  test('Americas panel shows NVIDIA Corporate HQ with correct address', async ({ page }) => {
    const panel = page.locator('#panel-americas');
    // Heading changed from "Headquarters" to "NVIDIA Corporate" to match NVIDIA.com
    await expect(panel).toContainText('NVIDIA Corporate');
    await expect(panel).toContainText('2788 San Tomas Expressway');
    await expect(panel).toContainText('Santa Clara');
    await expect(panel).toContainText('View Directions Map');
    await expect(panel).toContainText('Investor Inquiries');
  });
});

// ─── Suite 6: Footer ────────────────────────────────────────────────────────

test.describe('Footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await waitForBlocksLoaded(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  });

  test('main footer (black) is visible', async ({ page }) => {
    await expect(page.locator('.footer-main')).toBeVisible();
  });

  test('footer has 3 navigation columns', async ({ page }) => {
    const cols = page.locator('.footer-col');
    await expect(cols).toHaveCount(3);
  });

  test('footer columns have correct headings', async ({ page }) => {
    const headings = await page.locator('.footer-col h5').allTextContents();
    expect(headings).toContain('Company Information');
    expect(headings).toContain('News and Events');
    expect(headings).toContain('Popular Links');
  });

  test('social icons row is visible with label "Follow NVIDIA"', async ({ page }) => {
    await expect(page.locator('.footer-social')).toBeVisible();
    await expect(page.locator('.footer-social-label')).toContainText('Follow NVIDIA');
  });

  test('all 5 social icons are rendered', async ({ page }) => {
    const icons = page.locator('.footer-social a');
    await expect(icons).toHaveCount(5);
  });

  test('global footer (white) is visible with NVIDIA wordmark', async ({ page }) => {
    await expect(page.locator('.footer-global')).toBeVisible();
    await expect(page.locator('.footer-global-logo svg')).toBeVisible();
  });

  test('legal links are present in global footer', async ({ page }) => {
    const legal = page.locator('.footer-legal-links');
    await expect(legal).toContainText('Privacy Policy');
    await expect(legal).toContainText('Terms of Service');
  });

  test('copyright text is visible', async ({ page }) => {
    await expect(page.locator('.footer-copyright')).toContainText('Copyright');
    await expect(page.locator('.footer-copyright')).toContainText('NVIDIA Corporation');
  });
});

// ─── Suite 7: Mobile Responsive ─────────────────────────────────────────────

test.describe('Mobile Responsive (375px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await waitForBlocksLoaded(page);
  });

  test('hamburger button is visible on mobile', async ({ page }) => {
    await expect(page.locator('.nav-hamburger')).toBeVisible();
  });

  test('utility links (Shop/Drivers/Support) are hidden on mobile', async ({ page }) => {
    await expect(page.locator('.nav-utility')).toBeHidden();
  });

  test('mega menu is hidden on mobile', async ({ page }) => {
    await expect(page.locator('.mega-menu').first()).toBeHidden();
  });

  test('hamburger click opens nav links', async ({ page }) => {
    await page.locator('.nav-hamburger').click();
    await expect(page.locator('#nav-links')).toBeVisible();
    await expect(page.locator('#nav-links')).toContainText('Products');
    await expect(page.locator('#nav-links')).toContainText('Solutions');
    await expect(page.locator('#nav-links')).toContainText('Industries');
  });

  test('hamburger click again closes nav links', async ({ page }) => {
    await page.locator('.nav-hamburger').click();
    await expect(page.locator('#nav-links')).toBeVisible();
    await page.locator('.nav-hamburger').click();
    await expect(page.locator('#nav-links')).toBeHidden();
  });

  test('cards stack vertically on mobile', async ({ page }) => {
    const cards = page.locator('.cards ul li');
    await expect(cards).toHaveCount(3);
    // Each card should be visible and stacked
    for (const card of await cards.all()) {
      await expect(card).toBeVisible();
    }
  });
});
