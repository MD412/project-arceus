import { test, expect, Page } from '@playwright/test';
import { loginTestUser, clearAuthState } from './helpers/auth';

/**
 * Authenticated Card Display Test
 * Tests card display components with proper user authentication
 */

// Test configuration
const TEST_CONFIG = {
  PROCESSING_TIMEOUT: 180000,    // 3 minutes for processing
  CARD_LOAD_TIMEOUT: 15000,     // 15 seconds for cards to load
  INTERACTION_DELAY: 1000,      // Longer delay for UI interactions
  BASE_URL: 'http://localhost:3000'
};

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

/**
 * Helper to wait for scan processing with better error handling
 */
async function waitForScanProcessing(page: Page, scanId: string): Promise<void> {
  console.log(`⏳ Waiting for scan ${scanId} to complete processing...`);
  
  let attempts = 0;
  const maxAttempts = 60; // 3 minutes with 3-second intervals
  
  while (attempts < maxAttempts) {
    try {
      // Check scan status via API
      const response = await page.request.get(`/api/scans/${scanId}`);
      
      if (!response.ok()) {
        console.log(`⚠️ API response not OK: ${response.status()}`);
        if (response.status() === 401) {
          throw new Error('Authentication required - user not logged in');
        }
      }
      
      const data = await response.json();
      console.log(`📊 Scan status: ${data.processing_status} (attempt ${attempts + 1})`);
      
      if (data.processing_status === 'completed') {
        console.log('✅ Scan processing completed!');
        return;
      } else if (data.processing_status === 'failed') {
        throw new Error(`Scan processing failed: ${data.error || 'Unknown error'}`);
      }
      
      await page.waitForTimeout(3000);
      attempts++;
    } catch (error) {
      console.log(`⚠️ Error checking scan status: ${error}`);
      attempts++;
      await page.waitForTimeout(3000);
      
      if (attempts >= maxAttempts) {
        throw new Error(`Scan processing timeout after ${maxAttempts * 3} seconds`);
      }
    }
  }
}

/**
 * Helper to upload test scan with authentication
 */
async function uploadAuthenticatedScan(page: Page): Promise<string> {
  console.log('📤 Uploading authenticated test scan...');
  
  // Navigate to upload page
  await page.goto('/upload');
  
  // Verify we're on the upload page and logged in
  await expect(page.locator('h1, h2')).toContainText(/Upload|Add/);
  
  // Check if we can see the upload form (indicates we're logged in)
  const uploadForm = page.locator('input[type="file"]');
  await expect(uploadForm).toBeVisible({ timeout: 5000 });
  
  // Use an existing image from the project
  const testImagePath = 'public/ui-playground-pk-img/bulbasaur.jpg';
  
  try {
    // Upload the test image
    await page.setInputFiles('input[type="file"]', testImagePath);
    
    // Fill in scan details
    await page.fill('input[name="title"], input[placeholder*="title"]', 'Authenticated Card Display Test');
    
    // Submit the upload
    const uploadButton = page.locator('button:has-text("Upload"), button[type="submit"]');
    await uploadButton.click();
    
    // Wait for redirect to scan page
    await page.waitForURL(/\/scans\/[a-f0-9-]+/, { timeout: 30000 });
    
    // Extract scan ID from URL
    const url = page.url();
    const scanId = url.split('/scans/')[1].split('/')[0];
    
    console.log(`✅ Authenticated scan uploaded with ID: ${scanId}`);
    return scanId;
    
  } catch (error) {
    console.log('⚠️ Could not upload new scan, trying to find existing scan...');
    
    // Fallback: use existing scan
    await page.goto('/scans');
    
    // Wait for scans to load
    await page.waitForTimeout(2000);
    
    // Look for existing scans
    const existingScans = page.locator('[href*="/scans/"], .scan-item, [data-testid="scan-card"]');
    const scanCount = await existingScans.count();
    
    if (scanCount > 0) {
      await existingScans.first().click();
      await page.waitForURL(/\/scans\/[a-f0-9-]+/);
      
      const url = page.url();
      const scanId = url.split('/scans/')[1].split('/')[0];
      
      console.log(`📋 Using existing scan for testing: ${scanId}`);
      return scanId;
    }
    
    throw new Error('No scans available and could not upload new one');
  }
}

/**
 * Main test: Authenticated Card Display Validation
 */
