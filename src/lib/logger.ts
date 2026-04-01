// Env-gated logger — debug logs only appear in development.
// Replace console.log calls throughout the codebase with logger.debug()
// so production logs stay clean and don't leak internal data.

const isDev = process.env.NODE_ENV === "development";

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  info: (...args: unknown[]) => {
    console.log(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },
};
