import { test, expect } from '@playwright/test';

/**
 * Test the card name cleaning functionality
 */
test('Test Card Name Cleaning', async ({ page }) => {
  console.log('🔍 Testing card name cleaning...');
  
  // Login first
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  console.log('✅ Logged in');
  
  // Find any scan to test
  console.log('\n📋 Finding a scan to test...');
  
  await page.goto('/scans');
  await page.waitForTimeout(3000);
  
  const scanElements = page.locator('a[href*="/scans/"]');
  const scanCount = await scanElements.count();
  
  if (scanCount === 0) {
    console.log('❌ No scans found');
    return;
  }
  
  // Get the first scan ID
  const firstScanHref = await scanElements.first().getAttribute('href');
  const scanId = firstScanHref?.split('/scans/')[1]?.split('/')[0];
  
  if (!scanId) {
    console.log('❌ Could not extract scan ID');
    return;
  }
  
  console.log(`🔍 Testing scan: ${scanId}`);
  
  // Test the API with the new cleaning function
  console.log('\n🌐 Testing API with card name cleaning...');
  
  const apiResponse = await page.request.get(`/api/scans/${scanId}`);
  
  if (!apiResponse.ok()) {
    console.log(`❌ API failed: ${apiResponse.status()}`);
    return;
  }
  
  const data = await apiResponse.json();
  
  console.log('📊 API Response:');
  console.log(`   Status: ${data.processing_status}`);
  console.log(`   Cards: ${data.results?.enriched_cards?.length || 0}`);
  
  if (data.results?.enriched_cards && data.results.enriched_cards.length > 0) {
    console.log('\n🎉 Cards found! Testing name cleaning:');
    
    data.results.enriched_cards.slice(0, 5).forEach((card: any, index: number) => {
      const cardName = card.card_name;
      
      // Check if the name looks cleaned
      const looksClean = !cardName.includes('TRAINER') && 
                        !cardName.includes('|') && 
                        !cardName.includes('_') &&
                        !cardName.includes('STAGE1') &&
                        cardName.length < 50 &&
                        !/^\d+$/.test(cardName);
      
      console.log(`\n   🃏 Card ${index + 1}:`);
      console.log(`      Name: "${cardName}"`);
      console.log(`      Looks Clean: ${looksClean ? '✅ YES' : '🚨 NO'}`);
      console.log(`      Success: ${card.enrichment_success}`);
      console.log(`      Confidence: ${card.identification_confidence}%`);
      
      // Test specific cleaning patterns
      if (cardName.includes('TRAINER')) {
        console.log(`      🚨 Still contains "TRAINER" - cleaning may need improvement`);
      }
      if (cardName.includes('|')) {
        console.log(`      🚨 Still contains "|" - cleaning may need improvement`);
      }
      if (cardName.includes('_')) {
        console.log(`      🚨 Still contains "_" - cleaning may need improvement`);
      }
    });
    
    // Test the UI to see if it displays the cleaned names
    console.log('\n🎭 Testing UI display...');
    
    await page.goto(`/scans/${scanId}/review`);
    await page.waitForTimeout(5000);
    
    const cardNameElements = page.locator('.card-name');
    const uiCardCount = await cardNameElements.count();
    
    console.log(`📋 UI shows ${uiCardCount} card names:`);
    
    for (let i = 0; i < Math.min(3, uiCardCount); i++) {
      const uiName = await cardNameElements.nth(i).textContent();
      const apiName = data.results.enriched_cards[i]?.card_name;
      
      console.log(`\n   🔍 Card ${i + 1}:`);
      console.log(`      API: "${apiName}"`);
      console.log(`      UI:  "${uiName}"`);
      console.log(`      Match: ${apiName === uiName ? '✅' : '❌'}`);
      
      if (uiName && uiName !== 'Unknown Card') {
        const uiLooksClean = !uiName.includes('TRAINER') && 
                            !uiName.includes('|') && 
                            !uiName.includes('_');
        console.log(`      UI Clean: ${uiLooksClean ? '✅' : '🚨'}`);
      }
    }
    
    // Take screenshot to see results
    await page.screenshot({
      path: `test-results/cleaned-card-names-${scanId}-${Date.now()}.png`,
      fullPage: true
    });
    
  } else {
    console.log('❌ No cards found in this scan');
  }
  
  console.log('\n💡 SUMMARY:');
  console.log('   The card name cleaning function should:');
  console.log('   1. Convert "TRAINER Iono 372_1" to "Iono"');
  console.log('   2. Convert "STAGE1 Scizor #210" to "Scizor"');
  console.log('   3. Remove OCR artifacts like |, _, numbers');
  console.log('   4. Keep meaningful card names clean and readable');
  
  console.log('\n🎯 TEST COMPLETE');
}); 