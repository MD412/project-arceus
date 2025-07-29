import { test, expect } from '@playwright/test';

/**
 * Debug stuck scans - find and analyze scans that are stuck in processing
 */
test('Debug Stuck Scans', async ({ page }) => {
  console.log('🔍 Debugging stuck scans...');
  
  // Login first
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  console.log('✅ Logged in');
  
  // Step 1: Get all scans via API
  console.log('\n📊 STEP 1: Fetching all scans');
  const scansResponse = await page.request.get('/api/scans');
  
  if (!scansResponse.ok()) {
    throw new Error(`Failed to fetch scans: ${scansResponse.status()}`);
  }
  
  const allScans = await scansResponse.json();
  console.log(`📋 Found ${allScans.length} total scans`);
  
  // Step 2: Identify stuck scans
  console.log('\n🔍 STEP 2: Identifying stuck scans');
  
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
  
  const stuckScans = allScans.filter((scan: any) => {
    const createdAt = new Date(scan.created_at);
    const updatedAt = new Date(scan.updated_at);
    
    // Consider stuck if:
    // 1. Status is 'queued' or 'processing' 
    // 2. AND created more than 5 minutes ago
    // 3. AND not updated in last 2 minutes
    const isStuckStatus = ['queued', 'processing', 'pending'].includes(scan.processing_status);
    const isOldEnough = createdAt < fiveMinutesAgo;
    const notRecentlyUpdated = updatedAt < new Date(now.getTime() - 2 * 60 * 1000);
    
    return isStuckStatus && isOldEnough && notRecentlyUpdated;
  });
  
  console.log(`🚨 Found ${stuckScans.length} potentially stuck scans`);
  
  // Step 3: Analyze each stuck scan
  if (stuckScans.length > 0) {
    console.log('\n🔬 STEP 3: Analyzing stuck scans');
    
    for (let i = 0; i < stuckScans.length; i++) {
      const scan = stuckScans[i];
      const timeSinceCreated = Math.round((now.getTime() - new Date(scan.created_at).getTime()) / (1000 * 60));
      const timeSinceUpdated = Math.round((now.getTime() - new Date(scan.updated_at).getTime()) / (1000 * 60));
      
      console.log(`\n📋 Stuck Scan ${i + 1}: ${scan.id}`);
      console.log(`   Title: ${scan.scan_title}`);
      console.log(`   Status: ${scan.processing_status}`);
      console.log(`   Created: ${timeSinceCreated} minutes ago`);
      console.log(`   Last Updated: ${timeSinceUpdated} minutes ago`);
      console.log(`   Storage Path: ${scan.storage_path}`);
      console.log(`   Error Message: ${scan.error_message || 'None'}`);
      
      // Check if there are any results
      if (scan.results) {
        console.log(`   Has Results: Yes (${scan.results.total_cards_detected || 0} cards)`);
      } else {
        console.log(`   Has Results: No`);
      }
      
      // Try to get more details via individual API call
      try {
        const detailResponse = await page.request.get(`/api/scans/${scan.id}`);
        if (detailResponse.ok()) {
          const details = await detailResponse.json();
          console.log(`   API Status: ${details.processing_status}`);
          console.log(`   API Cards: ${details.results?.total_cards_detected || 0}`);
        }
      } catch (error) {
        console.log(`   API Check: Failed`);
      }
    }
    
    // Step 4: Check job queue status (if endpoint exists)
    console.log('\n⚙️ STEP 4: Checking job queue');
    
    // Try to check if there are pending jobs
    for (const scan of stuckScans.slice(0, 3)) { // Check first 3
      try {
        // This might not exist, but let's try
        const jobResponse = await page.request.get(`/api/debug-job/${scan.id}`);
        if (jobResponse.ok()) {
          const jobData = await jobResponse.json();
          console.log(`   Job for ${scan.id}: ${JSON.stringify(jobData)}`);
        }
      } catch (error) {
        // Expected if endpoint doesn't exist
      }
    }
    
    // Step 5: Provide solutions
    console.log('\n🔧 STEP 5: Recommended Solutions');
    
    console.log('💡 Solution Options:');
    console.log('   1. Use the "Fix Stuck Scans" API endpoint');
    console.log('   2. Retry processing individual scans');
    console.log('   3. Check if worker is running');
    console.log('   4. Clear failed jobs and restart');
    
    // Try the fix-stuck endpoint
    console.log('\n🛠️ STEP 6: Attempting to fix stuck scans');
    
    try {
      const fixResponse = await page.request.post('/api/scans/fix-stuck');
      
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
        console.log(`❌ Fix attempt failed: ${fixResponse.status()}`);
      }
    } catch (error) {
      console.log(`❌ Fix attempt error: ${error}`);
    }
    
    // Step 7: Re-check after fix attempt
    console.log('\n🔄 STEP 7: Re-checking scan status after fix');
    
    for (const scan of stuckScans.slice(0, 3)) {
      try {
        const recheckResponse = await page.request.get(`/api/scans/${scan.id}`);
        if (recheckResponse.ok()) {
          const recheckData = await recheckResponse.json();
          console.log(`   ${scan.id}: ${recheckData.processing_status} (was ${scan.processing_status})`);
        }
      } catch (error) {
        console.log(`   ${scan.id}: Could not recheck`);
      }
    }
    
  } else {
    console.log('✅ No stuck scans found - all scans appear to be processing normally');
  }
  
  // Step 8: Show current processing scans
  console.log('\n📊 STEP 8: Current scan status summary');
  
  const statusCounts: Record<string, number> = {};
  allScans.forEach((scan: any) => {
    statusCounts[scan.processing_status] = (statusCounts[scan.processing_status] || 0) + 1;
  });
  
  console.log('📈 Scan Status Distribution:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });
  
  // Take final screenshot
  await page.screenshot({
    path: `test-results/stuck-scans-debug-${Date.now()}.png`,
    fullPage: true
  });
  
  console.log('\n🎯 DEBUG COMPLETE');
  console.log('Check the output above for stuck scan details and fix results');
}); 