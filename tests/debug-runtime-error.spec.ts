import { test, expect } from '@playwright/test';

/**
 * Debug the runtime error causing scans page issues
 */
test('Debug Runtime Error', async ({ page }) => {
  console.log('🔍 Debugging runtime error...');
  
  // Set up console logging to catch JavaScript errors
  const consoleMessages: string[] = [];
  const errors: string[] = [];
  
  page.on('console', msg => {
    const text = `${msg.type()}: ${msg.text()}`;
    consoleMessages.push(text);
    console.log(`🖥️ Console: ${text}`);
  });
  
  page.on('pageerror', error => {
    const errorText = `Page Error: ${error.message}`;
    errors.push(errorText);
    console.log(`🚨 ${errorText}`);
    console.log(`   Stack: ${error.stack}`);
  });
  
  // Check if dev server is running
  console.log('🌐 Checking if dev server is accessible...');
  
  try {
    await page.goto('http://localhost:3000', { timeout: 10000 });
    console.log('✅ Dev server is accessible');
  } catch (error) {
    console.log('❌ Dev server not accessible:', error);
    console.log('💡 Make sure to run: npm run dev');
    return;
  }
  
  // Try to login
  console.log('\n🔐 Testing login...');
  
  try {
    await page.goto('/login');
    await page.waitForTimeout(2000);
    
    // Check if login page loads
    const loginForm = page.locator('input[type="email"]');
    const isLoginPageLoaded = await loginForm.count() > 0;
    
    if (isLoginPageLoaded) {
      console.log('✅ Login page loaded successfully');
      
      // Try to login
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      console.log('✅ Login attempt completed');
    } else {
      console.log('❌ Login page not loaded properly');
    }
    
  } catch (error) {
    console.log('❌ Login failed:', error);
  }
  
  // Try to access scans page
  console.log('\n📋 Testing scans page...');
  
  try {
    await page.goto('/scans');
    await page.waitForTimeout(5000); // Wait longer for loading
    
    // Take screenshot
    await page.screenshot({
      path: `test-results/scans-page-debug-${Date.now()}.png`,
      fullPage: true
    });
    
    // Check page content
    const pageText = await page.textContent('body');
    console.log('📄 Page contains:');
    console.log(`   - "Loading": ${pageText?.includes('Loading')}`);
    console.log(`   - "My Scans": ${pageText?.includes('My Scans')}`);
    console.log(`   - "Project Arceus": ${pageText?.includes('Project Arceus')}`);
    
    // Check if there are any scan elements
    const scanElements = page.locator('a[href*="/scans/"], .scan-item, [data-testid="scan-card"]');
    const scanCount = await scanElements.count();
    console.log(`   - Scan elements found: ${scanCount}`);
    
    // Look for specific error messages
    const errorElements = page.locator('.error, [class*="error"]');
    const errorCount = await errorElements.count();
    
    if (errorCount > 0) {
      console.log(`🚨 Found ${errorCount} error elements on page:`);
      for (let i = 0; i < Math.min(3, errorCount); i++) {
        const errorText = await errorElements.nth(i).textContent();
        console.log(`   Error ${i + 1}: ${errorText}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Scans page failed:', error);
  }
  
  // Try to access a working page for comparison
  console.log('\n🏠 Testing home page for comparison...');
  
  try {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const homePageText = await page.textContent('body');
    console.log(`✅ Home page loaded (contains "Project Arceus": ${homePageText?.includes('Project Arceus')})`);
    
  } catch (error) {
    console.log('❌ Home page failed:', error);
  }
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`   Console messages: ${consoleMessages.length}`);
  console.log(`   Page errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n🚨 JavaScript Errors Found:');
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  if (consoleMessages.length > 0) {
    console.log('\n💬 Recent Console Messages:');
    consoleMessages.slice(-5).forEach((msg, index) => {
      console.log(`   ${index + 1}. ${msg}`);
    });
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('   1. Check the browser developer tools for more detailed error info');
  console.log('   2. Look at the Network tab for failed API requests');
  console.log('   3. Check if there are any TypeScript compilation errors');
  console.log('   4. Verify environment variables are set correctly');
  
  console.log('\n🎯 DEBUG COMPLETE');
}); 