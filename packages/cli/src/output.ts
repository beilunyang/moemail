/**
 * Print JSON to stdout (for --json mode).
 */
export function printJson(data: unknown): void {
  console.log(JSON.stringify(data));
}

/**
 * Print human-readable text to stdout.
 */
export function printText(text: string): void {
  console.log(text);
}

/**
 * Log to stderr (progress, errors — never pollutes stdout).
 */
export function log(message: string): void {
  console.error(message);
}

/**
 * Convert epoch ms timestamp to ISO 8601 string.
 */
export function msToIso(ms: number): string {
  return new Date(ms).toISOString();
}