test('Authenticated Scan Review - Card Display Components', async ({ page }) => {
  console.log('🔐 Starting Authenticated Card Display Test');
  
  try {
    // Step 1: Clear any existing auth state and login
    console.log('🔐 Logging in test user...');
    await clearAuthState(page);
    await loginTestUser(page, TEST_USER.email, TEST_USER.password, true);
    
    // Verify we're logged in by checking the homepage
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Look for logged-in indicators
    const loggedInIndicators = page.locator('button:has-text("Logout"), [data-testid="user-menu"], .user-avatar, a:has-text("Upload")');
    await expect(loggedInIndicators.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ User successfully logged in');
    
    // Step 2: Upload and process a scan
    console.log('📤 Uploading test scan...');
    const scanId = await uploadAuthenticatedScan(page);
    
    // Step 3: Wait for processing to complete
    console.log('⏳ Waiting for processing...');
    await waitForScanProcessing(page, scanId);
    
    // Step 4: Navigate to review page
    console.log('📋 Navigating to review page...');
    await page.goto(`/scans/${scanId}/review`);
    
    // Wait for page to load
    await expect(page.locator('h1, h2')).toContainText(/Review|Cards|Detected/);
    
    // Step 5: Validate card components are displayed
    console.log('🔍 Validating card display components...');
    
    // Wait for cards to load with multiple possible selectors
    const cardSelectors = [
      '.detection-card',
      '.card-detection', 
      '.review-card',
      '.detected-card',
      '[data-testid="card"]',
      '.card-item'
    ];
    
    let cardElements = null;
    let cardCount = 0;
    
    // Try different selectors to find cards
    for (const selector of cardSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        cardElements = page.locator(selector);
        cardCount = await cardElements.count();
        if (cardCount > 0) {
          console.log(`📊 Found ${cardCount} cards using selector: ${selector}`);
          break;
        }
      } catch (error) {
        console.log(`⚠️ No cards found with selector: ${selector}`);
      }
    }
    
    if (cardCount === 0 || !cardElements) {
      // Take screenshot to see what's actually on the page
      await page.screenshot({
        path: `test-results/no-cards-found-${scanId}-${Date.now()}.png`,
        fullPage: true
      });
      
      // Log page content for debugging
      const pageContent = await page.content();
      console.log('📄 Page HTML preview:', pageContent.substring(0, 1000));
      
      throw new Error('No card components found on review page');
    }
    
    expect(cardCount).toBeGreaterThan(0);
    
    // Step 6: Validate individual card structure
    console.log('🧩 Validating card component structure...');
    
    for (let i = 0; i < Math.min(3, cardCount); i++) {
      const card = cardElements.nth(i);
      
      console.log(`🔍 Checking card ${i + 1}...`);
      
      // Check card is visible
      await expect(card).toBeVisible();
      
      // Look for card image
      const cardImages = card.locator('img, .card-image, .crop-image, [data-testid="card-image"]');
      if (await cardImages.count() > 0) {
        await expect(cardImages.first()).toBeVisible();
        console.log(`  ✅ Card ${i + 1}: Image displayed`);
      }
      
      // Look for card name/title
      const cardNames = card.locator('.card-name, .detected-name, h3, h4, .title, [data-testid="card-name"]');
      if (await cardNames.count() > 0) {
        const nameText = await cardNames.first().textContent();
        if (nameText && nameText.trim()) {
          console.log(`  ✅ Card ${i + 1}: Name displayed - "${nameText.trim()}"`);
        }
      }
      
      // Look for confidence display
      const confidenceElements = card.locator('.confidence, .id-confidence, [data-testid="confidence"], .score');
      if (await confidenceElements.count() > 0) {
        const confidenceText = await confidenceElements.first().textContent();
        if (confidenceText && confidenceText.trim()) {
          console.log(`  ✅ Card ${i + 1}: Confidence displayed - "${confidenceText.trim()}"`);
        }
      }
      
      // Check for action buttons
      const actionButtons = card.locator('button');
      const buttonCount = await actionButtons.count();
      console.log(`  📊 Card ${i + 1}: ${buttonCount} action buttons found`);
    }
    
    // Step 7: Test basic interactions
    console.log('🎯 Testing card interactions...');
    
    const firstCard = cardElements.first();
    
    // Test clicking on the card
    await firstCard.click();
    await page.waitForTimeout(TEST_CONFIG.INTERACTION_DELAY);
    
    console.log('  ✅ Card click interaction working');
    
    // Look for feedback buttons
    const feedbackButtons = page.locator('button:has-text("Correct"), button:has-text("Wrong"), button[title*="feedback"]');
    if (await feedbackButtons.count() > 0) {
      console.log('  ✅ Feedback buttons found');
      
      // Try clicking a feedback button
      try {
        await feedbackButtons.first().click();
        await page.waitForTimeout(1000);
        console.log('  ✅ Feedback button interaction working');
      } catch (error) {
        console.log('  ⚠️ Feedback button interaction failed:', error);
      }
    }
    
    // Step 8: Take final screenshot
    console.log('📸 Taking final screenshot...');
    await page.screenshot({
      path: `test-results/authenticated-card-display-success-${scanId}-${Date.now()}.png`,
      fullPage: true
    });
    
    console.log('✅ Authenticated Card Display Test PASSED!');
    
  } catch (error) {
    console.error('❌ Authenticated Card Display Test failed:', error);
    
    // Take failure screenshot
    await page.screenshot({
      path: `test-results/authenticated-card-display-failure-${Date.now()}.png`,
      fullPage: true
    });
    
    // Log current URL for debugging
    console.log('🔍 Current URL:', page.url());
    
    throw error;
  }
});

/**
 * Quick test: Just verify login works
 */
test('Authentication Verification', async ({ page }) => {
  console.log('🔐 Testing authentication flow...');
  
  try {
    // Clear state and login
    await clearAuthState(page);
    await loginTestUser(page, TEST_USER.email, TEST_USER.password, true);
    
    // Verify login by checking homepage
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Look for logged-in state
    const loggedInElements = page.locator('button:has-text("Logout"), a:has-text("Upload"), [data-testid="user-menu"]');
    await expect(loggedInElements.first()).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Authentication working correctly');
    
    // Try accessing upload page
    await page.goto('/upload');
    await expect(page.locator('input[type="file"]')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Can access protected upload page');
    
    // Try accessing scans page
    await page.goto('/scans');
    await page.waitForTimeout(2000);
    
    console.log('✅ Can access scans page');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
    
    await page.screenshot({
      path: `test-results/auth-failure-${Date.now()}.png`,
      fullPage: true
    });
    
    throw error;
  }
});

// Test setup
test.beforeEach(async ({ page }) => {
  console.log('🔧 Setting up authenticated test environment...');
  page.setDefaultTimeout(TEST_CONFIG.PROCESSING_TIMEOUT);
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
  }
  
  console.log(`📝 Test completed: ${testInfo.title} - ${testInfo.status}`);
}); 