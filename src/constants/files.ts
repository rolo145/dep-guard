/**
 * File Path Constants
 *
 * Centralized constants for file paths used throughout the application.
 *
 * @module constants/files
 */

/**
 * Standard npm and Node.js files.
 */
export const FILES = {
  PACKAGE_JSON: "package.json",
  PACKAGE_LOCK_JSON: "package-lock.json",
  NODE_MODULES: "node_modules",
} as const;

/** Type for file name values */
export type FileName = (typeof FILES)[keyof typeof FILES];
