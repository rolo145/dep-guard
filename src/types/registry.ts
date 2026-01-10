/**
 * NPM Registry Types
 *
 * Type definitions for responses from the NPM registry API.
 * Used when querying package metadata and publish dates.
 *
 * @module types/registry
 * @see https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md
 */

/**
 * Response structure from NPM registry API
 * Contains package metadata including all versions and their publish times
 *
 * ```typescript
 * const response = await fetch('https://registry.npmjs.org/chalk');
 * const data: NpmRegistryResponse = await response.json();
 * const versions = Object.keys(data.versions || {});
 * const publishDate = data.time?.['5.0.0'];
 * ```
 */
export interface NpmRegistryResponse {
  /**
   * All available versions of the package
   * Key: version string (e.g., "5.0.0")
   * Value: version metadata (not used in this application)
   */
  versions?: Record<string, unknown>;

  /**
   * Publish timestamps for each version
   * Key: version string (e.g., "5.0.0")
   * Value: ISO 8601 timestamp string (e.g., "2021-05-10T14:23:45.123Z")
   */
  time?: Record<string, string>;
}
