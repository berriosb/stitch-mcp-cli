import pino from "pino";

const LOG_LEVEL = process.env.LOG_LEVEL || "info";

export const logger = pino({
  level: LOG_LEVEL,
  transport: process.env.NODE_ENV !== "production" ? {
    target: "pino-pretty",
    options: { colorize: true }
  } : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}
