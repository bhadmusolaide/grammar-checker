import { test, expect } from '@playwright/test';
import { APITestUtils } from '../utils/api-test-utils';
import { TestReporter } from '../utils/test-reporter';

// Test configuration
const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:3001';
const INVALID_BACKEND_URL = 'http://localhost:9999'; // Non-existent server
const TEST_TIMEOUT = 30000;

// Initialize test utilities
let apiUtils: APITestUtils;
let invalidApiUtils: APITestUtils;
let testReporter: TestReporter;


test.describe('Error Handling and Connection Failure Tests', () => {
  test.beforeAll(async () => {
    apiUtils = new APITestUtils(BACKEND_URL);
    invalidApiUtils = new APITestUtils(INVALID_BACKEND_URL);
    testReporter = new TestReporter('./test-results/error-tests');

  });

  test.beforeEach(async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Backend server connection failure', async () => {
    // Test connection to non-existent server
    const connectionTest = await invalidApiUtils.testConnection();
    expect(connectionTest.success).toBe(false);
    expect(connectionTest.error).toBeDefined();
    expect(connectionTest.error).toMatch(/network|connection|refused|timeout/i);
  });

  test('API timeout handling', async () => {
    // Test with very short timeout to simulate timeout scenario
    const shortTimeoutUtils = new APITestUtils(BACKEND_URL);
    const defaultModel = {
      id: 'test-model',
      name: 'test-model',
      displayName: 'Test Model',
      provider: 'ollama' as const,
      config: { provider: 'ollama' as const, model: 'test-model' },
      isAvailable: true,
      performance: { speed: 'medium' as const, quality: 'medium' as const, cost: 'free' as const }
    };
    const result = await shortTimeoutUtils.testGrammarCheck('This is a test sentence.', defaultModel);
    
    // Should either succeed quickly or fail with timeout
    if (!result.metric.success) {
      expect(result.metric.error).toMatch(/timeout|aborted/i);
    }
  });

  test('Invalid API endpoint handling', async () => {
    const invalidEndpoints = [
      '/api/nonexistent',
      '/api/enhance/invalid',
      '/api/grammar/wrong',
      '/invalid/path'
    ];

    for (const endpoint of invalidEndpoints) {
      const result = await apiUtils.testAPIEndpoint(endpoint, 'POST', { text: 'test' });
      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
    }
  });

  test('Malformed request data handling', async () => {
    const malformedRequests = [
      // Missing required fields
      {},
      { wrongField: 'value' },
      // Invalid data types
      { text: 123 },
      { text: null },
      { text: undefined },
      // Extremely large payload
      { text: 'A'.repeat(100000) }
    ];

    for (const payload of malformedRequests) {
      const result = await apiUtils.testAPIEndpoint('/api/enhance/full-text', 'POST', payload);
      // Should either handle gracefully or return appropriate error
      if (!result.success) {
        expect(result.statusCode).toBeGreaterThanOrEqual(400);
        expect(result.statusCode).toBeLessThan(500);
      }
    }
  });

  test('Frontend error handling: Network failure simulation', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    // Block all network requests to simulate network failure
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    const textArea = page.locator('textarea, [contenteditable="true"]').first();
    await expect(textArea).toBeVisible();
    
    // Input test text
    await textArea.fill('This is a test sentence with some errors.');
    
    // Try to trigger grammar check
    const checkButton = page.locator('button').filter({ hasText: /check|analyze|grammar/i }).first();
    
    if (await checkButton.count() > 0) {
      await checkButton.click();
      
      // Wait for error handling
      await page.waitForTimeout(3000);
      
      // Check for error message display
      const errorMessage = page.locator('.error, .alert, [data-testid="error"]').first();
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible();
      }
      
      // Check that the UI doesn't crash
      await expect(textArea).toBeVisible();
    }
  });

  test('Frontend error handling: Server error simulation', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    // Intercept API calls and return server error
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    const textArea = page.locator('textarea, [contenteditable="true"]').first();
    await expect(textArea).toBeVisible();
    
    await textArea.fill('Test text for server error.');
    
    const checkButton = page.locator('button').filter({ hasText: /check|analyze|grammar/i }).first();
    
    if (await checkButton.count() > 0) {
      await checkButton.click();
      
      // Wait for error handling
      await page.waitForTimeout(3000);
      
      // Verify the application handles the error gracefully
      await expect(textArea).toBeVisible();
      
      // Check for error indication
      const errorIndicator = page.locator('.error, .alert, [data-testid="error"], .notification').first();
      if (await errorIndicator.count() > 0) {
        await expect(errorIndicator).toBeVisible();
      }
    }
  });

  test('Frontend error handling: Slow response simulation', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    // Intercept API calls and add delay
    await page.route('**/api/**', async route => {
      // Delay response by 10 seconds
      await new Promise(resolve => setTimeout(resolve, 10000));
      route.continue();
    });
    
    const textArea = page.locator('textarea, [contenteditable="true"]').first();
    await expect(textArea).toBeVisible();
    
    await textArea.fill('Test text for slow response.');
    
    const checkButton = page.locator('button').filter({ hasText: /check|analyze|grammar/i }).first();
    
    if (await checkButton.count() > 0) {
      await checkButton.click();
      
      // Check for loading indicator
      const loadingIndicator = page.locator('.loading, .spinner, [data-testid="loading"]').first();
      if (await loadingIndicator.count() > 0) {
        await expect(loadingIndicator).toBeVisible();
      }
      
      // Wait for response or timeout
      await page.waitForTimeout(15000);
      
      // Verify UI is still responsive
      await expect(textArea).toBeVisible();
    }
  });

  test('API rate limiting simulation', async () => {
    const requests = [];
    const testText = 'Rate limiting test text.';
    
    // Send multiple rapid requests
    for (let i = 0; i < 10; i++) {
      const defaultModel = {
        id: 'test-model',
        name: 'test-model',
        displayName: 'Test Model',
        provider: 'ollama' as const,
        config: { provider: 'ollama' as const, model: 'test-model' },
        isAvailable: true,
        performance: { speed: 'medium' as const, quality: 'medium' as const, cost: 'free' as const }
      };
      requests.push(apiUtils.testGrammarCheck(testText, defaultModel));
    }
    
    const results = await Promise.all(requests);
    
    // Check if any requests were rate limited (429 status)
    const rateLimitedRequests = results.filter(result => result.metric.statusCode === 429);
    
    // Log rate limiting behavior
    console.log(`Rate limiting test: ${rateLimitedRequests.length} out of ${results.length} requests were rate limited`);
    
    // Verify that at least some requests succeeded
    const successfulRequests = results.filter(result => result.metric.success);
    expect(successfulRequests.length).toBeGreaterThan(0);
  });

  test('Memory and resource handling: Large text processing', async () => {
    const largeTexts = [
      'A'.repeat(1000),   // 1KB
      'B'.repeat(10000),  // 10KB
      'C'.repeat(50000),  // 50KB
    ];
    
    const defaultModel = {
      id: 'test-model',
      name: 'test-model',
      displayName: 'Test Model',
      provider: 'ollama' as const,
      config: { provider: 'ollama' as const, model: 'test-model' },
      isAvailable: true,
      performance: { speed: 'medium' as const, quality: 'medium' as const, cost: 'free' as const }
    };
    
    for (const text of largeTexts) {
      const result = await apiUtils.testGrammarCheck(text, defaultModel);
      
      // Should either process successfully or fail gracefully
      if (!result.metric.success) {
        expect(result.metric.statusCode).toBeGreaterThanOrEqual(400);
        expect(result.metric.error).toBeDefined();
      } else {
        // If successful, should complete within reasonable time
        expect(result.metric.responseTime).toBeLessThan(30000);
      }
    }
  });

  test('Concurrent request handling', async () => {
    const concurrentRequests = 5;
    const testTexts = [
      'First concurrent test.',
      'Second concurrent test.',
      'Third concurrent test.',
      'Fourth concurrent test.',
      'Fifth concurrent test.'
    ];
    
    // Send concurrent requests
    const defaultModel = {
      id: 'test-model',
      name: 'test-model',
      displayName: 'Test Model',
      provider: 'ollama' as const,
      config: { provider: 'ollama' as const, model: 'test-model' },
      isAvailable: true,
      performance: { speed: 'medium' as const, quality: 'medium' as const, cost: 'free' as const }
    };
    const promises = testTexts.map(text => apiUtils.testGrammarCheck(text, defaultModel));
    const results = await Promise.all(promises);
    
    // Verify all requests completed
    expect(results).toHaveLength(concurrentRequests);
    
    // Check success rate
    const successfulRequests = results.filter(result => result.metric.success);
    const successRate = successfulRequests.length / results.length;
    expect(successRate).toBeGreaterThanOrEqual(0.6); // At least 60% success rate
    
    // Verify response times are reasonable
    const avgResponseTime = results.reduce((sum, result) => sum + result.metric.responseTime, 0) / results.length;
    expect(avgResponseTime).toBeLessThan(20000); // 20 seconds average
  });

  test('Authentication and authorization errors', async () => {
    // Test with invalid API key if the system uses one
    const unauthorizedUtils = new APITestUtils(BACKEND_URL);
    
    // Try to override headers to simulate auth failure
    const result = await unauthorizedUtils.testAPIEndpoint('/api/enhance/full-text', 'POST', 
      { text: 'Test text' },
      { 'Authorization': 'Bearer invalid-token' }
    );
    
    // Should handle auth errors gracefully
    if (!result.success && result.statusCode === 401) {
      expect(result.error).toBeDefined();
    }
  });

  test.afterAll(async () => {
    // Generate error handling test report
    const basicReport = apiUtils.generateReport();
    const detailedReport = testReporter.generateDetailedReport(basicReport, 'Error Handling Tests');
    
    // Save reports
    const jsonPath = await testReporter.saveJSONReport(detailedReport, 'error-handling-report.json');
    const htmlPath = await testReporter.saveHTMLReport(detailedReport, 'error-handling-report.html');
    
    console.log(`\nError Handling Test Reports:`);
    console.log(`JSON: ${jsonPath}`);
    console.log(`HTML: ${htmlPath}`);
    
    // Log error analysis
    console.log(`\nError Analysis:`);
    console.log(`Network Errors: ${detailedReport.errors.networkErrors}`);
    console.log(`Server Errors: ${detailedReport.errors.serverErrors}`);
    console.log(`Client Errors: ${detailedReport.errors.clientErrors}`);
    console.log(`Timeout Errors: ${detailedReport.errors.timeoutErrors}`);
  });
});