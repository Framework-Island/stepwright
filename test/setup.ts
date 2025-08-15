// Test setup file for Vitest
import { beforeAll, afterAll } from 'vitest';

// Global test setup
beforeAll(() => {
  // Set up any global test configurations
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Clean up any global test configurations
});

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.log = vi.fn();
  console.error = vi.fn();
  console.warn = vi.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
