import { test, expect, Page } from '@playwright/test';

/**
 * Completed Scan Card Display Test
 * Tests card display on an already processed scan
 */

// Test configuration
const TEST_CONFIG = {
  TIMEOUT: 60000,
  BASE_URL: 'http://localhost:3000'
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
 * Find a completed scan with cards
 */
async function findCompletedScan(page: Page): Promise<string | null> {
  console.log('🔍 Looking for completed scans...');
  
  await page.goto('/scans');
  await page.waitForTimeout(3000);
  
  // Look for scan links
  const scanElements = page.locator('a[href*="/scans/"], .scan-item, [data-testid="scan-card"]');
  const scanCount = await scanElements.count();
  
  console.log(`📊 Found ${scanCount} total scans`);
  
  // Check each scan to find a completed one
  for (let i = 0; i < Math.min(10, scanCount); i++) {
    try {
      const scanElement = scanElements.nth(i);
      
      // Extract scan ID from href if possible
      const href = await scanElement.getAttribute('href');
      let scanId = '';
      
      if (href && href.includes('/scans/')) {
        scanId = href.split('/scans/')[1].split('/')[0];
      } else {
        // Click to get to scan page
        await scanElement.click();
        await page.waitForTimeout(2000);
        
        const url = page.url();
        if (url.includes('/scans/')) {
          scanId = url.split('/scans/')[1].split('/')[0];
        }
      }
      
      if (scanId) {
        console.log(`🔍 Checking scan ${i + 1}: ${scanId}`);
        
        // Check scan status via API
        try {
          const response = await page.request.get(`/api/scans/${scanId}`);
          if (response.ok()) {
            const data = await response.json();
            console.log(`  📊 Status: ${data.processing_status}`);
            console.log(`  🃏 Cards detected: ${data.results?.total_cards_detected || 0}`);
            
            if (data.processing_status === 'completed' && 
                data.results?.total_cards_detected > 0) {
              console.log(`✅ Found completed scan with cards: ${scanId}`);
              return scanId;
            }
          }
        } catch (error) {
          console.log(`  ⚠️ Could not check API for scan ${scanId}`);
        }
        
        // Go back to scans list for next iteration
        await page.goto('/scans');
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log(`  ⚠️ Error checking scan ${i + 1}:`, error);
      continue;
    }
  }
  
  return null;
}

/**
 * Test card display on completed scan
 */
async function testCardDisplay(page: Page, scanId: string): Promise<void> {
  console.log(`🎭 Testing card display on scan: ${scanId}`);
  
  // Navigate to review page
  const reviewUrl = `/scans/${scanId}/review`;
  console.log(`📋 Going to: ${reviewUrl}`);
  await page.goto(reviewUrl);
  await page.waitForTimeout(5000); // Give time for page to load
  
  // Take initial screenshot
  await page.screenshot({
    path: `test-results/review-page-${scanId}-${Date.now()}.png`,
    fullPage: true
  });
  
  // Check page content
  const pageTitle = await page.locator('h1, h2').first().textContent();
  console.log(`📄 Page title: "${pageTitle}"`);
  
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
        const hasCardName = await firstElement.locator('.card-name, h3, h4').count() > 0;
        
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
    for (let i = 0; i < Math.min(5, cardCount); i++) {
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
      
      // Check for buttons
      const buttons = card.locator('button');
      const buttonCount = await buttons.count();
      console.log(`  🔘 Card ${i + 1} has ${buttonCount} buttons`);
      
      if (buttonCount > 0) {
        for (let j = 0; j < Math.min(3, buttonCount); j++) {
          const buttonText = await buttons.nth(j).textContent();
          console.log(`    Button ${j + 1}: "${buttonText?.trim()}"`);
        }
      }
    }
    
    // Test interactions
    console.log('\n🎯 Testing interactions...');
    
    const firstCard = cardElements.first();
    
    // Test card click
    try {
      await firstCard.click();
      await page.waitForTimeout(1000);
      console.log('  ✅ Card click successful');
      
      // Check if card got selected/focused
      const hasSelectedClass = await firstCard.evaluate(el => 
        el.classList.contains('selected') || el.classList.contains('focused')
      );
      if (hasSelectedClass) {
        console.log('  ✅ Card shows selected/focused state');
      }
    } catch (error) {
      console.log('  ⚠️ Card click failed:', error);
    }
    
    // Test feedback buttons
    const feedbackButtons = firstCard.locator('button:has-text("Correct"), button:has-text("✅"), button[title*="Correct"]');
    if (await feedbackButtons.count() > 0) {
      try {
        await feedbackButtons.first().click();
        await page.waitForTimeout(1000);
        console.log('  ✅ Feedback button click successful');
      } catch (error) {
        console.log('  ⚠️ Feedback button click failed:', error);
      }
    }
    
    // Test keyboard navigation (if supported)
    try {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(500);
      console.log('  ✅ Keyboard navigation tested');
    } catch (error) {
      console.log('  ⚠️ Keyboard navigation not available');
    }
    
    // Take success screenshot
    await page.screenshot({
      path: `test-results/card-display-success-${scanId}-${Date.now()}.png`,
      fullPage: true
    });
    
  } else {
    console.log('❌ No card components found');
    
    // Debug: look for any content on the page
    const allDivs = page.locator('div');
    const divCount = await allDivs.count();
    console.log(`📊 Total divs on page: ${divCount}`);
    
    // Look for specific content sections
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
    
    // Check if there's an error or loading state
    const errorElements = page.locator('.error, .loading, [class*="error"], [class*="loading"]');
    const errorCount = await errorElements.count();
    if (errorCount > 0) {
      const errorText = await errorElements.first().textContent();
      console.log(`⚠️ Found error/loading state: "${errorText}"`);
    }
    
    throw new Error('No card components found on completed scan');
  }
}

/**
 * Main test: Find completed scan and test card display
 */
test('Completed Scan Card Display Test', async ({ page }) => {
  console.log('🚀 Starting Completed Scan Card Display Test');
  
  try {
    // Step 1: Login
    await simpleLogin(page);
    
    // Step 2: Verify login
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const logoutButton = page.locator('button:has-text("Logout")');
    await expect(logoutButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Successfully logged in');
    
    // Step 3: Find a completed scan
    const scanId = await findCompletedScan(page);
    
    if (!scanId) {
      throw new Error('No completed scans with cards found');
    }
    
    // Step 4: Test card display on completed scan
    await testCardDisplay(page, scanId);
    
    console.log('🎉 Completed Scan Card Display Test PASSED!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    await page.screenshot({
      path: `test-results/completed-scan-test-failure-${Date.now()}.png`,
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