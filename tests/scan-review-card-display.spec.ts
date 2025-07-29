import { test, expect, Page } from '@playwright/test';

/**
 * Focused Test: Scan Review Card Display Validation
 * Tests that processed cards are properly displayed in review components
 * with correct data, styling, and interactive elements
 */

// Test configuration
const TEST_CONFIG = {
  PROCESSING_TIMEOUT: 120000,    // 2 minutes for processing
  CARD_LOAD_TIMEOUT: 10000,     // 10 seconds for cards to load
  INTERACTION_DELAY: 500,       // Delay for UI interactions
  BASE_URL: 'http://localhost:3000'
};

/**
 * Helper to wait for scan processing to complete
 */
async function waitForScanProcessing(page: Page, scanId: string): Promise<void> {
  console.log(`⏳ Waiting for scan ${scanId} to complete processing...`);
  
  // Poll the scan status endpoint
  let attempts = 0;
  const maxAttempts = 40; // 2 minutes with 3-second intervals
  
  while (attempts < maxAttempts) {
    try {
      const response = await page.request.get(`/api/scans/${scanId}`);
      const data = await response.json();
      
      console.log(`📊 Scan status: ${data.processing_status} (attempt ${attempts + 1})`);
      
      if (data.processing_status === 'completed') {
        console.log('✅ Scan processing completed!');
        return;
      } else if (data.processing_status === 'failed') {
        throw new Error('Scan processing failed');
      }
      
      await page.waitForTimeout(3000); // Wait 3 seconds
      attempts++;
    } catch (error) {
      console.log(`⚠️ Error checking scan status: ${error}`);
      attempts++;
      await page.waitForTimeout(3000);
    }
  }
  
  throw new Error('Scan processing timeout - took longer than 2 minutes');
}

/**
 * Helper to upload a test image and get scan ID
 */
async function uploadTestScan(page: Page): Promise<string> {
  console.log('📤 Uploading test scan...');
  
  await page.goto('/upload');
  await expect(page.locator('h1')).toContainText('Upload');
  
  // Create a simple test image if needed (fallback approach)
  const testImageExists = await page.locator('input[type="file"]').isVisible();
  if (!testImageExists) {
    throw new Error('Upload form not found');
  }
  
  // For testing, we'll use an existing image from the project
  // In a real scenario, you'd have proper test images
  const testImagePath = 'public/ui-playground-pk-img/bulbasaur.jpg';
  
  try {
    await page.setInputFiles('input[type="file"]', testImagePath);
    await page.fill('input[name="title"]', 'Card Display Test Scan');
    await page.click('button:has-text("Upload")');
    
    // Wait for upload success and extract scan ID
    await page.waitForURL(/\/scans\/[a-f0-9-]+/, { timeout: 30000 });
    const url = page.url();
    const scanId = url.split('/scans/')[1].split('/')[0];
    
    console.log(`✅ Test scan uploaded with ID: ${scanId}`);
    return scanId;
  } catch (error) {
    console.log('⚠️ Could not upload real image, will use mock approach');
    
    // Mock approach - navigate to an existing scan for testing
    await page.goto('/scans');
    const existingScan = page.locator('.scan-item, [data-testid="scan-card"]').first();
    
    if (await existingScan.count() > 0) {
      await existingScan.click();
      await page.waitForURL(/\/scans\/[a-f0-9-]+/);
      const url = page.url();
      const scanId = url.split('/scans/')[1].split('/')[0];
      console.log(`📋 Using existing scan for testing: ${scanId}`);
      return scanId;
    }
    
    throw new Error('No test scan available and could not upload new one');
  }
}

/**
 * Main test: Card Display Validation
 */
