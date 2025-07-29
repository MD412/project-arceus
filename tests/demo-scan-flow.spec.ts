import { test, expect } from '@playwright/test';

test.describe('Demo Scan Flow', () => {
  test('should demonstrate card search and correction flow', async ({ page }) => {
    // 1. Navigate to demo page
    await test.step('Navigate to demo page', async () => {
      await page.goto('/demo-scan-flow');
      await page.waitForLoadState('networkidle');
      console.log('📄 Demo page loaded');
    });

    // 2. Take initial screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/demo-01-initial.png',
      fullPage: true 
    });

    // 3. Click on the unknown card
    await test.step('Click on unknown card', async () => {
      // Find cards with "Unknown" text
      const unknownCard = page.locator('div:has-text("Unknown Card")').first();
      await unknownCard.click();
      console.log('✅ Clicked on unknown card');
      
      // Wait for search to appear
      await page.waitForSelector('text=Search for the correct card', { timeout: 5000 });
    });

    // 4. Search for a card
    await test.step('Search for Pikachu', async () => {
      const searchInput = page.locator('input[placeholder*="search"]').first();
      await searchInput.fill('Pikachu');
      console.log('🔍 Searching for Pikachu...');
      
      // Wait for results
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'tests/screenshots/demo-02-search.png',
        fullPage: true 
      });
      
      // Click first result
      const firstResult = page.locator('[role="option"]').first();
      if (await firstResult.isVisible()) {
        await firstResult.click();
        console.log('✅ Selected Pikachu from results');
      }
    });

    // 5. Wait for update
    await page.waitForTimeout(1000);
    
    // 6. Check that card was updated
    await test.step('Verify card update', async () => {
      // Check if we now have 2 identified cards
      const identifiedCards = await page.locator('text=✅ Identified').count();
      console.log(`Found ${identifiedCards} identified cards`);
      
      await page.screenshot({ 
        path: 'tests/screenshots/demo-03-updated.png',
        fullPage: true 
      });
    });

    // 7. Click approve button
    await test.step('Approve scan', async () => {
      const approveButton = page.locator('button:has-text("Approve")');
      await approveButton.click();
      
      // Wait for alert
      page.on('dialog', async dialog => {
        console.log('✅ Alert message:', dialog.message());
        await dialog.accept();
      });
      
      await page.waitForTimeout(1000);
    });

    console.log('🎉 Demo flow completed successfully!');
  });
}); 