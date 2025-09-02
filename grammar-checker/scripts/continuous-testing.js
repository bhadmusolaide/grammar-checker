#!/usr/bin/env node

import chokidar from 'chokidar';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Configuration
const config = {
  // Paths to watch for changes
  watchPaths: [
    'src/**/*.{ts,tsx,js,jsx}',
    'src/**/*.test.{ts,tsx,js,jsx}',
    '../backend/**/*.js',
    '../backend/**/*.json'
  ],
  // Paths to ignore
  ignorePaths: [
    'node_modules/**',
    'dist/**',
    'coverage/**',
    'test-results/**',
    '.git/**',
    '**/*.log'
  ],
  // Debounce delay in milliseconds
  debounceDelay: 1000,
  // Test commands
  commands: {
    unit: 'npm run test',
    integration: 'npm run test:integration',
    all: 'npm run test:all'
  }
};

class ContinuousTestRunner {
  constructor() {
    this.isRunning = false;
    this.pendingTests = new Set();
    this.debounceTimer = null;
    this.testHistory = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runCommand(command, description) {
    return new Promise((resolve) => {
      this.log(`Running ${description}...`, 'test');
      const startTime = Date.now();
      
      const child = spawn('npm', ['run', command.split(' ')[1]], {
        cwd: projectRoot,
        stdio: 'pipe',
        shell: true
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        const result = {
          command,
          description,
          success: code === 0,
          duration,
          timestamp: new Date().toISOString(),
          output: output.slice(-1000), // Keep last 1000 chars
          error: errorOutput.slice(-1000)
        };

        this.testHistory.push(result);
        
        if (code === 0) {
          this.log(`${description} completed successfully (${duration}ms)`, 'success');
        } else {
          this.log(`${description} failed with exit code ${code} (${duration}ms)`, 'error');
          if (errorOutput) {
            console.log('Error output:', errorOutput.slice(-500));
          }
        }

        resolve(result);
      });

      child.on('error', (error) => {
        this.log(`Failed to start ${description}: ${error.message}`, 'error');
        resolve({
          command,
          description,
          success: false,
          duration: 0,
          timestamp: new Date().toISOString(),
          error: error.message
        });
      });
    });
  }

  async runTests(testType = 'unit') {
    if (this.isRunning) {
      this.pendingTests.add(testType);
      return;
    }

    this.isRunning = true;
    
    try {
      switch (testType) {
        case 'unit':
          await this.runCommand(config.commands.unit, 'Unit Tests');
          break;
        case 'integration':
          await this.runCommand(config.commands.integration, 'Integration Tests');
          break;
        case 'all':
          await this.runCommand(config.commands.all, 'All Tests');
          break;
        default:
          this.log(`Unknown test type: ${testType}`, 'warning');
      }
    } catch (error) {
      this.log(`Test execution error: ${error.message}`, 'error');
    } finally {
      this.isRunning = false;
      
      // Run pending tests
      if (this.pendingTests.size > 0) {
        const nextTest = this.pendingTests.values().next().value;
        this.pendingTests.delete(nextTest);
        setTimeout(() => this.runTests(nextTest), 500);
      }
    }
  }

  determineTestType(filePath) {
    // Determine which tests to run based on changed file
    if (filePath.includes('backend/')) {
      return 'integration'; // Backend changes require integration tests
    }
    
    if (filePath.includes('test') || filePath.includes('spec')) {
      return 'all'; // Test file changes run all tests
    }
    
    if (filePath.includes('src/services/') || filePath.includes('src/hooks/')) {
      return 'integration'; // API-related changes need integration tests
    }
    
    return 'unit'; // Default to unit tests for other frontend changes
  }

  debounceTest(filePath) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      const testType = this.determineTestType(filePath);
      this.runTests(testType);
    }, config.debounceDelay);
  }

  printStats() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const totalTests = this.testHistory.length;
    const successfulTests = this.testHistory.filter(t => t.success).length;
    const successRate = totalTests > 0 ? (successfulTests / totalTests * 100).toFixed(1) : 0;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 CONTINUOUS TESTING STATS');
    console.log('='.repeat(60));
    console.log(`⏱️  Uptime: ${uptime}s`);
    console.log(`🧪 Total test runs: ${totalTests}`);
    console.log(`✅ Success rate: ${successRate}%`);
    console.log(`🔄 Currently running: ${this.isRunning ? 'Yes' : 'No'}`);
    console.log(`⏳ Pending tests: ${this.pendingTests.size}`);
    
    if (this.testHistory.length > 0) {
      const recent = this.testHistory.slice(-5);
      console.log('\n📋 Recent test runs:');
      recent.forEach((test, index) => {
        const status = test.success ? '✅' : '❌';
        const time = new Date(test.timestamp).toLocaleTimeString();
        console.log(`  ${status} ${time} - ${test.description} (${test.duration}ms)`);
      });
    }
    console.log('='.repeat(60) + '\n');
  }

  start() {
    this.log('Starting continuous testing...', 'info');
    this.log(`Watching paths: ${config.watchPaths.join(', ')}`, 'info');
    
    // Initialize watcher
    const watcher = chokidar.watch(config.watchPaths, {
      ignored: config.ignorePaths,
      persistent: true,
      ignoreInitial: true,
      cwd: projectRoot
    });

    // Set up event handlers
    watcher.on('change', (filePath) => {
      this.log(`File changed: ${filePath}`, 'info');
      this.debounceTest(filePath);
    });

    watcher.on('add', (filePath) => {
      this.log(`File added: ${filePath}`, 'info');
      this.debounceTest(filePath);
    });

    watcher.on('unlink', (filePath) => {
      this.log(`File removed: ${filePath}`, 'warning');
      this.debounceTest(filePath);
    });

    watcher.on('error', (error) => {
      this.log(`Watcher error: ${error.message}`, 'error');
    });

    watcher.on('ready', () => {
      this.log('File watcher ready. Monitoring for changes...', 'success');
      
      // Run initial tests
      setTimeout(() => {
        this.log('Running initial test suite...', 'test');
        this.runTests('all');
      }, 2000);
    });

    // Set up periodic stats reporting
    setInterval(() => {
      this.printStats();
    }, 60000); // Every minute

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.log('Shutting down continuous testing...', 'warning');
      this.printStats();
      watcher.close();
      process.exit(0);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.log(`Uncaught exception: ${error.message}`, 'error');
      console.error(error.stack);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.log(`Unhandled rejection at ${promise}: ${reason}`, 'error');
    });

    this.log('Continuous testing started successfully!', 'success');
    this.log('Press Ctrl+C to stop', 'info');
  }
}

// Start the continuous test runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new ContinuousTestRunner();
  runner.start();
}

export default ContinuousTestRunner;