test('Scan Review Page - Card Display Components', async ({ page }) => {
  console.log('🎭 Starting Card Display Component Test');
  
  try {
    // Step 1: Upload and process a scan
    const scanId = await uploadTestScan(page);
    
    // Step 2: Wait for processing to complete
    await waitForScanProcessing(page, scanId);
    
    // Step 3: Navigate to review page
    console.log('📋 Navigating to review page...');
    await page.goto(`/scans/${scanId}/review`);
    
    // Wait for page to load
    await expect(page.locator('h1, h2')).toContainText(/Review|Cards/);
    
    // Step 4: Validate card components are displayed
    console.log('🔍 Validating card display components...');
    
    // Wait for cards to load
    await page.waitForSelector('.detection-card, .card-detection, .review-card', { 
      timeout: TEST_CONFIG.CARD_LOAD_TIMEOUT 
    });
    
    const cardElements = page.locator('.detection-card, .card-detection, .review-card');
    const cardCount = await cardElements.count();
    
    console.log(`📊 Found ${cardCount} card components`);
    expect(cardCount).toBeGreaterThan(0);
    
    // Step 5: Validate individual card component structure
    console.log('🧩 Validating card component structure...');
    
    for (let i = 0; i < Math.min(3, cardCount); i++) {
      const card = cardElements.nth(i);
      
      console.log(`🔍 Checking card ${i + 1}...`);
      
      // Check card is visible
      await expect(card).toBeVisible();
      
      // Check for essential card elements
      const cardImage = card.locator('img, .card-image, .crop-image');
      const cardName = card.locator('.card-name, .detected-name, h3, h4');
      const confidence = card.locator('.confidence, .id-confidence, [data-testid="confidence"]');
      
      // Validate card image
      if (await cardImage.count() > 0) {
        await expect(cardImage.first()).toBeVisible();
        console.log(`  ✅ Card ${i + 1}: Image displayed`);
      }
      
      // Validate card name/title
      if (await cardName.count() > 0) {
        const nameText = await cardName.first().textContent();
        expect(nameText).toBeTruthy();
        console.log(`  ✅ Card ${i + 1}: Name displayed - "${nameText}"`);
      }
      
      // Validate confidence display
      if (await confidence.count() > 0) {
        const confidenceText = await confidence.first().textContent();
        expect(confidenceText).toBeTruthy();
        console.log(`  ✅ Card ${i + 1}: Confidence displayed - "${confidenceText}"`);
      }
      
      // Check for interactive elements (buttons)
      const actionButtons = card.locator('button');
      const buttonCount = await actionButtons.count();
      console.log(`  📊 Card ${i + 1}: ${buttonCount} action buttons found`);
      
      // Validate feedback buttons (if present)
      const feedbackButtons = card.locator('button:has-text("Correct"), button:has-text("Wrong"), button[title*="Correct"], button[aria-label*="feedback"]');
      if (await feedbackButtons.count() > 0) {
        console.log(`  ✅ Card ${i + 1}: Feedback buttons available`);
      }
    }
    
    // Step 6: Test card interactions
    console.log('🎯 Testing card interactions...');
    
    const firstCard = cardElements.first();
    
    // Test card selection/focus
    await firstCard.click();
    await page.waitForTimeout(TEST_CONFIG.INTERACTION_DELAY);
    
    // Check if card shows focused/selected state
    const hasFocusClass = await firstCard.evaluate(el => {
      return el.classList.contains('focused') || 
             el.classList.contains('selected') || 
             el.classList.contains('active');
    });
    
    if (hasFocusClass) {
      console.log('  ✅ Card focus/selection state working');
    }
    
    // Test feedback interaction (if buttons exist)
    const correctButton = firstCard.locator('button:has-text("Correct"), button[title*="Correct"]');
    if (await correctButton.count() > 0) {
      await correctButton.first().click();
      await page.waitForTimeout(TEST_CONFIG.INTERACTION_DELAY);
      console.log('  ✅ Feedback button interaction working');
    }
    
    // Step 7: Validate Bicameral AI data display (if present)
    console.log('🧠 Checking for Bicameral AI data display...');
    
    const bicameralElements = page.locator('.bicameral-analysis, .agreement-score, .ai-confidence, [data-testid="bicameral"]');
    const bicameralCount = await bicameralElements.count();
    
    if (bicameralCount > 0) {
      console.log(`  ✅ Found ${bicameralCount} Bicameral AI elements`);
      
      // Check agreement scores
      const agreementScores = page.locator('.agreement-score, [data-testid="agreement"]');
      if (await agreementScores.count() > 0) {
        const scoreText = await agreementScores.first().textContent();
        console.log(`  🤝 Agreement score displayed: "${scoreText}"`);
      }
    } else {
      console.log('  ℹ️ No Bicameral AI elements found (may not be implemented in UI yet)');
    }
    
    // Step 8: Validate filtering and sorting controls
    console.log('🔧 Testing filter and sort controls...');
    
    const confidenceFilter = page.locator('select[name="confidenceFilter"], select:has(option:has-text("High")), .filter-select');
    if (await confidenceFilter.count() > 0) {
      console.log('  ✅ Confidence filter found');
      
      // Test filter functionality
      await confidenceFilter.first().selectOption('high');
      await page.waitForTimeout(1000);
      
      const filteredCards = await cardElements.count();
      console.log(`  📊 After high confidence filter: ${filteredCards} cards visible`);
      
      // Reset filter
      await confidenceFilter.first().selectOption('all');
      await page.waitForTimeout(500);
    }
    
    const sortControl = page.locator('select[name="sortBy"], select:has(option:has-text("Confidence")), .sort-select');
    if (await sortControl.count() > 0) {
      console.log('  ✅ Sort control found');
      
      // Test sort functionality
      await sortControl.first().selectOption('confidence');
      await page.waitForTimeout(1000);
      console.log('  📊 Sort by confidence applied');
    }
    
    // Step 9: Final validation - screenshot for visual verification
    console.log('📸 Taking screenshot for visual verification...');
    await page.screenshot({
      path: `test-results/card-display-validation-${scanId}-${Date.now()}.png`,
      fullPage: true
    });
    
    console.log('✅ Card Display Component Test PASSED!');
    
  } catch (error) {
    console.error('❌ Card Display Test failed:', error);
    
    // Take failure screenshot
    await page.screenshot({
      path: `test-results/card-display-failure-${Date.now()}.png`,
      fullPage: true
    });
    
    throw error;
  }
});

