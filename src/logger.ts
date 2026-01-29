import winston from 'winston';

const { combine, timestamp, json, colorize, printf } = winston.format;

/**
 * Custom console format for Winston logger
 * Formats log messages with timestamp, level, message, and optional metadata
 */
export const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${String(timestamp)} [${String(level)}]: ${String(message)}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: combine(timestamp(), json()),
  defaultMeta: { service: 'stockquotes-mcp' },
  transports: [
    new winston.transports.Console({
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        colorize(),
        process.env.NODE_ENV === 'production' ? json() : consoleFormat
      ),
    }),
  ],
});
