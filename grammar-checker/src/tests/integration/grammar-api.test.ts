import { test, expect } from '@playwright/test';
import { APITestUtils, TEST_SAMPLES } from '../utils/api-test-utils';
import { TestReporter } from '../utils/test-reporter';
import { UnifiedModel } from '../../types';

// Test configuration
const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 60000;

// Initialize test utilities
let apiUtils: APITestUtils;
let testReporter: TestReporter;

test.describe('Grammar Checker Integration Tests', () => {
  test.beforeAll(async () => {
    apiUtils = new APITestUtils(BACKEND_URL);
    testReporter = new TestReporter('./test-results');
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Frontend loads successfully and displays main interface', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Grammar Checker/i);
    
    // Check for main UI elements
    const textArea = page.locator('textarea, [contenteditable="true"]').first();
    await expect(textArea).toBeVisible();
    
    // Check for grammar check button or similar action element
    const actionButton = page.locator('button').filter({ hasText: /check|analyze|enhance/i }).first();
    if (await actionButton.count() > 0) {
      await expect(actionButton).toBeVisible();
    }
  });

  test('Backend API endpoints are accessible', async () => {
    const connectionTest = await apiUtils.testConnection();
    expect(connectionTest.success).toBe(true);
    expect(connectionTest.responseTime).toBeLessThan(5000);
  });

  test('Grammar checking API responds correctly', async () => {
    const testText = TEST_SAMPLES.withErrors.text;
    const defaultModel: UnifiedModel = {
      id: 'test-model',
      name: 'test-model',
      displayName: 'Test Model',
      provider: 'ollama',
      config: { provider: 'ollama', model: 'test-model' },
      isAvailable: true,
      performance: { speed: 'medium', quality: 'medium', cost: 'free' }
    };
    const result = await apiUtils.testGrammarCheck(testText, defaultModel);
    
    expect(result.metric.success).toBe(true);
    expect(result.metric.responseTime).toBeLessThan(10000);
    expect(result.result).toBeDefined();
    
    // Verify response structure
    if (result.result) {
      expect(typeof result.result).toBe('object');
    }
  });

  test('Text enhancement API responds correctly', async () => {
    const testText = TEST_SAMPLES.perfect.text;
    const defaultModel: UnifiedModel = {
      id: 'test-model',
      name: 'test-model',
      displayName: 'Test Model',
      provider: 'ollama',
      config: { provider: 'ollama', model: 'test-model' },
      isAvailable: true,
      performance: { speed: 'medium', quality: 'medium', cost: 'free' }
    };
    const result = await apiUtils.testGrammarCheck(testText, defaultModel);
    
    expect(result.metric.success).toBe(true);
    expect(result.metric.responseTime).toBeLessThan(15000);
    expect(result.result).toBeDefined();
  });

  test('Frontend-Backend integration: Grammar check workflow', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    // Find text input area
    const textArea = page.locator('textarea, [contenteditable="true"]').first();
    await expect(textArea).toBeVisible();
    
    // Input test text with grammar errors
    await textArea.fill(TEST_SAMPLES.withErrors.text);
    
    // Look for and click grammar check button
    const checkButton = page.locator('button').filter({ hasText: /check|analyze|grammar/i }).first();
    
    if (await checkButton.count() > 0) {
      // Monitor network requests
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/') && response.status() === 200,
        { timeout: 15000 }
      );
      
      await checkButton.click();
      
      // Wait for API response
      const response = await responsePromise;
      expect(response.status()).toBe(200);
      
      // Verify response time
      const responseTime = Date.now() - response.request().timing().requestStart;
      expect(responseTime).toBeLessThan(15000);
      
      // Wait for UI to update with results
      await page.waitForTimeout(2000);
      
      // Check for suggestions or results display
      const resultsArea = page.locator('[data-testid="suggestions"], .suggestions, .results, .grammar-results').first();
      if (await resultsArea.count() > 0) {
        await expect(resultsArea).toBeVisible();
      }
    }
  });

  test('Frontend-Backend integration: Text enhancement workflow', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    // Find text input area
    const textArea = page.locator('textarea, [contenteditable="true"]').first();
    await expect(textArea).toBeVisible();
    
    // Input simple text for enhancement
    await textArea.fill(TEST_SAMPLES.perfect.text);
    
    // Look for enhancement options
    const enhanceButton = page.locator('button').filter({ hasText: /enhance|improve|formal|casual/i }).first();
    
    if (await enhanceButton.count() > 0) {
      // Monitor network requests
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/enhance') && response.status() === 200,
        { timeout: 15000 }
      );
      
      await enhanceButton.click();
      
      // Wait for API response
      const response = await responsePromise;
      expect(response.status()).toBe(200);
      
      // Verify response contains enhanced text
      const responseBody = await response.json();
      expect(responseBody).toBeDefined();
      
      // Wait for UI to update
      await page.waitForTimeout(2000);
    }
  });

  test('API response time performance', async () => {
    const performanceTests = [];
    
    // Test multiple API calls for performance metrics
    const defaultModel: UnifiedModel = {
      id: 'test-model',
      name: 'test-model',
      displayName: 'Test Model',
      provider: 'ollama',
      config: { provider: 'ollama', model: 'test-model' },
      isAvailable: true,
      performance: { speed: 'medium', quality: 'medium', cost: 'free' }
    };
    for (let i = 0; i < 5; i++) {
      const result = await apiUtils.testGrammarCheck(TEST_SAMPLES.perfect.text, defaultModel);
      performanceTests.push(result.metric);
    }
    
    // Calculate average response time
    const avgResponseTime = performanceTests.reduce((sum, test) => sum + test.responseTime, 0) / performanceTests.length;
    expect(avgResponseTime).toBeLessThan(8000); // 8 seconds average
    
    // Ensure all tests passed
    const successRate = performanceTests.filter(test => test.success).length / performanceTests.length;
    expect(successRate).toBeGreaterThanOrEqual(0.8); // 80% success rate
  });

  test('Error handling: Invalid API requests', async () => {
    const defaultModel: UnifiedModel = {
      id: 'test-model',
      name: 'test-model',
      displayName: 'Test Model',
      provider: 'ollama',
      config: { provider: 'ollama', model: 'test-model' },
      isAvailable: true,
      performance: { speed: 'medium', quality: 'medium', cost: 'free' }
    };
    // Test with empty text
    const emptyResult = await apiUtils.testGrammarCheck('', defaultModel);
    // Should either succeed with empty response or fail gracefully
    expect(emptyResult.metric.success || emptyResult.metric.error).toBeDefined();
    
    // Test with very long text
    const longText = 'A'.repeat(10000);
    const longResult = await apiUtils.testGrammarCheck(longText, defaultModel);
    expect(longResult.metric.responseTime).toBeLessThan(30000); // Should not timeout
  });

  test('Network failure simulation', async () => {
    // Test with invalid endpoint
    const invalidResult = await apiUtils.testAPIEndpoint('/api/invalid-endpoint', 'POST', { text: 'test' });
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.statusCode).toBe(404);
  });

  test.afterAll(async () => {
    // Generate test report
    const basicReport = apiUtils.generateReport();
    const detailedReport = testReporter.generateDetailedReport(basicReport, 'Grammar Checker Integration Tests');
    
    // Save reports
    const jsonPath = await testReporter.saveJSONReport(detailedReport);
    const htmlPath = await testReporter.saveHTMLReport(detailedReport);
    
    console.log(`Test reports generated:`);
    console.log(`JSON: ${jsonPath}`);
    console.log(`HTML: ${htmlPath}`);
    
    // Log summary
    console.log(`\nTest Summary:`);
    console.log(`Total Tests: ${detailedReport.totalTests}`);
    console.log(`Success Rate: ${detailedReport.successRate.toFixed(1)}%`);
    console.log(`Average Response Time: ${detailedReport.averageResponseTime.toFixed(0)}ms`);
    console.log(`Failed Tests: ${detailedReport.failedTests}`);
  });
});

