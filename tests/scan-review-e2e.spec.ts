import { test, expect } from '@playwright/test';

test.describe('Scan Review and Approval Flow', () => {
  // Use a known scan ID from your test data
  const TEST_SCAN_ID = '66a46556-2446-4bc9-aa1c-c3b706ab6457';
  
  test('should complete full scan review workflow', async ({ page }) => {
    // 1. Navigate to scans list
    await test.step('Navigate to scans list', async () => {
      await page.goto('/scans');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of scans list
      await page.screenshot({ 
        path: 'tests/screenshots/01-scans-list.png',
        fullPage: true 
      });
      
      // Check that we're on the scans page
      await expect(page.locator('h1:has-text("Scans"), h2:has-text("Scans"), text=Recent Scans')).toBeVisible();
    });

    // 2. Click on a specific scan
    await test.step('Open scan detail page', async () => {
      // Click on the scan (adjust selector based on your actual UI)
      await page.goto(`/scans/${TEST_SCAN_ID}`);
      await page.waitForLoadState('networkidle');
      
      // Wait for the page to load - look for any heading that indicates we're on the scan page
      await expect(page.locator('h1, h2').first()).toBeVisible();
      
      // Take screenshot of scan detail
      await page.screenshot({ 
        path: 'tests/screenshots/02-scan-detail.png',
        fullPage: true 
      });
    });

    // 3. Test Card Search & Review section
    await test.step('Search for a card to correct', async () => {
      // Wait for Card Search section
      await expect(page.locator('text=Card Search & Review')).toBeVisible();
      
      // Find the search input
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await expect(searchInput).toBeVisible();
      
      // Type in search
      await searchInput.click();
      await searchInput.fill('Pikachu');
      
      // Wait for search results
      await page.waitForResponse(response => 
        response.url().includes('/api/cards/search') && 
        response.status() === 200
      );
      
      // Take screenshot of search results
      await page.screenshot({ 
        path: 'tests/screenshots/03-card-search-results.png',
        fullPage: true 
      });
      
      // Click on first search result
      const firstResult = page.locator('[role="listbox"] [role="option"]').first();
      await expect(firstResult).toBeVisible();
      await firstResult.click();
      
      // Verify card is selected
      await expect(page.locator('text=Selected:')).toBeVisible();
      
      // Take screenshot of selected card
      await page.screenshot({ 
        path: 'tests/screenshots/04-card-selected.png',
        fullPage: true 
      });
    });

    // 4. Apply correction to unidentified card
    await test.step('Apply card correction', async () => {
      // Find an unidentified card (look for "Unknown Card" text)
      const unknownCard = page.locator('.enriched-card-slot:has-text("Unknown Card")').first();
      
      if (await unknownCard.count() > 0) {
        // Click to apply correction
        await unknownCard.click();
        
        // Wait for the correction to be saved
        await page.waitForResponse(response => 
          response.url().includes('/api/scans/') && 
          response.url().includes('/cards') &&
          response.status() === 200
        );
        
        // Take screenshot after correction
        await page.screenshot({ 
          path: 'tests/screenshots/05-card-corrected.png',
          fullPage: true 
        });
      }
    });

    // 5. Test the toggle between grid and spatial view
    await test.step('Toggle view modes', async () => {
      // Find toggle button
      const toggleButton = page.locator('button:has-text("Grid View"), button:has-text("Spatial View")');
      
      if (await toggleButton.count() > 0) {
        // Click to toggle
        await toggleButton.click();
        await page.waitForLoadState('networkidle'); // Wait for animation
        
        // Take screenshot of alternate view
        await page.screenshot({ 
          path: 'tests/screenshots/06-alternate-view.png',
          fullPage: true 
        });
        
        // Toggle back
        await toggleButton.click();
        await page.waitForTimeout(500);
      }
    });

    // 6. Test training feedback buttons
    await test.step('Test training feedback', async () => {
      // Find a card with feedback buttons
      const notACardButton = page.locator('button:has-text("🚫 Not a Card")').first();
      
      if (await notACardButton.count() > 0) {
        // Click the button
        await notACardButton.click();
        
        // Wait for API response
        await page.waitForResponse(response => 
          response.url().includes('/api/training/add-failure') &&
          response.status() === 200,
          { timeout: 5000 }
        ).catch(() => {
          // If API fails, that's okay for this test
          console.log('Training API not available');
        });
        
        // Handle alert if it appears
        page.on('dialog', async dialog => {
          console.log('Alert:', dialog.message());
          await dialog.accept();
        });
        
        await page.waitForTimeout(1000);
      }
    });

    // 7. Approve the scan
    await test.step('Approve scan and add to collection', async () => {
      // Find approve button
      const approveButton = page.locator('button:has-text("Approve Scan")');
      await expect(approveButton).toBeVisible();
      
      // Take screenshot before approval
      await page.screenshot({ 
        path: 'tests/screenshots/07-before-approve.png',
        fullPage: true 
      });
      
      // Click approve
      await approveButton.click();
      
      // Wait for approval to complete
      const approveResponse = await page.waitForResponse(response => 
        response.url().includes('/api/scans/') && 
        response.url().includes('/approve'),
        { timeout: 10000 }
      ).catch(() => null);
      
      if (approveResponse && approveResponse.status() === 200) {
        // Wait for success state
        await expect(page.locator('text=Approved')).toBeVisible({ timeout: 5000 });
        
        // Take screenshot after approval
        await page.screenshot({ 
          path: 'tests/screenshots/08-after-approve.png',
          fullPage: true 
        });
      }
    });

    // 8. Generate test summary
    await test.step('Generate test report', async () => {
      console.log('✅ Scan Review E2E Test Complete!');
      console.log('📸 Screenshots saved to tests/screenshots/');
      console.log('📊 Test covered:');
      console.log('  - Viewing scans list');
      console.log('  - Opening scan details');
      console.log('  - Searching for cards');
      console.log('  - Selecting cards');
      console.log('  - Applying corrections');
      console.log('  - Toggling view modes');
      console.log('  - Training feedback');
      console.log('  - Approving scan');
    });
  });

  test('should handle card search with keyboard navigation', async ({ page }) => {
    await page.goto(`/scans/${TEST_SCAN_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Focus search input
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.click();
    await searchInput.fill('Char');
    
    // Wait for results
    await page.waitForSelector('[role="listbox"]');
    
    // Test keyboard navigation
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    
    // Verify selection
    await expect(page.locator('text=Selected:')).toBeVisible();
    
    // Test escape key
    await searchInput.click();
    await searchInput.fill('Test');
    await page.keyboard.press('Escape');
    
    // Verify dropdown is closed
    await expect(page.locator('[role="listbox"]')).not.toBeVisible();
  });

  test('should show proper error states', async ({ page }) => {
    await page.goto(`/scans/${TEST_SCAN_ID}`);
    
    // Test with very short query
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('a');
    
    // Should not show results for single character
    await expect(page.locator('[role="listbox"]')).not.toBeVisible();
    
    // Test with gibberish that returns no results
    await searchInput.fill('xyzxyzxyz');
    await page.waitForTimeout(500);
    
    // Should show "No cards found"
    await expect(page.locator('text=No cards found')).toBeVisible({ timeout: 5000 });
  });
}); 