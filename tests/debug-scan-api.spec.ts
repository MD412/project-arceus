import { test, expect } from '@playwright/test';

/**
 * Debug test to understand the scan API response format
 */
test('Debug Scan API Response Format', async ({ page }) => {
  console.log('🔍 Debugging scan API response format...');
  
  // Login first
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Test the API directly
  const scanId = '603c5cf4-4e21-4e3d-974c-af264c02182c'; // The completed scan we found
  
  console.log(`🌐 Testing API endpoint: /api/scans/${scanId}`);
  
  const response = await page.request.get(`/api/scans/${scanId}`);
  
  if (response.ok()) {
    const data = await response.json();
    
    console.log('📊 API Response Structure:');
    console.log(`  - processing_status: ${data.processing_status}`);
    console.log(`  - results: ${data.results ? 'exists' : 'missing'}`);
    
    if (data.results) {
      console.log(`  - results.enriched_cards: ${data.results.enriched_cards ? data.results.enriched_cards.length : 'missing'}`);
      console.log(`  - results.identified_cards: ${data.results.identified_cards ? data.results.identified_cards.length : 'missing'}`);
      console.log(`  - results.total_cards_detected: ${data.results.total_cards_detected}`);
      
      if (data.results.enriched_cards && data.results.enriched_cards.length > 0) {
        console.log(`  - First card structure:`, Object.keys(data.results.enriched_cards[0]));
        console.log(`  - First card:`, JSON.stringify(data.results.enriched_cards[0], null, 2));
      }
    }
    
    // Now test what the review page actually loads
    console.log('\n📋 Testing review page data loading...');
    
    await page.goto(`/scans/${scanId}/review`);
    await page.waitForTimeout(5000);
    
    // Check what's actually in the page
    const pageText = await page.textContent('body');
    console.log('📄 Page contains "All Cards":', pageText?.includes('All Cards'));
    
    if (pageText?.includes('All Cards')) {
      const match = pageText.match(/All Cards \((\d+)\)/);
      if (match) {
        console.log(`📊 Page shows: All Cards (${match[1]})`);
      }
    }
    
    // Check for any JavaScript errors
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(`Console Error: ${msg.text()}`);
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (consoleLogs.length > 0) {
      console.log('🚨 JavaScript Errors:');
      consoleLogs.forEach(log => console.log(`  ${log}`));
    }
    
    // Take screenshot
    await page.screenshot({
      path: `test-results/debug-scan-api-${Date.now()}.png`,
      fullPage: true
    });
    
  } else {
    console.log(`❌ API request failed: ${response.status()}`);
    const errorText = await response.text();
    console.log(`Error: ${errorText}`);
  }
}); 