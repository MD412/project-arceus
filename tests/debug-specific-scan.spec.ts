import { test, expect } from '@playwright/test';

/**
 * Deep debug test for scan 5fce73e4-8524-449c-ba7f-2b3d934b3618
 * The user says there should be cards but our test shows 0
 */
test('Deep Debug - Specific Scan Investigation', async ({ page }) => {
  const scanId = '5fce73e4-8524-449c-ba7f-2b3d934b3618';
  
  console.log(`🔍 Deep debugging scan: ${scanId}`);
  
  // Login first
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  console.log('✅ Logged in');
  
  // 1. Check the API response in detail
  console.log('\n🌐 STEP 1: API Investigation');
  const apiResponse = await page.request.get(`/api/scans/${scanId}`);
  
  if (apiResponse.ok()) {
    const data = await apiResponse.json();
    console.log('📊 Full API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check if there are card_detections in the database
    console.log('\n🔍 Looking for card_detections...');
    if (data.results) {
      console.log(`  - enriched_cards: ${data.results.enriched_cards?.length || 'missing'}`);
      console.log(`  - total_cards_detected: ${data.results.total_cards_detected}`);
      console.log(`  - summary_image_path: ${data.results.summary_image_path || 'missing'}`);
    }
  } else {
    console.log(`❌ API failed: ${apiResponse.status()}`);
  }
  
  // 2. Check the main scan page
  console.log('\n📋 STEP 2: Main Scan Page');
  await page.goto(`http://localhost:3000/scans/${scanId}`);
  await page.waitForTimeout(3000);
  
  // Take screenshot of main page
  await page.screenshot({
    path: `test-results/debug-main-page-${scanId}.png`,
    fullPage: true
  });
  
  // Check what's on the main page
  const mainPageText = await page.textContent('body');
  console.log('📄 Main page contains:');
  console.log(`  - "Total Cards Detected": ${mainPageText?.includes('Total Cards Detected')}`);
  console.log(`  - "Processing Summary": ${mainPageText?.includes('Processing Summary')}`);
  console.log(`  - "Detected Cards": ${mainPageText?.includes('Detected Cards')}`);
  console.log(`  - "Complete Review": ${mainPageText?.includes('Complete Review')}`);
  
  // Look for the summary image
  const summaryImage = page.locator('img[alt*="Summary"], img[src*="summary"]');
  const summaryImageCount = await summaryImage.count();
  console.log(`  - Summary images found: ${summaryImageCount}`);
  
  if (summaryImageCount > 0) {
    const imageSrc = await summaryImage.first().getAttribute('src');
    console.log(`  - Summary image src: ${imageSrc}`);
  }
  
  // 3. Check the review page
  console.log('\n📋 STEP 3: Review Page');
  await page.goto(`http://localhost:3000/scans/${scanId}/review`);
  await page.waitForTimeout(3000);
  
  // Take screenshot of review page
  await page.screenshot({
    path: `test-results/debug-review-page-${scanId}.png`,
    fullPage: true
  });
  
  const reviewPageText = await page.textContent('body');
  console.log('📄 Review page contains:');
  console.log(`  - "All Cards": ${reviewPageText?.includes('All Cards')}`);
  
  // Extract the card count from "All Cards (X)"
  const cardCountMatch = reviewPageText?.match(/All Cards \((\d+)\)/);
  if (cardCountMatch) {
    console.log(`  - Cards shown in UI: ${cardCountMatch[1]}`);
  }
  
  // 4. Check for any hidden or loading elements
  console.log('\n🔍 STEP 4: Hidden Elements Check');
  
  // Look for any elements that might contain card data
  const allDivs = page.locator('div');
  const divCount = await allDivs.count();
  console.log(`📊 Total divs on page: ${divCount}`);
  
  // Look for elements with card-related classes (even if hidden)
  const cardRelatedElements = page.locator('[class*="card"], [class*="detection"], [data-testid*="card"]');
  const cardRelatedCount = await cardRelatedElements.count();
  console.log(`📊 Card-related elements: ${cardRelatedCount}`);
  
  if (cardRelatedCount > 0) {
    for (let i = 0; i < Math.min(5, cardRelatedCount); i++) {
      const element = cardRelatedElements.nth(i);
      const className = await element.getAttribute('class');
      const isVisible = await element.isVisible();
      const textContent = await element.textContent();
      console.log(`  Element ${i + 1}: class="${className}", visible=${isVisible}, text="${textContent?.substring(0, 50)}"`);
    }
  }
  
  // 5. Check browser console for errors
  console.log('\n🚨 STEP 5: Console Errors');
  const consoleLogs: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    }
  });
  
  // Refresh to catch any console errors
  await page.reload();
  await page.waitForTimeout(2000);
  
  if (consoleLogs.length > 0) {
    console.log('🚨 JavaScript Errors:');
    consoleLogs.forEach(log => console.log(`  ${log}`));
  } else {
    console.log('✅ No JavaScript errors found');
  }
  
  // 6. Check database directly (if possible via API)
  console.log('\n🗄️ STEP 6: Database Check');
  
  // Try to check if there are card_detections for this scan
  try {
    const detectionsResponse = await page.request.get(`/api/debug-scan/${scanId}`);
    if (detectionsResponse.ok()) {
      const detectionsData = await detectionsResponse.json();
      console.log('📊 Card detections from database:', detectionsData);
    } else {
      console.log('⚠️ No debug endpoint available for card detections');
    }
  } catch (error) {
    console.log('⚠️ Could not check card detections directly');
  }
  
  console.log('\n🎯 INVESTIGATION COMPLETE');
  console.log('Check the screenshots and logs above to understand the discrepancy');
}); 