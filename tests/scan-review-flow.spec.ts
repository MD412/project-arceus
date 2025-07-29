import { test, expect } from '@playwright/test';

test.describe('Scan Review & Collection Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to scans page
    await page.goto('/scans');
    await page.waitForLoadState('networkidle');
  });

  test('should display scans list page', async ({ page }) => {
    // Take screenshot of scans list
    await page.screenshot({ path: 'tests/screenshots/scans-list.png', fullPage: true });
    
    // Verify page loads
    await expect(page).toHaveTitle(/Project Arceus/);
    await expect(page.locator('text=My Scans')).toBeVisible();
  });

  test('should navigate to scan details and show CardDetailLayout', async ({ page }) => {
    // Click on first scan (if exists)
    const firstScan = page.locator('[data-testid="scan-item"]').first();
    
    if (await firstScan.isVisible()) {
      await firstScan.click();
      await page.waitForURL(/\/scans\/[^/]+$/);
      
      // Take screenshot of scan details
      await page.screenshot({ path: 'tests/screenshots/scan-details.png', fullPage: true });
      
      // Verify CardDetailLayout is present
      await expect(page.locator('text=Search Cards')).toBeVisible();
      await expect(page.locator('text=Search for a card to see details here')).toBeVisible();
    }
  });

  test('should search for cards and display results', async ({ page }) => {
    // Navigate to a scan detail page
    const firstScan = page.locator('[data-testid="scan-item"]').first();
    
    if (await firstScan.isVisible()) {
      await firstScan.click();
      await page.waitForURL(/\/scans\/[^/]+$/);
      
      // Find search input and type
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await searchInput.fill('scizor');
      await searchInput.press('Enter');
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Take screenshot of search results
      await page.screenshot({ path: 'tests/screenshots/card-search-results.png' });
      
      // Verify search results appear
      await expect(page.locator('text=Scizor')).toBeVisible();
    }
  });

  test('should show approve scan button', async ({ page }) => {
    // Navigate to scan details
    const firstScan = page.locator('[data-testid="scan-item"]').first();
    
    if (await firstScan.isVisible()) {
      await firstScan.click();
      await page.waitForURL(/\/scans\/[^/]+$/);
      
      // Scroll to bottom to find approve button
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      
      // Take screenshot of approve section
      await page.screenshot({ path: 'tests/screenshots/approve-section.png' });
      
      // Verify approve button is present
      await expect(page.locator('text=📚 Approve Scan')).toBeVisible();
    }
  });

  test('should handle approve scan workflow', async ({ page }) => {
    // Navigate to scan details
    const firstScan = page.locator('[data-testid="scan-item"]').first();
    
    if (await firstScan.isVisible()) {
      await firstScan.click();
      await page.waitForURL(/\/scans\/[^/]+$/);
      
      // Scroll to approve button
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      
      // Click approve button
      const approveButton = page.locator('text=📚 Approve Scan').first();
      
      if (await approveButton.isVisible()) {
        await approveButton.click();
        
        // Wait for loading state
        await expect(page.locator('text=Approving...')).toBeVisible();
        
        // Wait for success state
        await expect(page.locator('text=✅ Approved')).toBeVisible();
        
        // Take screenshot of success state
        await page.screenshot({ path: 'tests/screenshots/approve-success.png' });
      }
    }
  });

  test('should handle card search and selection', async ({ page }) => {
    // Navigate to scan details
    const firstScan = page.locator('[data-testid="scan-item"]').first();
    
    if (await firstScan.isVisible()) {
      await firstScan.click();
      await page.waitForURL(/\/scans\/[^/]+$/);
      
      // Search for a card
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await searchInput.fill('pikachu');
      await searchInput.press('Enter');
      
      // Wait for results and click first result
      await page.waitForTimeout(1000);
      const firstResult = page.locator('[role="option"]').first();
      
      if (await firstResult.isVisible()) {
        await firstResult.click();
        
        // Verify card details are displayed
        await expect(page.locator('text=Pikachu')).toBeVisible();
        
        // Take screenshot of selected card
        await page.screenshot({ path: 'tests/screenshots/card-selected.png' });
      }
    }
  });

  test('should display proper error states', async ({ page }) => {
    // Try to access a non-existent scan
    await page.goto('/scans/non-existent-id');
    
    // Take screenshot of error state
    await page.screenshot({ path: 'tests/screenshots/error-state.png', fullPage: true });
    
    // Verify error handling
    await expect(page.locator('text=404') || page.locator('text=Not Found')).toBeVisible();
  });
}); 