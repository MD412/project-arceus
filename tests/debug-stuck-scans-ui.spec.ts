import { test, expect } from '@playwright/test';

/**
 * Debug stuck scans via UI - check the scans page directly
 */
test('Debug Stuck Scans via UI', async ({ page }) => {
  console.log('🔍 Debugging stuck scans via UI...');
  
  // Login first
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  console.log('✅ Logged in');
  
  // Go to scans page
  console.log('\n📋 STEP 1: Checking scans page');
  await page.goto('/scans');
  await page.waitForTimeout(3000);
  
  // Take screenshot of scans page
  await page.screenshot({
    path: `test-results/scans-page-${Date.now()}.png`,
    fullPage: true
  });
  
  // Look for scan elements
  const scanElements = page.locator('a[href*="/scans/"], .scan-item, [data-testid="scan-card"], .scan-card');
  const scanCount = await scanElements.count();
  
  console.log(`📊 Found ${scanCount} scan elements on page`);
  
  if (scanCount === 0) {
    console.log('❌ No scans found on page - might be authentication or loading issue');
    
    // Check page content
    const pageText = await page.textContent('body');
    console.log('📄 Page content preview:', pageText?.substring(0, 200));
    
    return;
  }
  
  // Analyze each scan
  console.log('\n🔍 STEP 2: Analyzing visible scans');
  
  const stuckScans: Array<{id: string, status: string, title: string}> = [];
  
  for (let i = 0; i < Math.min(20, scanCount); i++) {
    try {
      const scanElement = scanElements.nth(i);
      
      // Get scan link/ID
      let scanId = '';
      let scanTitle = '';
      let scanStatus = '';
      
      // Try to extract scan ID from href
      const href = await scanElement.getAttribute('href');
      if (href && href.includes('/scans/')) {
        scanId = href.split('/scans/')[1].split('/')[0];
      }
      
      // Get scan title/text
      const scanText = await scanElement.textContent();
      scanTitle = scanText?.trim().substring(0, 50) || 'Unknown';
      
      // Look for status indicators
      const statusElements = scanElement.locator('.status, [class*="status"], .processing, [class*="processing"]');
      const statusCount = await statusElements.count();
      
      if (statusCount > 0) {
        scanStatus = await statusElements.first().textContent() || '';
      }
      
      // Check if scan appears stuck (look for processing/queued indicators)
      const isProcessing = scanText?.toLowerCase().includes('processing') || 
                          scanText?.toLowerCase().includes('queued') ||
                          scanText?.toLowerCase().includes('pending');
      
      console.log(`📋 Scan ${i + 1}:`);
      console.log(`   ID: ${scanId || 'Unknown'}`);
      console.log(`   Title: ${scanTitle}`);
      console.log(`   Status: ${scanStatus || 'Not visible'}`);
      console.log(`   Appears Processing: ${isProcessing}`);
      
      if (isProcessing && scanId) {
        stuckScans.push({
          id: scanId,
          status: scanStatus || 'processing',
          title: scanTitle
        });
      }
      
    } catch (error) {
      console.log(`   Error analyzing scan ${i + 1}:`, error);
    }
  }
  
  console.log(`\n🚨 Found ${stuckScans.length} potentially stuck scans`);
  
  // Step 3: Try to fix stuck scans using the fix endpoint
  if (stuckScans.length > 0) {
    console.log('\n🛠️ STEP 3: Attempting to fix stuck scans');
    
    try {
      // Navigate to a page to ensure we have session cookies
      await page.goto('/');
      await page.waitForTimeout(1000);
      
      // Try the fix-stuck endpoint with proper authentication
      const fixResponse = await page.request.post('/api/scans/fix-stuck', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (fixResponse.ok()) {
        const fixResult = await fixResponse.json();
        console.log('✅ Fix Stuck Scans Result:');
        console.log(`   Fixed: ${fixResult.fixed}`);
        console.log(`   Total Found: ${fixResult.total_found}`);
        console.log(`   Message: ${fixResult.message}`);
        
        if (fixResult.errors && fixResult.errors.length > 0) {
          console.log('   Errors:');
          fixResult.errors.forEach((error: string, index: number) => {
            console.log(`     ${index + 1}. ${error}`);
          });
        }
      } else {
        const errorText = await fixResponse.text();
        console.log(`❌ Fix attempt failed: ${fixResponse.status()}`);
        console.log(`   Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Fix attempt error: ${error}`);
    }
    
    // Step 4: Try individual retry for each stuck scan
    console.log('\n🔄 STEP 4: Trying individual retry for stuck scans');
    
    for (const scan of stuckScans.slice(0, 3)) { // Only try first 3
      try {
        console.log(`🔄 Retrying scan: ${scan.id}`);
        
        const retryResponse = await page.request.post(`/api/scans/${scan.id}/retry`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (retryResponse.ok()) {
          const retryResult = await retryResponse.json();
          console.log(`   ✅ Retry successful: ${retryResult.message}`);
        } else {
          const retryError = await retryResponse.text();
          console.log(`   ❌ Retry failed (${retryResponse.status()}): ${retryError}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Retry error for ${scan.id}: ${error}`);
      }
    }
    
    // Step 5: Re-check scans page
    console.log('\n🔄 STEP 5: Re-checking scans page after fixes');
    
    await page.goto('/scans');
    await page.waitForTimeout(3000);
    
    // Take another screenshot
    await page.screenshot({
      path: `test-results/scans-page-after-fix-${Date.now()}.png`,
      fullPage: true
    });
    
    // Check if stuck scans are still there
    for (const scan of stuckScans) {
      const scanLink = page.locator(`a[href*="${scan.id}"]`);
      const isStillVisible = await scanLink.count() > 0;
      
      if (isStillVisible) {
        const scanText = await scanLink.first().textContent();
        const stillProcessing = scanText?.toLowerCase().includes('processing') || 
                               scanText?.toLowerCase().includes('queued');
        
        console.log(`   ${scan.id}: ${stillProcessing ? '🚨 Still stuck' : '✅ Status changed'}`);
      } else {
        console.log(`   ${scan.id}: ❓ Not found on page`);
      }
    }
    
  } else {
    console.log('✅ No stuck scans detected on the UI');
  }
  
  // Step 6: Manual solutions
  console.log('\n💡 STEP 6: Manual Solutions');
  console.log('If scans are still stuck, try these manual steps:');
  console.log('   1. Check if Python worker is running: `python worker/production_worker.py`');
  console.log('   2. Restart the worker process');
  console.log('   3. Check worker logs for errors');
  console.log('   4. Use the retry button on individual scans in the UI');
  console.log('   5. Check database for orphaned jobs');
  
  console.log('\n🎯 DEBUG COMPLETE');
}); 