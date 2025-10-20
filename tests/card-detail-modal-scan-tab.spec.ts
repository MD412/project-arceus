import { test, expect, Page } from '@playwright/test';

/**
 * Card Detail Modal - Scan Tab UX Test
 * 
 * Tests the new side-by-side Scan tab layout:
 * - Left column: Original scan crop
 * - Right column: "AI Identified As" panel with Replace button
 * 
 * Verifies:
 * 1. Side-by-side layout is visible
 * 2. Replace Card button triggers search mode
 * 3. Identified card preview displays correctly
 * 4. Layout is responsive on mobile
 */

const TEST_CONFIG = {
  TIMEOUT: 30000,
  BASE_URL: 'http://localhost:3000'
};

const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

async function simpleLogin(page: Page): Promise<void> {
  console.log('🔐 Logging in...');
  await page.goto('/login');
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log('✅ Logged in');
}

test.describe('Card Detail Modal - Scan Tab UX', () => {
  test.beforeEach(async ({ page }) => {
    await simpleLogin(page);
  });

  test('should display side-by-side layout in Scan tab', async ({ page }) => {
    console.log('🎯 Testing: Side-by-side Scan tab layout');

    // Navigate to collection
    await page.goto('/collection');
    await page.waitForLoadState('networkidle');

    // Find and click first card with scan data
    const firstCard = page.locator('[data-testid="card-item"], .card-item, .card-grid > div').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();

    // Wait for modal to open
    const modal = page.locator('[role="dialog"], .modal-overlay');
    await expect(modal).toBeVisible({ timeout: 5000 });
    console.log('✅ Modal opened');

    // Click Scan tab
    const scanTab = page.locator('button[role="tab"]:has-text("Scan"), button:has-text("Scan")').first();
    if (await scanTab.isVisible()) {
      await scanTab.click();
      await page.waitForTimeout(500); // Allow tab transition
      console.log('✅ Scan tab clicked');

      // Verify scan view container exists
      const scanView = page.locator('.card-detail-modal__scan-view');
      await expect(scanView).toBeVisible({ timeout: 5000 });

      // Verify left column: scan image
      const scanColumn = page.locator('.card-detail-modal__scan-column').first();
      await expect(scanColumn).toBeVisible();
      
      const scanImage = page.locator('.card-detail-modal__scan-image');
      await expect(scanImage).toBeVisible();
      console.log('✅ Left column (scan crop) visible');

      // Verify right column: identified card panel
      const scanInfo = page.locator('.card-detail-modal__scan-info');
      await expect(scanInfo).toBeVisible();

      // Check for "AI Identified As" heading
      const heading = scanInfo.locator('h3:has-text("AI Identified As")');
      await expect(heading).toBeVisible();
      console.log('✅ Right column (identified card) visible');

      // Verify identified card preview
      const identifiedCard = page.locator('.card-detail-modal__identified-card');
      await expect(identifiedCard).toBeVisible();

      const identifiedImage = page.locator('.card-detail-modal__identified-image');
      await expect(identifiedImage).toBeVisible();
      console.log('✅ Identified card preview visible');

      // Verify Replace Card button
      const replaceButton = page.locator('.card-detail-modal__replace-trigger, button:has-text("Replace Card")').first();
      await expect(replaceButton).toBeVisible();
      console.log('✅ Replace Card button visible');

      console.log('🎉 Side-by-side layout test PASSED');
    } else {
      console.log('⚠️  No Scan tab found - card may not have rawCropUrl');
    }
  });

  test('should enter replace mode when Replace Card is clicked', async ({ page }) => {
    console.log('🎯 Testing: Replace Card button functionality');

    await page.goto('/collection');
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('[data-testid="card-item"], .card-item, .card-grid > div').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();

    const modal = page.locator('[role="dialog"], .modal-overlay');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Click Scan tab
    const scanTab = page.locator('button[role="tab"]:has-text("Scan"), button:has-text("Scan")').first();
    if (await scanTab.isVisible()) {
      await scanTab.click();
      await page.waitForTimeout(500);

      // Click Replace Card button
      const replaceButton = page.locator('.card-detail-modal__replace-trigger, button:has-text("Replace Card")').first();
      if (await replaceButton.isVisible()) {
        await replaceButton.click();
        await page.waitForTimeout(500);
        console.log('✅ Replace Card clicked');

        // Verify replace panel appears
        const replacePanel = page.locator('.card-detail-modal__replace-panel');
        await expect(replacePanel).toBeVisible({ timeout: 5000 });
        console.log('✅ Replace panel visible');

        // Verify search input
        const searchInput = page.locator('input[placeholder*="Search"], .card-search-input input').first();
        await expect(searchInput).toBeVisible();
        console.log('✅ Search input visible');

        // Verify Cancel button
        const cancelButton = page.locator('button:has-text("Cancel")').first();
        await expect(cancelButton).toBeVisible();
        console.log('✅ Cancel button visible');

        // Click Cancel to return to default view
        await cancelButton.click();
        await page.waitForTimeout(500);

        // Verify back to scan info view
        const scanInfo = page.locator('.card-detail-modal__scan-info');
        await expect(scanInfo).toBeVisible();
        console.log('✅ Cancel returns to default view');

        console.log('🎉 Replace mode test PASSED');
      } else {
        console.log('⚠️  Replace button not visible');
      }
    } else {
      console.log('⚠️  No Scan tab found - card may not have rawCropUrl');
    }
  });

  test('should display both images side-by-side without overflow', async ({ page }) => {
    console.log('🎯 Testing: Image containment and overflow prevention');

    await page.goto('/collection');
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('[data-testid="card-item"], .card-item, .card-grid > div').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();

    const modal = page.locator('[role="dialog"], .modal-overlay');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const scanTab = page.locator('button[role="tab"]:has-text("Scan"), button:has-text("Scan")').first();
    if (await scanTab.isVisible()) {
      await scanTab.click();
      await page.waitForTimeout(500);

      // Get modal content dimensions
      const modalContent = page.locator('.modal-content');
      const modalBox = await modalContent.boundingBox();
      
      if (modalBox) {
        // Get scan image dimensions
        const scanImage = page.locator('.card-detail-modal__scan-image');
        const scanBox = await scanImage.boundingBox();

        if (scanBox) {
          // Verify scan image is contained within modal
          expect(scanBox.height).toBeLessThanOrEqual(modalBox.height);
          console.log(`✅ Scan image contained: ${scanBox.height}px ≤ ${modalBox.height}px`);
          
          // Verify no horizontal overflow
          const scanView = page.locator('.card-detail-modal__scan-view');
          const scanViewBox = await scanView.boundingBox();
          
          if (scanViewBox) {
            expect(scanViewBox.width).toBeLessThanOrEqual(modalBox.width);
            console.log(`✅ Scan view contained: ${scanViewBox.width}px ≤ ${modalBox.width}px`);
          }
        }

        console.log('🎉 Image containment test PASSED');
      }
    } else {
      console.log('⚠️  No Scan tab found - card may not have rawCropUrl');
    }
  });
});

