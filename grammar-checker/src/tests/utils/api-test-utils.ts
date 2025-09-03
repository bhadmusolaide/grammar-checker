import { expect } from '@playwright/test';
import { GrammarResult, UnifiedModel } from '../../types';

export interface TestMetrics {
  responseTime: number;
  success: boolean;
  statusCode?: number;
  error?: string;
  timestamp: number;
}

export interface TestReport {
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  averageResponseTime: number;
  successRate: number;
  metrics: TestMetrics[];
  generatedAt: string;
}

export class APITestUtils {
  private baseURL: string;
  private metrics: TestMetrics[] = [];

  constructor(baseURL: string = 'http://localhost:3001') {
    this.baseURL = baseURL;
  }

  /**
   * Test API endpoint with timing and error handling
   */
  async testAPIEndpoint(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    headers?: Record<string, string>
  ): Promise<TestMetrics> {
    const startTime = Date.now();
    const timestamp = Date.now();
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const responseTime = Date.now() - startTime;
      const success = response.ok;
      
      const metric: TestMetrics = {
        responseTime,
        success,
        statusCode: response.status,
        timestamp
      };

      if (!success) {
        const errorText = await response.text();
        metric.error = errorText;
      }

      this.metrics.push(metric);
      return metric;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const metric: TestMetrics = {
        responseTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp
      };
      
      this.metrics.push(metric);
      return metric;
    }
  }

  /**
   * Test grammar checking endpoint specifically
   */
  async testGrammarCheck(
    text: string,
    model: UnifiedModel,
    expectedSuggestions?: number
  ): Promise<{ metric: TestMetrics; result?: GrammarResult }> {
    const startTime = Date.now();
    const timestamp = Date.now();
    
    try {
      const response = await fetch(`${this.baseURL}/api/enhance/full-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          modelConfig: model.config
        })
      });

      const responseTime = Date.now() - startTime;
      const success = response.ok;
      
      let result: GrammarResult | undefined;
      let error: string | undefined;

      if (success) {
        result = await response.json();
        
        // Validate response structure
        if (expectedSuggestions !== undefined && result?.suggestions) {
          const actualSuggestions = Array.isArray(result.suggestions) ? result.suggestions.length : 0;
          if (actualSuggestions < expectedSuggestions) {
            error = `Expected at least ${expectedSuggestions} suggestions, got ${actualSuggestions}`;
          }
        }
      } else {
        error = await response.text();
      }

      const metric: TestMetrics = {
        responseTime,
        success: success && !error,
        statusCode: response.status,
        error,
        timestamp
      };

      this.metrics.push(metric);
      return { metric, result };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const metric: TestMetrics = {
        responseTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp
      };
      
      this.metrics.push(metric);
      return { metric };
    }
  }

  /**
   * Test connection to backend server
   */
  async testConnection(): Promise<TestMetrics> {
    return this.testAPIEndpoint('/api/test-connection');
  }

  /**
   * Test with network failure simulation
   */
  async testWithNetworkFailure(): Promise<TestMetrics> {
    const startTime = Date.now();
    const timestamp = Date.now();
    
    try {
      // Use invalid URL to simulate network failure
      await fetch('http://invalid-url:9999/api/test', {
        method: 'GET'
      });
      
      const responseTime = Date.now() - startTime;
      const metric: TestMetrics = {
        responseTime,
        success: false,
        error: 'Network request should have failed',
        timestamp
      };
      
      this.metrics.push(metric);
      return metric;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const metric: TestMetrics = {
        responseTime,
        success: true, // Success means we caught the expected error
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp
      };
      
      this.metrics.push(metric);
      return metric;
    }
  }

  /**
   * Generate test report
   */
  generateReport(): TestReport {
    const totalTests = this.metrics.length;
    const successfulTests = this.metrics.filter(m => m.success).length;
    const failedTests = totalTests - successfulTests;
    const averageResponseTime = totalTests > 0 
      ? this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalTests 
      : 0;
    const successRate = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;

    return {
      totalTests,
      successfulTests,
      failedTests,
      averageResponseTime,
      successRate,
      metrics: [...this.metrics],
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get current metrics
   */
  getMetrics(): TestMetrics[] {
    return [...this.metrics];
  }
}

/**
 * Sample test data for grammar checking
 */
export const TEST_SAMPLES = {
  withErrors: {
    text: "This is a test sentance with some grammer errors and mispelled words.",
    expectedSuggestions: 3
  },
  perfect: {
    text: "This is a perfectly written sentence with no errors.",
    expectedSuggestions: 0
  },
  complex: {
    text: "The quick brown fox jumps over the lazy dog, but the dog was to tired to chase it back.",
    expectedSuggestions: 1
  },
  empty: {
    text: "",
    expectedSuggestions: 0
  },
  long: {
    text: "This is a very long text that contains multiple sentences with various grammatical issues. Some of the sentences might have spelling mistakes, while others could have punctuation problems. The purpose of this text is to test how well the grammar checking system handles longer content with multiple types of errors distributed throughout the text.",
    expectedSuggestions: 2
  }
};

/**
 * Mock model configurations for testing
 */
export const TEST_MODELS: Record<string, UnifiedModel> = {
  openai: {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    displayName: 'GPT-4o Mini (OpenAI)',
    config: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY || 'test-key'
    },
    isAvailable: true,
    performance: {
      speed: 'fast',
      quality: 'high',
      cost: 'low'
    }
  },
  ollama: {
    id: 'llama2',
    name: 'Llama 2',
    provider: 'ollama',
    displayName: 'Llama 2 (Local)',
    config: {
      provider: 'ollama',
      model: 'llama2'
    },
    isAvailable: true,
    performance: {
      speed: 'medium',
      quality: 'medium',
      cost: 'free'
    }
  }
};

/**
 * Assertion helpers for Playwright tests
 */
export class TestAssertions {
  static async assertResponseTime(metric: TestMetrics, maxTime: number) {
    expect(metric.responseTime).toBeLessThan(maxTime);
  }

  static async assertSuccess(metric: TestMetrics) {
    expect(metric.success).toBe(true);
    expect(metric.statusCode).toBe(200);
  }

  static async assertError(metric: TestMetrics, expectedError?: string) {
    expect(metric.success).toBe(false);
    if (expectedError) {
      expect(metric.error).toContain(expectedError);
    }
  }

  static async assertGrammarResult(result: GrammarResult, expectedSuggestions?: number) {
    expect(result).toBeDefined();
    
    if (expectedSuggestions !== undefined) {
      const suggestions = result.suggestions || [];
      expect(suggestions.length).toBeGreaterThanOrEqual(expectedSuggestions);
    }
  }

  static async assertSuccessRate(report: TestReport, minSuccessRate: number) {
    expect(report.successRate).toBeGreaterThanOrEqual(minSuccessRate);
  }

  static async assertAverageResponseTime(report: TestReport, maxAverageTime: number) {
    expect(report.averageResponseTime).toBeLessThan(maxAverageTime);
  }
}