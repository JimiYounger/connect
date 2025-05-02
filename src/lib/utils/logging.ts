/**
 * Centralized logging utilities
 */

type LogData = Record<string, any>;

/**
 * Safe logging function that captures component, data, and errors
 * with consistent formatting
 */
export function safeLog(component: string, data: LogData = {}): void {
  try {
    console.log(`[${component}]`, JSON.stringify(data));
  } catch (error) {
    console.error(`[${component}] Error logging data:`, error);
    console.log(`[${component}] Original data keys:`, Object.keys(data));
  }
}

/**
 * Performance timing utility
 */
export function timeOperation(name: string, fn: () => Promise<any>): Promise<any> {
  console.time(`[PERF] ${name}`);
  return fn().finally(() => {
    console.timeEnd(`[PERF] ${name}`);
  });
} 