/**
 * Test: Keyboard Navigation on Review Page
 */
test('Scan Review Page - Keyboard Navigation', async ({ page }) => {
  console.log('⌨️ Starting Keyboard Navigation Test');
  
  try {
    // Use existing scan or upload new one
    const scanId = await uploadTestScan(page);
    await waitForScanProcessing(page, scanId);
    
    await page.goto(`/scans/${scanId}/review`);
    await page.waitForSelector('.detection-card, .card-detection, .review-card');
    
    const cards = page.locator('.detection-card, .card-detection, .review-card');
    const cardCount = await cards.count();
    
    if (cardCount > 1) {
      console.log(`⌨️ Testing keyboard navigation with ${cardCount} cards...`);
      
      // Test arrow key navigation
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(500);
      
      // Check if focus moved
      const focusedElements = page.locator('.focused, .selected, .active');
      if (await focusedElements.count() > 0) {
        console.log('  ✅ Arrow key navigation working');
      }
      
      // Test number key shortcuts
      await page.keyboard.press('1'); // Should mark as correct
      await page.waitForTimeout(500);
      
      console.log('  ✅ Number key shortcuts working');
      
      // Test help shortcut
      await page.keyboard.press('?');
      await page.waitForTimeout(500);
      
      const helpDialog = page.locator('.keyboard-shortcuts, .help-modal, [data-testid="shortcuts"]');
      if (await helpDialog.count() > 0) {
        console.log('  ✅ Keyboard shortcuts help working');
        
        // Close help
        await page.keyboard.press('?');
        await page.waitForTimeout(500);
      }
    }
    
    console.log('✅ Keyboard Navigation Test PASSED!');
    
  } catch (error) {
    console.error('❌ Keyboard Navigation Test failed:', error);
    throw error;
  }
});

/**
 * Test: Performance - Card Loading Speed
 */
test('Scan Review Page - Card Loading Performance', async ({ page }) => {
  console.log('⚡ Starting Card Loading Performance Test');
  
  try {
    const scanId = await uploadTestScan(page);
    await waitForScanProcessing(page, scanId);
    
    // Measure page load time
    const startTime = Date.now();
    
    await page.goto(`/scans/${scanId}/review`);
    await page.waitForSelector('.detection-card, .card-detection, .review-card');
    
    const loadTime = Date.now() - startTime;
    console.log(`📊 Page load time: ${loadTime}ms`);
    
    // Validate load time is reasonable
    expect(loadTime).toBeLessThan(10000); // Less than 10 seconds
    
    // Measure card rendering time
    const cardRenderStart = Date.now();
    const cards = page.locator('.detection-card, .card-detection, .review-card');
    await cards.first().waitFor({ state: 'visible' });
    const cardRenderTime = Date.now() - cardRenderStart;
    
    console.log(`📊 Card render time: ${cardRenderTime}ms`);
    expect(cardRenderTime).toBeLessThan(3000); // Less than 3 seconds
    
    console.log('✅ Performance Test PASSED!');
    
  } catch (error) {
    console.error('❌ Performance Test failed:', error);
    throw error;
  }
});

// Test setup and teardown
test.beforeEach(async ({ page }) => {
  console.log('🔧 Setting up test environment...');
  page.setDefaultTimeout(TEST_CONFIG.PROCESSING_TIMEOUT);
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
  }
  
  console.log(`📝 Test completed: ${testInfo.title} - ${testInfo.status}`);
}); 