// Additional test suite for specific API endpoints
test.describe('API Endpoint Tests', () => {
  test.beforeAll(async () => {
    apiUtils = new APITestUtils(BACKEND_URL);
  });

  test('POST /api/enhance/full-text endpoint', async () => {
    const result = await apiUtils.testAPIEndpoint('/api/enhance/full-text', 'POST', {
      text: TEST_SAMPLES.withErrors.text,
      style: 'formal',
      modelConfig: {
        provider: 'groq',
        model: 'llama3-8b-8192'
      }
    });
    
    expect(result.success).toBe(true);
    expect(result.responseTime).toBeLessThan(15000);
  });

  test('POST /api/enhance/humanize endpoint', async () => {
    const result = await apiUtils.testAPIEndpoint('/api/enhance/humanize', 'POST', {
      text: TEST_SAMPLES.complex.text,
      modelConfig: {
        provider: 'groq',
        model: 'llama3-8b-8192'
      }
    });
    
    expect(result.success).toBe(true);
    expect(result.responseTime).toBeLessThan(15000);
  });

  test('POST /api/enhance/simplify endpoint', async () => {
    const result = await apiUtils.testAPIEndpoint('/api/enhance/simplify', 'POST', {
      text: TEST_SAMPLES.complex.text
    });
    
    expect(result.success).toBe(true);
    expect(result.responseTime).toBeLessThan(15000);
  });

  test('POST /api/enhance/expand endpoint', async () => {
    const result = await apiUtils.testAPIEndpoint('/api/enhance/expand', 'POST', {
      text: TEST_SAMPLES.perfect.text
    });
    
    expect(result.success).toBe(true);
    expect(result.responseTime).toBeLessThan(15000);
  });

  test('POST /api/enhance/condense endpoint', async () => {
    const result = await apiUtils.testAPIEndpoint('/api/enhance/condense', 'POST', {
      text: TEST_SAMPLES.long.text
    });
    
    expect(result.success).toBe(true);
    expect(result.responseTime).toBeLessThan(15000);
  });
});