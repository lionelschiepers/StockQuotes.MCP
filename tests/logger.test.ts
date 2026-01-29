/**
 * Tests for the logger module
 */

import { consoleFormat } from '../src/logger.js';

describe('logger', () => {
  describe('consoleFormat', () => {
    it('should format message without metadata', () => {
      const info = {
        level: 'info',
        message: 'Test message',
        timestamp: '2024-01-15 10:30:00',
      };

      const result = consoleFormat.transform(info);
      expect((result as Record<symbol, string>)[Symbol.for('message')]).toBe(
        '2024-01-15 10:30:00 [info]: Test message'
      );
    });

    it('should format message with metadata', () => {
      const info = {
        level: 'error',
        message: 'Test error',
        timestamp: '2024-01-15 10:30:00',
        service: 'test-service',
        code: 'ERR_001',
      };

      const result = consoleFormat.transform(info);
      expect((result as Record<symbol, string>)[Symbol.for('message')]).toBe(
        '2024-01-15 10:30:00 [error]: Test error {"service":"test-service","code":"ERR_001"}'
      );
    });

    it('should format message with empty metadata', () => {
      const info = {
        level: 'debug',
        message: 'Debug message',
        timestamp: '2024-01-15 10:30:00',
      };

      const result = consoleFormat.transform(info);
      expect((result as Record<symbol, string>)[Symbol.for('message')]).toBe(
        '2024-01-15 10:30:00 [debug]: Debug message'
      );
    });

    it('should handle special characters in message', () => {
      const info = {
        level: 'info',
        message: 'Message with "quotes" and \\ backslash',
        timestamp: '2024-01-15 10:30:00',
      };

      const result = consoleFormat.transform(info);
      expect((result as Record<symbol, string>)[Symbol.for('message')]).toBe(
        '2024-01-15 10:30:00 [info]: Message with "quotes" and \\ backslash'
      );
    });

    it('should format message with nested metadata objects', () => {
      const info = {
        level: 'warn',
        message: 'Warning message',
        timestamp: '2024-01-15 10:30:00',
        data: { nested: { key: 'value' } },
      };

      const result = consoleFormat.transform(info);
      expect((result as Record<symbol, string>)[Symbol.for('message')]).toBe(
        '2024-01-15 10:30:00 [warn]: Warning message {"data":{"nested":{"key":"value"}}}'
      );
    });
  });
});
