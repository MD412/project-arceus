import { test, expect } from '@playwright/test';

/**
 * Find any scans with cards to debug the naming issue
 */
test('Find Scans With Cards', async ({ page }) => {
  console.log('🔍 Looking for ANY scans with cards...');
  
  // Login first
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  console.log('✅ Logged in');
  
  // Check scans page for any cards
  console.log('\n📋 Checking scans page...');
  
  await page.goto('/scans');
  await page.waitForTimeout(3000);
  
  const scanElements = page.locator('a[href*="/scans/"]');
  const scanCount = await scanElements.count();
  
  console.log(`📊 Found ${scanCount} total scans`);
  
  // Check ALL scans, regardless of status
  for (let i = 0; i < Math.min(20, scanCount); i++) {
    const scanHref = await scanElements.nth(i).getAttribute('href');
    const scanId = scanHref?.split('/scans/')[1]?.split('/')[0];
    
    if (scanId) {
      console.log(`\n🔍 Scan ${i + 1}: ${scanId}`);
      
      try {
        const response = await page.request.get(`/api/scans/${scanId}`);
        
        if (response.ok()) {
          const data = await response.json();
          const cardCount = data.results?.enriched_cards?.length || 0;
          
          console.log(`   Status: ${data.processing_status}`);
          console.log(`   Cards: ${cardCount}`);
          console.log(`   Title: ${data.scan_title || 'Untitled'}`);
          
          if (cardCount > 0) {
            console.log(`🎉 FOUND SCAN WITH CARDS!`);
            console.log(`   📊 ${cardCount} cards found`);
            
            // Show first few card names
            data.results.enriched_cards.slice(0, 3).forEach((card: any, index: number) => {
              console.log(`   🃏 Card ${index + 1}: "${card.card_name}"`);
              console.log(`      ID: ${card.card_id}`);
              console.log(`      Success: ${card.enrichment_success}`);
              console.log(`      Confidence: ${card.identification_confidence}%`);
            });
            
            // Test this scan's review page
            console.log(`\n🎭 Testing review page for scan: ${scanId}`);
            
            await page.goto(`/scans/${scanId}/review`);
            await page.waitForTimeout(5000);
            
            // Take screenshot
            await page.screenshot({
              path: `test-results/scan-with-cards-${scanId}-${Date.now()}.png`,
              fullPage: true
            });
            
            // Check what names are displayed
            const cardNameElements = page.locator('.card-name');
            const uiCardCount = await cardNameElements.count();
            
            console.log(`   📋 UI shows ${uiCardCount} card names:`);
            
            for (let j = 0; j < Math.min(3, uiCardCount); j++) {
              const uiName = await cardNameElements.nth(j).textContent();
              const apiName = data.results.enriched_cards[j]?.card_name;
              
              console.log(`   🔍 Card ${j + 1}:`);
              console.log(`      API: "${apiName}"`);
              console.log(`      UI:  "${uiName}"`);
              
              // Check if it looks like OCR
              const looksLikeOCR = apiName?.includes('TRAINER') || 
                                  apiName?.includes('|') || 
                                  apiName?.includes('_') ||
                                  /^\d+/.test(apiName || '');
              
              console.log(`      OCR-like: ${looksLikeOCR ? '🚨 YES' : '✅ NO'}`);
            }
            
            console.log('\n🎯 ANALYSIS COMPLETE FOR THIS SCAN');
            break; // Found one, that's enough for debugging
          }
        } else {
          console.log(`   ❌ API failed: ${response.status()}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error}`);
      }
    }
  }
  
  console.log('\n🎯 SEARCH COMPLETE');
}); 