/**
 * Unit tests for logging utilities
 * SPEC.md Phase 9 - Task 9.2: Unit Testing
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the env module
vi.mock('#env', () => ({
  default: {
    NODE_ENV: 'test',
    AXIOM_TOKEN: undefined,
    AXIOM_DATASET: undefined,
  },
}));

// Import after mocking
import { logger } from '~/lib/logging';

describe('logger', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log debug messages', () => {
    logger.debug('Test debug message');
    expect(consoleSpy.debug).toHaveBeenCalled();
  });

  it('should log info messages', () => {
    logger.info('Test info message');
    expect(consoleSpy.info).toHaveBeenCalled();
  });

  it('should log warn messages', () => {
    logger.warn('Test warn message');
    expect(consoleSpy.warn).toHaveBeenCalled();
  });

  it('should log error messages', () => {
    logger.error('Test error message');
    expect(consoleSpy.error).toHaveBeenCalled();
  });

  it('should log fatal messages as errors', () => {
    logger.fatal('Test fatal message');
    expect(consoleSpy.error).toHaveBeenCalled();
  });

  it('should include context in log messages', () => {
    logger.info('Test message', { userId: '123', operation: 'test' });
    expect(consoleSpy.info).toHaveBeenCalled();
    const callArg = consoleSpy.info.mock.calls[0][0];
    expect(callArg).toContain('userId');
    expect(callArg).toContain('123');
  });

  it('should create child loggers with default context', () => {
    const childLogger = logger.child({ requestId: 'req-123' });
    childLogger.info('Child log message');
    expect(consoleSpy.info).toHaveBeenCalled();
    const callArg = consoleSpy.info.mock.calls[0][0];
    expect(callArg).toContain('requestId');
    expect(callArg).toContain('req-123');
  });
});
