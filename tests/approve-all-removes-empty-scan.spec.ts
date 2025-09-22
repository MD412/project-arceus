import { test, expect } from '@playwright/test';
import { loginTestUser } from './helpers/auth';

function uuid(): string {
  // Lightweight UUID v4 generator for test seeding
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

test.describe('Approve All removes empty scan from inbox immediately', () => {
  test('approve all hides scan from sidebar without showing 0 cards', async ({ page, request }) => {
    // 0) Login to ensure authenticated context
    await loginTestUser(page);

    // Seed a mock scan that appears in inbox
    const scanId = uuid();
    const ok = await page.evaluate(async (sid) => {
      const r = await fetch(`/api/scans/${sid}/mock`, { method: 'POST' });
      return r.ok;
    }, scanId);
    expect(ok).toBeTruthy();

    // 1) Go to review UI
    await page.goto('/scans/review');
    await page.waitForLoadState('networkidle');

    // 2) Find the first inbox item and capture a stable snippet of its text
    const list = page.locator('aside:has(h3:has-text("Scans")) ul li');
    const beforeCount = await list.count();
    expect(beforeCount).toBeGreaterThan(0);
    const firstButton = page.locator('[data-testid="inbox-scan-item"]').first();
    const selectedId = await firstButton.getAttribute('data-scan-id');
    expect(selectedId).toBeTruthy();
    await firstButton.click();

    // 6) Click Approve All
    const approveBtn = page.locator('button:has-text("Approve All")');
    await approveBtn.click();

    // 7) Assert the current scan disappears from the inbox immediately
    const afterList = page.locator('aside:has(h3:has-text("Scans")) ul li');
    await expect(page.locator(`[data-testid="inbox-scan-item"][data-scan-id="${selectedId}"]`)).toHaveCount(0, { timeout: 5000 });
    await expect.poll(async () => await afterList.count(), { timeout: 5000 }).toBeLessThan(beforeCount);
  });
});


