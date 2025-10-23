// Braindead simple A/B testing
export function getVariant(testName: string): 'A' | 'B' {
  if (typeof window === 'undefined') return 'A';
  
  const key = `ab-${testName}`;
  const stored = localStorage.getItem(key);
  
  if (stored) return stored as 'A' | 'B';
  
  const variant = Math.random() < 0.5 ? 'A' : 'B';
  localStorage.setItem(key, variant);
  return variant;
}

// Track A/B test interactions
export function trackABTest(testName: string, variant: string, action: string) {
  console.log(`AB Test: ${testName} - ${variant} - ${action}`);
  // You can send this to analytics later
}
