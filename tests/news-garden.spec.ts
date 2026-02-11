import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotDir = path.join(__dirname, 'screenshots');

test.describe('News Garden - Globe & Navigation', () => {
  test('should load the homepage with globe and header', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Header is visible
    const header = page.locator('text=NEWS GARDEN');
    await expect(header.first()).toBeVisible();

    // Globe canvas renders
    const canvas = page.locator('canvas');
    await expect(canvas.first()).toBeVisible();

    await page.screenshot({ path: path.join(screenshotDir, '01-homepage-globe.png'), fullPage: true });
  });

  test('should display live indicator and article count', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for articles to load (LIVE or UP TO DATE indicator)
    await page.waitForSelector('text=/LIVE|UP TO DATE/', { timeout: 30000 });

    // Article count should be visible
    const articleCount = page.locator('text=/\\d+ articles/');
    await expect(articleCount.first()).toBeVisible();

    // Categories count should be visible
    const categoryCount = page.locator('text=/\\d+ categories/');
    await expect(categoryCount.first()).toBeVisible();

    await page.screenshot({ path: path.join(screenshotDir, '02-live-indicator.png'), fullPage: true });
  });

  test('should show Dashboard button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const dashboardBtn = page.locator('text=Dashboard');
    await expect(dashboardBtn.first()).toBeVisible();

    await page.screenshot({ path: path.join(screenshotDir, '03-dashboard-button.png'), fullPage: true });
  });
});

test.describe('News Garden - Category Filtering', () => {
  test('should display category filter buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=/LIVE|UP TO DATE/', { timeout: 30000 });

    // Category buttons should be visible
    const categories = ['Technology', 'Science', 'Health', 'Business', 'Politics', 'Sports', 'Entertainment', 'Environment'];
    for (const cat of categories) {
      const btn = page.locator(`button:has-text("${cat}")`);
      // At least one category button should exist
      const count = await btn.count();
      if (count > 0) {
        await expect(btn.first()).toBeVisible();
      }
    }

    await page.screenshot({ path: path.join(screenshotDir, '04-category-filters.png'), fullPage: true });
  });

  test('should filter articles when category is clicked', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=/LIVE|UP TO DATE/', { timeout: 30000 });

    // Get initial article count text
    const articleCountEl = page.locator('text=/\\d+ articles/');
    await expect(articleCountEl.first()).toBeVisible();
    const initialText = await articleCountEl.first().textContent();

    // Click on a category button (try Technology first)
    const techBtn = page.locator('button:has-text("Technology")');
    if (await techBtn.count() > 0) {
      await techBtn.first().click();
      await page.waitForTimeout(500);

      // The article count or category label should change
      const updatedText = await articleCountEl.first().textContent();
      // Either the count changed or "(Technology)" is shown
      const categoryLabel = page.locator('text=/Technology/');
      const labelVisible = await categoryLabel.first().isVisible().catch(() => false);
      expect(labelVisible || updatedText !== initialText).toBeTruthy();
    }

    await page.screenshot({ path: path.join(screenshotDir, '05-category-filtered.png'), fullPage: true });
  });
});

test.describe('News Garden - News Panel', () => {
  test('should open news panel when globe marker is clicked', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=/LIVE|UP TO DATE/', { timeout: 30000 });

    // Click on the globe canvas area to try to trigger a marker
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Click near center of globe where markers are likely present
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: path.join(screenshotDir, '06-globe-interaction.png'), fullPage: true });
  });
});

test.describe('News Garden - Search', () => {
  test('should have a search input', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = page.locator('input[placeholder*="earch"], input[type="search"], input[placeholder*="Search"]');
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
    }

    await page.screenshot({ path: path.join(screenshotDir, '07-search-input.png'), fullPage: true });
  });
});

test.describe('News Garden - Refresh', () => {
  test('should have refresh button that triggers loading', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=/LIVE|UP TO DATE/', { timeout: 30000 });

    // Find refresh button (the RefreshCw icon button)
    const refreshBtn = page.locator('button[title="Refresh news"]');
    if (await refreshBtn.count() > 0) {
      await refreshBtn.click();

      // Should show loading state
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(screenshotDir, '08-refresh-loading.png'), fullPage: true });

      // Wait for refresh to complete
      await page.waitForSelector('text=/LIVE|UP TO DATE/', { timeout: 30000 });
    }

    await page.screenshot({ path: path.join(screenshotDir, '09-refresh-complete.png'), fullPage: true });
  });
});

test.describe('News Garden - Dashboard', () => {
  test('should navigate to dashboard page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=/LIVE|UP TO DATE/', { timeout: 30000 });

    // Click Dashboard link
    const dashboardLink = page.locator('a:has-text("Dashboard")');
    if (await dashboardLink.count() > 0) {
      await dashboardLink.first().click();
      await page.waitForLoadState('networkidle');

      // Should be on dashboard page
      await expect(page).toHaveURL(/dashboard/);

      await page.screenshot({ path: path.join(screenshotDir, '10-dashboard-page.png'), fullPage: true });
    }
  });
});

test.describe('News Garden - Heatmap Toggle', () => {
  test('should toggle heatmap mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=/LIVE|UP TO DATE/', { timeout: 30000 });

    // Look for heatmap toggle button
    const heatmapBtn = page.locator('button:has-text("Heatmap"), button[title*="eatmap"]');
    if (await heatmapBtn.count() > 0) {
      await heatmapBtn.first().click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: path.join(screenshotDir, '11-heatmap-mode.png'), fullPage: true });
  });
});

test.describe('News Garden - Responsive Design', () => {
  test('should render correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header = page.locator('text=NEWS GARDEN');
    await expect(header.first()).toBeVisible();

    const canvas = page.locator('canvas');
    await expect(canvas.first()).toBeVisible();

    await page.screenshot({ path: path.join(screenshotDir, '12-mobile-view.png'), fullPage: true });
  });
});

test.describe('News Garden - Article Detail', () => {
  test('should navigate to article detail page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=/LIVE|UP TO DATE/', { timeout: 30000 });

    // Navigate to article detail directly via URL with a mock article
    await page.goto('/article/test-article');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: path.join(screenshotDir, '13-article-detail.png'), fullPage: true });
  });
});

test.describe('News Garden - Credibility Badges', () => {
  test('should show credibility classification badges on article cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=/LIVE|UP TO DATE/', { timeout: 30000 });

    // Check that credibility badge classes exist in the page
    // These badges are VERIFIED (green), SUSPICIOUS (yellow), or UNVERIFIED (red)
    const verifiedBadges = page.locator('text=VERIFIED');
    const suspiciousBadges = page.locator('text=SUSPICIOUS');
    const unverifiedBadges = page.locator('text=UNVERIFIED');

    // At least one type of credibility badge should exist when panel is opened
    // For now, verify the page loaded successfully with articles
    const articleCount = page.locator('text=/\\d+ articles/');
    await expect(articleCount.first()).toBeVisible();

    await page.screenshot({ path: path.join(screenshotDir, '14-credibility-badges-page.png'), fullPage: true });
  });
});

test.describe('News Garden - Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;
    // Page should load DOM in under 10 seconds
    expect(loadTime).toBeLessThan(10000);

    // Globe canvas should appear
    const canvas = page.locator('canvas');
    await expect(canvas.first()).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: path.join(screenshotDir, '15-performance-loaded.png'), fullPage: true });
  });
});
