import { test, expect, Page } from '@playwright/test';

/**
 * Test card display on specific scan: 5fce73e4-8524-449c-ba7f-2b3d934b3618
 */

// Test configuration
const TEST_CONFIG = {
  TIMEOUT: 60000,
  SCAN_ID: '5fce73e4-8524-449c-ba7f-2b3d934b3618',
  SCAN_URL: 'http://localhost:3000/scans/5fce73e4-8524-449c-ba7f-2b3d934b3618'
};

// Test credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

/**
 * Simple login helper
 */
async function simpleLogin(page: Page): Promise<void> {
  console.log('🔐 Logging in...');
  
  await page.goto('/login');
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
  
  await page.waitForTimeout(3000);
  console.log(`✅ Login completed`);
}

/**
 * Check scan data via API
 */
async function checkScanAPI(page: Page, scanId: string): Promise<any> {
  console.log(`🌐 Checking scan API: /api/scans/${scanId}`);
  
  const response = await page.request.get(`/api/scans/${scanId}`);
  
  if (!response.ok()) {
    throw new Error(`API request failed: ${response.status()}`);
  }
  
  const data = await response.json();
  
  console.log('📊 API Response:');
  console.log(`  - processing_status: ${data.processing_status}`);
  console.log(`  - results: ${data.results ? 'exists' : 'missing'}`);
  
  if (data.results) {
    console.log(`  - enriched_cards: ${data.results.enriched_cards ? data.results.enriched_cards.length : 'missing'}`);
    console.log(`  - total_cards_detected: ${data.results.total_cards_detected}`);
    
    if (data.results.enriched_cards && data.results.enriched_cards.length > 0) {
      console.log(`  - Card examples:`);
      data.results.enriched_cards.slice(0, 3).forEach((card: any, index: number) => {
        console.log(`    Card ${index + 1}: ${card.card_name} (confidence: ${card.identification_confidence}%)`);
      });
    }
  }
  
  return data;
}

/**
 * Test card display on the specific scan
 */
