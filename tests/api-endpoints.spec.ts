import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('should search cards via API', async ({ request }) => {
    const response = await request.get('/api/cards/search?q=scizor');
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBeTruthy();
    
    // Log results for debugging
    console.log('Card search results:', data.results);
  });

  test('should handle empty search query', async ({ request }) => {
    const response = await request.get('/api/cards/search?q=');
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.results).toEqual([]);
  });

  test('should handle approve scan endpoint', async ({ request }) => {
    // This test requires a valid scan ID - you might need to create one first
    const response = await request.post('/api/scans/test-scan-id/approve');
    
    // Should return 404 for non-existent scan
    expect(response.status()).toBe(404);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should handle scan details endpoint', async ({ request }) => {
    const response = await request.get('/api/scans/test-scan-id');
    
    // Should return 404 for non-existent scan
    expect(response.status()).toBe(404);
  });
}); 