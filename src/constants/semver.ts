/**
 * Semantic Versioning Constants
 *
 * Regular expression patterns for validating and parsing semantic versions.
 *
 * @module constants/semver
 */

/**
 * Matches a complete semantic version with optional prerelease suffix.
 *
 * Examples: "1.2.3", "2.0.0-beta.1", "3.1.4-alpha"
 */
export const SEMVER_PATTERN = /^\d+\.\d+\.\d+(-[\w.]+)?$/;

/**
 * Matches only stable semantic versions (no prerelease suffix).
 *
 * Examples: "1.2.3", "2.0.0", "3.1.4"
 */
export const STABLE_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

/**
 * Matches valid npm package names (unscoped).
 *
 * Examples: "react", "lodash", "express"
 */
export const PACKAGE_NAME_PATTERN = /^[a-z0-9-_.]+$/;

/**
 * Matches valid scoped npm package names.
 *
 * Examples: "@vue/cli", "@types/node", "@babel/core"
 */
export const SCOPED_PACKAGE_PATTERN = /^@[a-z0-9-_.]+\/[a-z0-9-_.]+$/;
