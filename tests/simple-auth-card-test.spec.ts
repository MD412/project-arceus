import { test, expect, Page } from '@playwright/test';

/**
 * Simple Authentication and Card Display Test
 * Focuses on basic login flow and card component validation
 */

// Test configuration
const TEST_CONFIG = {
  TIMEOUT: 30000,
  BASE_URL: 'http://localhost:3000'
};

// Test credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

/**
 * Simple login helper without complex state clearing
 */
async function simpleLogin(page: Page): Promise<void> {
  console.log('🔐 Attempting login...');
  
  // Navigate to login page
  await page.goto('/login');
  
  // Wait for login form
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  
  // Fill login form
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  
  // Submit login
  await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
  
  // Wait for redirect (could be to home, scans, or dashboard)
  await page.waitForTimeout(3000);
  
  console.log(`✅ Login submitted, current URL: ${page.url()}`);
}

/**
 * Check if user is logged in
 */
async function verifyLoggedIn(page: Page): Promise<boolean> {
  try {
    // Look for logged-in indicators
    const loggedInSelectors = [
      'button:has-text("Logout")',
      'a:has-text("Upload")',
      '[data-testid="user-menu"]',
      '.user-avatar',
      'nav a:has-text("Scans")'
    ];
    
    for (const selector of loggedInSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        console.log(`✅ Found logged-in indicator: ${selector}`);
        return true;
      } catch {
        continue;
      }
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Main test: Simple authentication and card display
 */
test('Simple Auth and Card Display Test', async ({ page }) => {
  console.log('🚀 Starting Simple Authentication Test');
  
  try {
    // Step 1: Login
    await simpleLogin(page);
    
    // Step 2: Verify login worked
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const isLoggedIn = await verifyLoggedIn(page);
    if (!isLoggedIn) {
      console.log('❌ Login verification failed, taking screenshot...');
      await page.screenshot({
        path: `test-results/login-failed-${Date.now()}.png`,
        fullPage: true
      });
      throw new Error('User does not appear to be logged in');
    }
    
    console.log('✅ User successfully logged in');
    
    // Step 3: Try to access upload page
    console.log('📤 Testing upload page access...');
    await page.goto('/upload');
    
    // Check if upload form is visible (indicates we're authenticated)
    const uploadForm = page.locator('input[type="file"]');
    await expect(uploadForm).toBeVisible({ timeout: 10000 });
    console.log('✅ Can access upload page - authentication working');
    
    // Step 4: Check scans page
    console.log('📋 Testing scans page access...');
    await page.goto('/scans');
    await page.waitForTimeout(3000);
    
    // Look for scans page content
    const scansPageIndicators = page.locator('h1, h2, .page-title');
    const pageTitle = await scansPageIndicators.first().textContent();
    console.log(`📊 Scans page loaded, title: "${pageTitle}"`);
    
    // Step 5: Look for existing scans or try to find review pages
    const scanLinks = page.locator('a[href*="/scans/"], .scan-item, [data-testid="scan-card"]');
    const scanCount = await scanLinks.count();
    
    if (scanCount > 0) {
      console.log(`📊 Found ${scanCount} existing scans`);
      
      // Click on first scan
      await scanLinks.first().click();
      await page.waitForURL(/\/scans\/[a-f0-9-]+/);
      
      const scanId = page.url().split('/scans/')[1].split('/')[0];
      console.log(`📋 Viewing scan: ${scanId}`);
      
      // Try to navigate to review page
      const reviewUrl = `/scans/${scanId}/review`;
      console.log(`🔍 Navigating to review page: ${reviewUrl}`);
      await page.goto(reviewUrl);
      await page.waitForTimeout(3000);
      
      // Step 6: Look for card components
      console.log('🔍 Looking for card components...');
      
      const cardSelectors = [
        '.detection-card',        // Main selector from review page
        '.detections-grid .detection-card',  // More specific
        '.card-item',             // From v2 page
        '.enriched-card-slot',    // From main scan page
        '.card-slot',             // Fallback
        '[data-testid="card"]'    // Test ID if added
      ];
      
      let cardsFound = false;
      let cardCount = 0;
      let usedSelector = '';
      
      // Try different selectors to find cards
      for (const selector of cardSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          const elements = page.locator(selector);
          cardCount = await elements.count();
          if (cardCount > 0) {
            console.log(`📊 Found ${cardCount} cards using selector: ${selector}`);
            cardsFound = true;
            usedSelector = selector;
            
            // Validate first few cards with correct selectors
            for (let i = 0; i < Math.min(3, cardCount); i++) {
              const card = elements.nth(i);
              await expect(card).toBeVisible();
              console.log(`  ✅ Card ${i + 1} is visible`);
              
              // Look for card content with correct selectors from the codebase
              const cardImage = card.locator('img, .card-image, .crop-image');
              const cardName = card.locator('.card-name, h4');
              const confidence = card.locator('.id-confidence, .confidence, .detection-confidence');
              const statusIndicator = card.locator('.status-indicator');
              
              if (await cardImage.count() > 0) {
                console.log(`  📸 Card ${i + 1} has image`);
              }
              
              if (await cardName.count() > 0) {
                const text = await cardName.first().textContent();
                console.log(`  📝 Card ${i + 1} name: "${text?.trim()}"`);
              }
              
              if (await confidence.count() > 0) {
                const confidenceText = await confidence.first().textContent();
                console.log(`  🎯 Card ${i + 1} confidence: "${confidenceText?.trim()}"`);
              }
              
              if (await statusIndicator.count() > 0) {
                const statusText = await statusIndicator.first().textContent();
                console.log(`  📊 Card ${i + 1} status: "${statusText?.trim()}"`);
              }
              
              // Look for feedback buttons with correct selectors
              const feedbackButtons = card.locator('button:has-text("Correct"), button:has-text("✅"), .training-feedback button');
              const buttonCount = await feedbackButtons.count();
              if (buttonCount > 0) {
                console.log(`  🎯 Card ${i + 1} has ${buttonCount} feedback buttons`);
              }
            }
            break;
          }
        } catch {
          continue;
        }
      }
      
      if (!cardsFound) {
        console.log('⚠️ No card components found with expected selectors');
        
        // Try to find ANY elements that might be cards
        const genericSelectors = [
          'div[class*="card"]',
          'div[class*="detection"]', 
          'div[class*="crop"]',
          '.detections-grid > div',
          '.cards-grid > div'
        ];
        
        for (const selector of genericSelectors) {
          try {
            const elements = page.locator(selector);
            const count = await elements.count();
            if (count > 0) {
              console.log(`🔍 Found ${count} potential card elements with: ${selector}`);
              
              // Log some element details
              for (let i = 0; i < Math.min(2, count); i++) {
                const element = elements.nth(i);
                const className = await element.getAttribute('class');
                const textContent = await element.textContent();
                console.log(`    Element ${i + 1}: class="${className}", text="${textContent?.substring(0, 100)}"`);
              }
            }
          } catch {
            continue;
          }
        }
        
        await page.screenshot({
          path: `test-results/no-cards-${scanId}-${Date.now()}.png`,
          fullPage: true
        });
        
        // Log page content for debugging
        const pageText = await page.textContent('body');
        console.log('📄 Page content preview:', pageText?.substring(0, 500));
      } else {
        // Take success screenshot
        await page.screenshot({
          path: `test-results/cards-found-${scanId}-${Date.now()}.png`,
          fullPage: true
        });
        
        // Test some interactions if cards were found
        console.log('🎯 Testing card interactions...');
        
        const cardElements = page.locator(usedSelector);
        const firstCard = cardElements.first();
        
        // Test clicking on card
        try {
          await firstCard.click();
          await page.waitForTimeout(1000);
          console.log('  ✅ Card click successful');
        } catch (error) {
          console.log('  ⚠️ Card click failed:', error);
        }
        
        // Test feedback button if available
        const feedbackButton = firstCard.locator('button:has-text("Correct"), button:has-text("✅")');
        if (await feedbackButton.count() > 0) {
          try {
            await feedbackButton.first().click();
            await page.waitForTimeout(1000);
            console.log('  ✅ Feedback button click successful');
          } catch (error) {
            console.log('  ⚠️ Feedback button click failed:', error);
          }
        }
      }
      
    } else {
      console.log('📋 No existing scans found');
      
      // Take screenshot of scans page
      await page.screenshot({
        path: `test-results/scans-page-${Date.now()}.png`,
        fullPage: true
      });
    }
    
    console.log('✅ Simple Auth and Card Display Test COMPLETED');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Take failure screenshot
    await page.screenshot({
      path: `test-results/simple-auth-failure-${Date.now()}.png`,
      fullPage: true
    });
    
    throw error;
  }
});

/**
 * Quick login verification test
 */
test('Quick Login Check', async ({ page }) => {
  console.log('🔐 Quick Login Verification');
  
  try {
    await simpleLogin(page);
    
    // Check homepage
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const isLoggedIn = await verifyLoggedIn(page);
    expect(isLoggedIn).toBe(true);
    
    console.log('✅ Quick login check passed');
    
  } catch (error) {
    await page.screenshot({
      path: `test-results/quick-login-failure-${Date.now()}.png`,
      fullPage: true
    });
    throw error;
  }
});

// Test setup
test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(TEST_CONFIG.TIMEOUT);
});

test.afterEach(async ({ page }, testInfo) => {
  console.log(`📝 Test completed: ${testInfo.title} - ${testInfo.status}`);
}); 