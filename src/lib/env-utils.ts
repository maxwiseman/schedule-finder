/**
 * Check if we're running in Vercel preview mode
 * This is when VERCEL_ENV exists but is not "production"
 */
export function isVercelPreview(): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  return vercelEnv !== undefined && vercelEnv !== "production";
}

/**
 * Check if we should skip authentication
 * Returns true in Vercel preview environments
 */
export function shouldSkipAuth(): boolean {
  return isVercelPreview();
}

/**
 * Check if we should skip database operations
 * Returns true in Vercel preview environments
 */
export function shouldSkipDatabase(): boolean {
  return isVercelPreview();
}