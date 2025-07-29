# Test Credentials for Automated Testing

## Test User Account
- **Email:** test@example.com
- **Password:** password123

## Usage
These credentials are used for Playwright E2E tests to authenticate before performing actions that require a logged-in user.

## Security Note
- These are TEST ONLY credentials
- Never use these in production
- Do not commit real user credentials to the repository

## Related Files
- `tests/upload-and-review-e2e.spec.ts` - Main E2E test that requires authentication
- `tests/scan-review-e2e.spec.ts` - Scan review tests that may need auth 