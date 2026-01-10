/**
 * Network Configuration Constants
 *
 * Configuration values for network operations and API calls.
 *
 * @module constants/network
 */

/**
 * Maximum number of concurrent NPM registry API calls
 * to prevent overwhelming the registry or hitting rate limits
 */
export const MAX_CONCURRENT_REQUESTS = 5;

/**
 * Timeout for NPM registry API requests (milliseconds)
 */
export const REGISTRY_TIMEOUT_MS = 10000;

/**
 * NPM registry base URL
 */
export const NPM_REGISTRY_URL = "https://registry.npmjs.org";
