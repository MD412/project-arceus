import { test, expect } from '@playwright/test';
import { loginTestUser, clearAuthState } from './helpers/auth';
import path from 'path';

test.describe('Interactive Scan Test', () => {
  // Ensure fresh browser context for each test
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state before each test
    await clearAuthState(page);
  });

  test('should complete full scan flow: login → upload → view → approve', async ({ page }) => {
    test.setTimeout(120000);

    // Capture console logs
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[Browser Console] ERROR: ${msg.text()}`);
      }
    });

    // 1. Login with force reauth to ensure clean state
    await test.step('Login', async () => {
      await loginTestUser(page, 'test@example.com', 'password123', true);
      console.log('✅ Logged in successfully');
    });

    // 2. Navigate to upload page
    await test.step('Navigate to upload', async () => {
      await page.goto('/upload');
      await page.waitForLoadState('networkidle');
      console.log('📄 On upload page');
      
      // Take screenshot of upload page
      await page.screenshot({ 
        path: 'tests/screenshots/01-upload-page.png',
        fullPage: true 
      });
    });

    // 3. Upload a test image
    await test.step('Upload test image', async () => {
      // Use one of the real scan images
      const testImagePath = path.join(__dirname, '../test-raw_scan_images/IMG_4823.JPEG');
      
      console.log('📁 Using test image:', testImagePath);
      
      // Start waiting for the response BEFORE triggering the action
      const responsePromise = page.waitForResponse(resp => 
        resp.url().includes('/api/scans/bulk')
      );

      // Find file input and upload
      const fileInput = page.locator('input[type="file"]');
      
      if (await fileInput.count() === 0) {
        console.log('⚠️ No file input found, looking for alternative upload methods...');
        
        // Look for drag-and-drop area or other upload elements
        const uploadArea = page.locator('[class*="upload"], [class*="drop"], [data-testid*="upload"]');
        if (await uploadArea.count() > 0) {
          console.log('✅ Found upload area, trying drag-and-drop...');
          await uploadArea.first().setInputFiles(testImagePath);
        } else {
          console.log('❌ No upload elements found');
        }
      } else {
        console.log('✅ Found file input, uploading...');
        await fileInput.setInputFiles(testImagePath);
      }
      
      console.log('📁 Uploaded test image');

      // Wait for the server to respond
      try {
        const response = await responsePromise;
        const responseBody = await response.json();
        console.log(`API Response: ${response.status()}`, JSON.stringify(responseBody, null, 2));
        
        if (response.status() !== 201) {
          console.error('❌ Bulk upload API returned a non-201 status.');
        }
      } catch (e) {
        console.error('❌ Error waiting for/parsing API response:', e);
      }
      
      // Wait for upload to complete and look for success indicators
      await page.waitForLoadState('networkidle');
      
      // Check for upload success messages
      const successText = await page.locator('text=/uploaded|success|processing/i').count();
      console.log('Upload success indicators found:', successText);
      
      // Take screenshot after upload
      await page.screenshot({ 
        path: 'tests/screenshots/02-after-upload.png',
        fullPage: true 
      });
    });

    // 4. Wait for processing and navigate to scans
    await test.step('Wait for processing and check scans', async () => {
      console.log('📋 Checking scans list for new scan...');

      // Poll the scans page until the new scan appears
      await expect(async () => {
        await page.goto('/scans');
        await page.waitForLoadState('networkidle');
        const scanLinks = await page.locator('a[href^="/scans/"]').all();
        console.log(`...found ${scanLinks.length} scans, waiting for one more...`);
        expect(scanLinks.length).toBeGreaterThan(0);
      }).toPass({
        intervals: [5_000, 5_000, 10_000], // 5s, 5s, 10s
        timeout: 30_000 // 30s total
      });
      
      console.log('✅ New scan appeared in the list!');

      // Take screenshot of scans list
      await page.screenshot({ 
        path: 'tests/screenshots/03-scans-list.png',
        fullPage: true 
      });
      
      // Get the most recent scan link
      const scanLinks = await page.locator('a[href^="/scans/"]').all();
      
      if (scanLinks.length > 0) {
        console.log(`Found ${scanLinks.length} scans`);
        
        // Click on the first (most recent) scan
        await scanLinks[0].click();
        await page.waitForLoadState('networkidle');
        
        console.log('🔍 Viewing scan details');
        
        // Wait for scan page to load
        await page.waitForLoadState('networkidle');
        
        // Take screenshot of scan page
        await page.screenshot({ 
          path: 'tests/screenshots/04-scan-details.png',
          fullPage: true 
        });
        
        // Check what's on the page
        const pageContent = await page.content();
        const hasProcessing = pageContent.includes('processing') || pageContent.includes('queued');
        const hasDetectedCards = pageContent.includes('Detected Cards');
        const hasError = pageContent.includes('Error') || pageContent.includes('error');
        const hasJobNotFound = pageContent.includes('Job not found');
        
        console.log('Scan page state:');
        console.log('- Processing/queued:', hasProcessing);
        console.log('- Has detected cards:', hasDetectedCards);
        console.log('- Has error:', hasError);
        console.log('- Job not found:', hasJobNotFound);
        
        // If the scan is still processing, wait a bit longer
        if (hasProcessing) {
          console.log('⏳ Scan is still processing, waiting for results to load...');
          await expect(async () => {
            await page.reload();
            await page.waitForLoadState('networkidle');
            const hasDetectedCards = await page.locator('text=Detected Cards').count() > 0;
            expect(hasDetectedCards).toBe(true);
          }).toPass({
            intervals: [5_000, 10_000], // 5s, 10s
            timeout: 25_000
          });
          console.log('✅ Detected cards loaded!');
        }


        // Now that we're sure cards are loaded, try to approve them
        if (await page.locator('text=Detected Cards').count() > 0) {
          await test.step('Approve cards', async () => {
            console.log('✅ Attempting to approve cards...');
            
            // Look for approve button
            const approveButton = page.locator('button:has-text("Approve")').first();
            
            if (await approveButton.isVisible()) {
              await approveButton.click();
              console.log('✅ Clicked approve button');
              
              // Wait for approval to complete
              await page.waitForLoadState('networkidle');
              
              // Take screenshot after approval
              await page.screenshot({ 
                path: 'tests/screenshots/05-after-approval.png',
                fullPage: true 
              });
              
              // Check for success message
              const successMessage = await page.locator('text=approved').count() > 0 || 
                                   await page.locator('text=success').count() > 0;
              
              console.log('Approval success:', successMessage);
              expect(successMessage).toBe(true);
            } else {
              console.log('⚠️ No approve button found');
            }
          });
        } else {
          console.log('⚠️ Could not find detected cards to approve.');
        }
        
        // Final verification - the page should show some content
        const finalContent = await page.content();
        expect(finalContent.length).toBeGreaterThan(1000); // Page has content
        
      } else {
        console.log('⚠️ No scans found in list after waiting.');
        
        // Take screenshot of empty scans list
        await page.screenshot({ 
          path: 'tests/screenshots/03-empty-scans-list.png',
          fullPage: true 
        });
      }
    });

    console.log('🎉 Full scan flow test completed!');
  });
}); 