async function testCardDisplay(page: Page, scanId: string): Promise<void> {
  console.log(`🎭 Testing card display on scan: ${scanId}`);
  
  // Navigate to the specific URL
  const scanUrl = `http://localhost:3000/scans/${scanId}`;
  console.log(`📋 Going to: ${scanUrl}`);
  
  await page.goto(scanUrl);
  await page.waitForTimeout(5000); // Give time for page to load
  
  // Take screenshot of the page
  await page.screenshot({
    path: `test-results/specific-scan-${scanId}-${Date.now()}.png`,
    fullPage: true
  });
  
  // Check page content
  const pageTitle = await page.locator('h1, h2').first().textContent();
  console.log(`📄 Page title: "${pageTitle}"`);
  
  // Check if we're on the review page or main scan page
  const currentUrl = page.url();
  console.log(`📍 Current URL: ${currentUrl}`);
  
  // If we're on the main scan page, try to go to review
  if (!currentUrl.includes('/review')) {
    console.log('📋 Navigating to review page...');
    await page.goto(`${scanUrl}/review`);
    await page.waitForTimeout(3000);
  }
  
  // Look for card components with all possible selectors
  const cardSelectors = [
    '.detection-card',
    '.detections-grid .detection-card',
    '.card-item',
    '.cards-grid .card-item',
    '.enriched-card-slot',
    '.card-slot',
    'div[class*="card"]',
    'div[class*="detection"]'
  ];
  
  let cardsFound = false;
  let cardCount = 0;
  let usedSelector = '';
  
  console.log('🔍 Searching for card components...');
  
  for (const selector of cardSelectors) {
    try {
      const elements = page.locator(selector);
      cardCount = await elements.count();
      
      if (cardCount > 0) {
        console.log(`📊 Found ${cardCount} elements with selector: ${selector}`);
        
        // Verify these are actually card components
        const firstElement = elements.first();
        const hasImage = await firstElement.locator('img').count() > 0;
        const hasCardName = await firstElement.locator('.card-name, h3, h4, .detected-name').count() > 0;
        
        if (hasImage || hasCardName) {
          console.log(`✅ Confirmed ${cardCount} card components with: ${selector}`);
          cardsFound = true;
          usedSelector = selector;
          break;
        } else {
          console.log(`  ⚠️ Elements found but don't look like cards`);
        }
      }
    } catch (error) {
      continue;
    }
  }
  
  if (cardsFound) {
    console.log(`🎉 SUCCESS: Found ${cardCount} card components!`);
    
    const cardElements = page.locator(usedSelector);
    
    // Test first few cards in detail
    for (let i = 0; i < Math.min(3, cardCount); i++) {
      const card = cardElements.nth(i);
      console.log(`\n🔍 Testing card ${i + 1}:`);
      
      // Check visibility
      await expect(card).toBeVisible();
      console.log(`  ✅ Card ${i + 1} is visible`);
      
      // Check for image
      const cardImage = card.locator('img, .card-image, .crop-image');
      if (await cardImage.count() > 0) {
        const imageSrc = await cardImage.first().getAttribute('src');
        console.log(`  📸 Card ${i + 1} has image: ${imageSrc?.substring(0, 50)}...`);
      }
      
      // Check for card name
      const cardName = card.locator('.card-name, h3, h4, .detected-name');
      if (await cardName.count() > 0) {
        const nameText = await cardName.first().textContent();
        console.log(`  📝 Card ${i + 1} name: "${nameText?.trim()}"`);
      }
      
      // Check for confidence
      const confidence = card.locator('.confidence, .id-confidence, .detection-confidence');
      if (await confidence.count() > 0) {
        const confidenceText = await confidence.first().textContent();
        console.log(`  🎯 Card ${i + 1} confidence: "${confidenceText?.trim()}"`);
      }
      
      // Check for status
      const status = card.locator('.status-indicator, .status-badge');
      if (await status.count() > 0) {
        const statusText = await status.first().textContent();
        console.log(`  📊 Card ${i + 1} status: "${statusText?.trim()}"`);
      }
    }
    
    // Take success screenshot
    await page.screenshot({
      path: `test-results/card-display-success-${scanId}-${Date.now()}.png`,
      fullPage: true
    });
    
  } else {
    console.log('❌ No card components found');
    
    // Debug: Check what's actually on the page
    const pageText = await page.textContent('body');
    console.log('📄 Page contains "All Cards":', pageText?.includes('All Cards'));
    
    if (pageText?.includes('All Cards')) {
      const match = pageText.match(/All Cards \((\d+)\)/);
      if (match) {
        console.log(`📊 Page shows: All Cards (${match[1]})`);
      }
    }
    
    // Check for loading or error states
    const loadingElements = page.locator('.loading, [class*="loading"]');
    const loadingCount = await loadingElements.count();
    if (loadingCount > 0) {
      console.log(`⏳ Found ${loadingCount} loading indicators`);
    }
    
    const errorElements = page.locator('.error, [class*="error"]');
    const errorCount = await errorElements.count();
    if (errorCount > 0) {
      const errorText = await errorElements.first().textContent();
      console.log(`⚠️ Found error state: "${errorText}"`);
    }
    
    // Debug: look for any content sections
    const contentSections = page.locator('[class*="content"], [class*="section"], [class*="container"]');
    const sectionCount = await contentSections.count();
    console.log(`📊 Content sections found: ${sectionCount}`);
    
    if (sectionCount > 0) {
      for (let i = 0; i < Math.min(3, sectionCount); i++) {
        const section = contentSections.nth(i);
        const className = await section.getAttribute('class');
        const textContent = await section.textContent();
        console.log(`  Section ${i + 1}: class="${className}", text="${textContent?.substring(0, 100)}"`);
      }
    }
    
    throw new Error('No card components found on this scan page');
  }
}

/**
 * Main test: Check specific scan for card display
 */
test('Specific Scan Card Display Test', async ({ page }) => {
  console.log(`🚀 Starting test for scan: ${TEST_CONFIG.SCAN_ID}`);
  
  try {
    // Step 1: Login
    await simpleLogin(page);
    
    // Step 2: Verify login
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const logoutButton = page.locator('button:has-text("Logout")');
    await expect(logoutButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Successfully logged in');
    
    // Step 3: Check scan data via API
    const scanData = await checkScanAPI(page, TEST_CONFIG.SCAN_ID);
    
    // Step 4: Test card display
    await testCardDisplay(page, TEST_CONFIG.SCAN_ID);
    
    console.log('🎉 Specific Scan Card Display Test PASSED!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    await page.screenshot({
      path: `test-results/specific-scan-test-failure-${Date.now()}.png`,
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