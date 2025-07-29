#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Automated Test Suite...\n');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, '../tests/screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Test scenarios
const testScenarios = [
  {
    name: 'API Endpoints',
    command: 'npx playwright test tests/api-endpoints.spec.ts --headed',
    description: 'Testing backend API functionality'
  },
  {
    name: 'Scan Review Flow',
    command: 'npx playwright test tests/scan-review-flow.spec.ts --headed',
    description: 'Testing complete user workflow'
  },
  {
    name: 'Visual Regression',
    command: 'npx playwright test --headed --project=chromium',
    description: 'Taking screenshots for visual testing'
  }
];

async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const scenario of testScenarios) {
    console.log(`\n📋 Running: ${scenario.name}`);
    console.log(`📝 Description: ${scenario.description}`);
    
    try {
      execSync(scenario.command, { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log(`✅ ${scenario.name}: PASSED`);
      passed++;
    } catch (error) {
      console.log(`❌ ${scenario.name}: FAILED`);
      console.log(`Error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📸 Screenshots saved to: tests/screenshots/`);

  // Generate test report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      passed,
      failed,
      total: passed + failed
    },
    screenshots: fs.readdirSync(screenshotsDir)
  };

  fs.writeFileSync(
    path.join(__dirname, '../test-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n📄 Test report saved to: test-report.json');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error); 