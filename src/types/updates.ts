/**
 * Update Types
 *
 * Type definitions for package update operations shared across modules.
 *
 * @module types/updates
 */

/**
 * Represents a user's selection of a package to install
 * Returned from interactive prompts
 */
export interface PackageSelection {
  /** Package name */
  name: string;
  /** Selected version to install */
  version: string;
}
