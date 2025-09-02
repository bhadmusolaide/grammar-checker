import fs from 'fs';
import path from 'path';
import { TestReport, TestMetrics } from './api-test-utils';

export interface DetailedTestReport extends TestReport {
  testSuite: string;
  environment: {
    nodeVersion: string;
    platform: string;
    timestamp: string;
  };
  performance: {
    fastest: TestMetrics;
    slowest: TestMetrics;
    median: number;
    p95: number;
    p99: number;
  };
  errors: {
    networkErrors: number;
    serverErrors: number;
    clientErrors: number;
    timeoutErrors: number;
  };
}

export class TestReporter {
  private reports: DetailedTestReport[] = [];
  private outputDir: string;

  constructor(outputDir: string = './test-results') {
    this.outputDir = outputDir;
    this.ensureOutputDir();
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate detailed report from basic test report
   */
  generateDetailedReport(basicReport: TestReport, testSuite: string): DetailedTestReport {
    const sortedMetrics = [...basicReport.metrics].sort((a, b) => a.responseTime - b.responseTime);
    const responseTimes = sortedMetrics.map(m => m.responseTime);
    
    const fastest = sortedMetrics[0];
    const slowest = sortedMetrics[sortedMetrics.length - 1];
    const median = this.calculatePercentile(responseTimes, 50);
    const p95 = this.calculatePercentile(responseTimes, 95);
    const p99 = this.calculatePercentile(responseTimes, 99);

    const errors = this.categorizeErrors(basicReport.metrics);

    const detailedReport: DetailedTestReport = {
      ...basicReport,
      testSuite,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        timestamp: new Date().toISOString()
      },
      performance: {
        fastest,
        slowest,
        median,
        p95,
        p99
      },
      errors
    };

    this.reports.push(detailedReport);
    return detailedReport;
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedArray[lower];
    }
    
    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  private categorizeErrors(metrics: TestMetrics[]) {
    const errors = {
      networkErrors: 0,
      serverErrors: 0,
      clientErrors: 0,
      timeoutErrors: 0
    };

    metrics.forEach(metric => {
      if (!metric.success && metric.error) {
        const error = metric.error.toLowerCase();
        
        if (error.includes('network') || error.includes('fetch') || error.includes('connection')) {
          errors.networkErrors++;
        } else if (metric.statusCode && metric.statusCode >= 500) {
          errors.serverErrors++;
        } else if (metric.statusCode && metric.statusCode >= 400) {
          errors.clientErrors++;
        } else if (error.includes('timeout')) {
          errors.timeoutErrors++;
        }
      }
    });

    return errors;
  }

  /**
   * Save report as JSON
   */
  async saveJSONReport(report: DetailedTestReport, filename?: string): Promise<string> {
    const fileName = filename || `test-report-${Date.now()}.json`;
    const filePath = path.join(this.outputDir, fileName);
    
    await fs.promises.writeFile(filePath, JSON.stringify(report, null, 2));
    return filePath;
  }

