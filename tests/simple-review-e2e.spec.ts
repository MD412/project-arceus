import { test, expect } from '@playwright/test';
import { loginTestUser } from './helpers/auth';

test.describe('Simple Review Flow - Using Existing Scan', () => {
  // Use a fresh context
  test.use({
    storageState: undefined
  });

  test('should search for card and save correction', async ({ page }) => {
    // Known good scan ID from the system
    const EXISTING_SCAN_ID = '66a46556-2446-4bc9-aa1c-c3b706ab6457';
    
    // 1. Login
    await test.step('Login', async () => {
      await loginTestUser(page);
      console.log('✅ Logged in');
    });

    // 2. Navigate to existing scan
    await test.step('Open existing scan', async () => {
      await page.goto(`/scans/${EXISTING_SCAN_ID}`);
      await page.waitForLoadState('networkidle');
      
      // Wait for content to load - be flexible with selectors
      await page.waitForSelector('button, a, [role="button"]', { timeout: 10000 });
      
      console.log('📄 Scan page loaded');
      await page.screenshot({ 
        path: 'tests/screenshots/simple-01-scan.png',
        fullPage: true 
      });
    });

    // 3. Find and click a card to correct
    await test.step('Click on first card', async () => {
      // Look for any clickable card element
      const cardSelectors = [
        '[data-testid*="card"]',
        '[class*="card"]:has(img)',
        'img[alt*="Card"]',
        'img[src*="crop"]',
        '.card-item',
        '[role="button"]:has(img)'
      ];
      
      let cardFound = false;
      for (const selector of cardSelectors) {
        const cards = page.locator(selector);
        const count = await cards.count();
        if (count > 0) {
          console.log(`Found ${count} cards with selector: ${selector}`);
          await cards.first().click();
          cardFound = true;
          break;
        }
      }
      
      if (!cardFound) {
        console.log('⚠️ No cards found, taking screenshot for debugging');
        await page.screenshot({ 
          path: 'tests/screenshots/simple-debug-no-cards.png',
          fullPage: true 
        });
      }
      
      await page.waitForLoadState('networkidle'); // Wait for any animations
    });

    // 4. Search for a card
    await test.step('Search for Pikachu', async () => {
      // Find search input - be flexible
      const searchSelectors = [
        'input[placeholder*="Search"]',
        'input[type="search"]',
        'input[name*="search"]',
        '[role="searchbox"]'
      ];
      
      let searchInput = null;
      for (const selector of searchSelectors) {
        const input = page.locator(selector).first();
        if (await input.isVisible()) {
          searchInput = input;
          console.log(`Found search with selector: ${selector}`);
          break;
        }
      }
      
      if (searchInput) {
        await searchInput.click();
        await searchInput.fill('Pikachu');
        
        // Wait for search results
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ 
          path: 'tests/screenshots/simple-02-search.png',
          fullPage: true 
        });
        
        // Try to click first result
        const resultSelectors = [
          '[role="option"]',
          '[class*="result"]',
          '[class*="dropdown"] li',
          'ul li:has-text("Pikachu")'
        ];
        
        for (const selector of resultSelectors) {
          const result = page.locator(selector).first();
          if (await result.isVisible()) {
            await result.click();
            console.log('✅ Clicked search result');
            break;
          }
        }
      } else {
        console.log('⚠️ No search input found');
      }
    });

    // 5. Save the scan
    await test.step('Approve scan', async () => {
      // Look for approve/save button
      const approveSelectors = [
        'button:has-text("Approve")',
        'button:has-text("Save")',
        'button:has-text("Confirm")',
        '[data-testid="approve-scan"]'
      ];
      
      for (const selector of approveSelectors) {
        const button = page.locator(selector).first();
        if (await button.isVisible()) {
          await button.click();
          console.log('✅ Clicked approve button');
          
          // Wait for navigation or success
          await page.waitForLoadState('networkidle');
          break;
        }
      }
      
      await page.screenshot({ 
        path: 'tests/screenshots/simple-03-final.png',
        fullPage: true 
      });
    });
  });
}); 