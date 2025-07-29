import { Page } from '@playwright/test';

/**
 * Log in a test user before running tests that require authentication
 * @param page - Playwright page object
 * @param email - User email (defaults to test@example.com)
 * @param password - User password (defaults to password123)
 * @param forceReauth - Force re-authentication even if already logged in
 */
export async function loginTestUser(
  page: Page, 
  email: string = 'test@example.com',
  password: string = 'password123',
  forceReauth: boolean = false
) {
  // Always clear auth state first to avoid pollution
  if (forceReauth) {
    await clearAuthState(page);
  }
  
  // Check if already logged in (only if not forcing reauth)
  if (!forceReauth) {
    await page.goto('/');
    
    try {
      // If we see a logout button, we're already logged in
      await page.waitForSelector('button:has-text("Logout")', { timeout: 1000 });
      console.log('Already logged in as', email);
      return;
    } catch {
      // Not logged in, proceed with login
    }
  }
  
  // Navigate to login page
  await page.goto('/login');
  
  // Fill in login form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for redirect to home page or dashboard
  await page.waitForURL(/^\/$|\/scans|\/dashboard/, { timeout: 10000 });
  
  // Verify we're logged in by checking for logout button or user menu
  await page.waitForSelector('button:has-text("Logout"), [aria-label*="user menu"], [data-testid="user-menu"]', { 
    timeout: 5000 
  });
}

/**
 * Create a new test user account
 * @param page - Playwright page object
 * @param email - Unique email for the test user
 * @param password - Password for the test user
 */
export async function signupTestUser(
  page: Page,
  email: string,
  password: string
) {
  // Navigate to signup page
  await page.goto('/signup');
  
  // Fill in signup form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for success message or redirect
  await Promise.race([
    page.waitForSelector('text=/success|welcome/i', { timeout: 10000 }),
    page.waitForURL(/^\/$|\/login/, { timeout: 10000 })
  ]);
}

/**
 * Log out the current user
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  // Click logout button
  const logoutButton = page.locator('button:has-text("Logout")');
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    // Wait for redirect to login page
    await page.waitForURL('/login', { timeout: 5000 });
  }
}

/**
 * Clear all auth state (cookies, localStorage, sessionStorage)
 * @param page - Playwright page object
 */
export async function clearAuthState(page: Page) {
  // Clear browser cookies first
  await page.context().clearCookies();
  
  try {
    // Navigate to the site first to avoid security errors with localStorage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Clear browser storage
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (error) {
        console.log('Could not clear storage:', error);
      }
    });
  } catch (error) {
    console.log('Warning: Could not clear auth state completely:', error);
  }
} 