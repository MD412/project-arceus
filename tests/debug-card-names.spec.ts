import { test, expect } from '@playwright/test';

/**
 * Debug card names - check what the API is returning vs what should be displayed
 */
test('Debug Card Names', async ({ page }) => {
  console.log('🔍 Debugging card names...');
  
  // Login first
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  console.log('✅ Logged in');
  
  // Find a scan with cards to test
  console.log('\n📋 Finding a completed scan with cards...');
  
  await page.goto('/scans');
  await page.waitForTimeout(3000);
  
  const scanElements = page.locator('a[href*="/scans/"]');
  const scanCount = await scanElements.count();
  
  if (scanCount === 0) {
    console.log('❌ No scans found');
    return;
  }
  
  // Find a completed scan with cards
  let scanId = '';
  let foundCompletedScan = false;
  
  for (let i = 0; i < Math.min(10, scanCount); i++) {
    const scanHref = await scanElements.nth(i).getAttribute('href');
    const testScanId = scanHref?.split('/scans/')[1]?.split('/')[0];
    
    if (testScanId) {
      console.log(`🔍 Checking scan ${i + 1}: ${testScanId}`);
      
      // Check this scan's API
      const testResponse = await page.request.get(`/api/scans/${testScanId}`);
      
      if (testResponse.ok()) {
        const testData = await testResponse.json();
        console.log(`   Status: ${testData.processing_status}, Cards: ${testData.results?.enriched_cards?.length || 0}`);
        
        if (testData.processing_status === 'completed' && 
            testData.results?.enriched_cards?.length > 0) {
          scanId = testScanId;
          foundCompletedScan = true;
          console.log(`✅ Found completed scan with ${testData.results.enriched_cards.length} cards`);
          break;
        }
      }
    }
  }
  
  if (!foundCompletedScan) {
    console.log('❌ No completed scans with cards found');
    return;
  }
  
  console.log(`🔍 Testing scan: ${scanId}`);
  
  // Check the API response
  console.log('\n🌐 Checking API response...');
  
  const apiResponse = await page.request.get(`/api/scans/${scanId}`);
  
  if (!apiResponse.ok()) {
    console.log(`❌ API failed: ${apiResponse.status()}`);
    return;
  }
  
  const data = await apiResponse.json();
  
  console.log('📊 API Response Analysis:');
  console.log(`   Processing Status: ${data.processing_status}`);
  console.log(`   Cards Found: ${data.results?.enriched_cards?.length || 0}`);
  
  if (data.results?.enriched_cards && data.results.enriched_cards.length > 0) {
    console.log('\n🃏 Card Details from API:');
    
    data.results.enriched_cards.slice(0, 5).forEach((card: any, index: number) => {
      console.log(`\n   Card ${index + 1}:`);
      console.log(`     card_name: "${card.card_name}"`);
      console.log(`     card_id: ${card.card_id}`);
      console.log(`     enrichment_success: ${card.enrichment_success}`);
      console.log(`     identification_confidence: ${card.identification_confidence}%`);
      console.log(`     set_name: "${card.set_name}"`);
      console.log(`     set_code: "${card.set_code}"`);
      console.log(`     card_number: "${card.card_number}"`);
    });
  }
  
  // Now check what the UI displays
  console.log('\n🎭 Checking UI display...');
  
  await page.goto(`/scans/${scanId}/review`);
  await page.waitForTimeout(3000);
  
  // Get the card names from the UI
  const cardNameElements = page.locator('.card-name');
  const cardNameCount = await cardNameElements.count();
  
  console.log(`📋 Found ${cardNameCount} card names in UI:`);
  
  for (let i = 0; i < Math.min(5, cardNameCount); i++) {
    const cardName = await cardNameElements.nth(i).textContent();
    console.log(`   UI Card ${i + 1}: "${cardName}"`);
  }
  
  // Compare API vs UI
  if (data.results?.enriched_cards && data.results.enriched_cards.length > 0) {
    console.log('\n🔍 API vs UI Comparison:');
    
    const apiCards = data.results.enriched_cards.slice(0, Math.min(5, cardNameCount));
    
    for (let i = 0; i < apiCards.length; i++) {
      const apiName = apiCards[i].card_name;
      const uiName = await cardNameElements.nth(i).textContent();
      
      const matches = apiName === uiName;
      console.log(`   Card ${i + 1}: ${matches ? '✅' : '❌'}`);
      console.log(`     API: "${apiName}"`);
      console.log(`     UI:  "${uiName}"`);
      
      // Analyze if the name looks like OCR output
      const looksLikeOCR = apiName.includes('|') || apiName.includes('_') || 
                          apiName.includes('TRAINER') || apiName.includes('STAGE1') ||
                          /^\d+$/.test(apiName) || apiName.length > 50;
      
      console.log(`     Looks like OCR: ${looksLikeOCR ? '🚨 YES' : '✅ NO'}`);
    }
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('   If names look like OCR output:');
  console.log('   1. Check the card database - names might be stored as OCR text');
  console.log('   2. Update the API to clean card names before returning them');
  console.log('   3. Use Pokemon TCG API to get proper card names');
  console.log('   4. Implement name cleaning logic in the API response');
  
  console.log('\n🎯 DEBUG COMPLETE');
}); 