  /**
   * Save report as HTML
   */
  async saveHTMLReport(report: DetailedTestReport, filename?: string): Promise<string> {
    const fileName = filename || `test-report-${Date.now()}.html`;
    const filePath = path.join(this.outputDir, fileName);
    
    const html = this.generateHTMLReport(report);
    await fs.promises.writeFile(filePath, html);
    return filePath;
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(report: DetailedTestReport): string {
    const successRate = report.successRate.toFixed(1);
    const avgResponseTime = report.averageResponseTime.toFixed(0);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Integration Test Report - ${report.testSuite}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
        }
        .stat-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            border-left: 4px solid #667eea;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
        }
        .success { border-left-color: #28a745; }
        .warning { border-left-color: #ffc107; }
        .danger { border-left-color: #dc3545; }
        .info { border-left-color: #17a2b8; }
        .section {
            padding: 30px;
            border-top: 1px solid #eee;
        }
        .section h2 {
            margin-top: 0;
            color: #333;
        }
        .performance-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .perf-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
        }
        .perf-value {
            font-size: 1.5em;
            font-weight: bold;
            color: #667eea;
        }
        .perf-label {
            font-size: 0.8em;
            color: #666;
            margin-top: 5px;
        }
        .error-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .error-item {
            background: #fff5f5;
            border: 1px solid #fed7d7;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
        }
        .error-value {
            font-size: 1.5em;
            font-weight: bold;
            color: #e53e3e;
        }
        .error-label {
            font-size: 0.8em;
            color: #666;
            margin-top: 5px;
        }
        .test-details {
            margin-top: 20px;
        }
        .test-item {
            background: #f8f9fa;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .test-success {
            background: #d4edda;
            border-left: 4px solid #28a745;
        }
        .test-failure {
            background: #f8d7da;
            border-left: 4px solid #dc3545;
        }
        .test-time {
            font-weight: bold;
            color: #667eea;
        }
        .test-status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .status-success {
            background: #28a745;
            color: white;
        }
        .status-failure {
            background: #dc3545;
            color: white;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Integration Test Report</h1>
            <p>${report.testSuite} • Generated on ${new Date(report.generatedAt).toLocaleString()}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card success">
                <div class="stat-value">${report.totalTests}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card ${report.successRate >= 90 ? 'success' : report.successRate >= 70 ? 'warning' : 'danger'}">
                <div class="stat-value">${successRate}%</div>
                <div class="stat-label">Success Rate</div>
            </div>
            <div class="stat-card info">
                <div class="stat-value">${avgResponseTime}ms</div>
                <div class="stat-label">Avg Response Time</div>
            </div>
            <div class="stat-card ${report.failedTests === 0 ? 'success' : 'danger'}">
                <div class="stat-value">${report.failedTests}</div>
                <div class="stat-label">Failed Tests</div>
            </div>
        </div>
        
        <div class="section">
            <h2>Performance Metrics</h2>
            <div class="performance-grid">
                <div class="perf-item">
                    <div class="perf-value">${report.performance.fastest?.responseTime || 'N/A'}ms</div>
                    <div class="perf-label">Fastest</div>
                </div>
                <div class="perf-item">
                    <div class="perf-value">${report.performance.slowest?.responseTime || 'N/A'}ms</div>
                    <div class="perf-label">Slowest</div>
                </div>
                <div class="perf-item">
                    <div class="perf-value">${report.performance.median?.toFixed(0) || 'N/A'}ms</div>
                    <div class="perf-label">Median</div>
                </div>
                <div class="perf-item">
                    <div class="perf-value">${report.performance.p95?.toFixed(0) || 'N/A'}ms</div>
                    <div class="perf-label">95th Percentile</div>
                </div>
                <div class="perf-item">
                    <div class="perf-value">${report.performance.p99?.toFixed(0) || 'N/A'}ms</div>
                    <div class="perf-label">99th Percentile</div>
                </div>
            </div>
        </div>
        
        ${report.failedTests > 0 ? `
        <div class="section">
            <h2>Error Analysis</h2>
            <div class="error-grid">
                <div class="error-item">
                    <div class="error-value">${report.errors.networkErrors}</div>
                    <div class="error-label">Network Errors</div>
                </div>
                <div class="error-item">
                    <div class="error-value">${report.errors.serverErrors}</div>
                    <div class="error-label">Server Errors</div>
                </div>
                <div class="error-item">
                    <div class="error-value">${report.errors.clientErrors}</div>
                    <div class="error-label">Client Errors</div>
                </div>
                <div class="error-item">
                    <div class="error-value">${report.errors.timeoutErrors}</div>
                    <div class="error-label">Timeout Errors</div>
                </div>
            </div>
        </div>
        ` : ''}
        
        <div class="section">
            <h2>Test Details</h2>
            <div class="test-details">
                ${report.metrics.map((metric, index) => `
                <div class="test-item ${metric.success ? 'test-success' : 'test-failure'}">
                    <div>
                        <strong>Test ${index + 1}</strong>
                        ${metric.error ? `<br><small style="color: #dc3545;">${metric.error}</small>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <div class="test-time">${metric.responseTime}ms</div>
                        <span class="test-status ${metric.success ? 'status-success' : 'status-failure'}">
                            ${metric.success ? 'PASS' : 'FAIL'}
                        </span>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
        
        <div class="footer">
            <p>Report generated by Grammar Checker Integration Tests</p>
            <p>Environment: ${report.environment.platform} • Node.js ${report.environment.nodeVersion}</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Save summary report for multiple test suites
   */
  async saveSummaryReport(filename?: string): Promise<string> {
    const fileName = filename || `summary-report-${Date.now()}.json`;
    const filePath = path.join(this.outputDir, fileName);
    
    const summary = {
      totalSuites: this.reports.length,
      overallSuccessRate: this.calculateOverallSuccessRate(),
      overallAverageResponseTime: this.calculateOverallAverageResponseTime(),
      reports: this.reports,
      generatedAt: new Date().toISOString()
    };
    
    await fs.promises.writeFile(filePath, JSON.stringify(summary, null, 2));
    return filePath;
  }

  private calculateOverallSuccessRate(): number {
    if (this.reports.length === 0) return 0;
    
    const totalTests = this.reports.reduce((sum, report) => sum + report.totalTests, 0);
    const totalSuccessful = this.reports.reduce((sum, report) => sum + report.successfulTests, 0);
    
    return totalTests > 0 ? (totalSuccessful / totalTests) * 100 : 0;
  }

  private calculateOverallAverageResponseTime(): number {
    if (this.reports.length === 0) return 0;
    
    const allMetrics = this.reports.flatMap(report => report.metrics);
    const totalResponseTime = allMetrics.reduce((sum, metric) => sum + metric.responseTime, 0);
    
    return allMetrics.length > 0 ? totalResponseTime / allMetrics.length : 0;
  }

  /**
   * Clear all reports
   */
  clearReports(): void {
    this.reports = [];
  }

  /**
   * Get all reports
   */
  getReports(): DetailedTestReport[] {
    return [...this.reports];
  }
}