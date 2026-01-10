/**
 * Execution Context Interface
 *
 * Defines the contract for execution context implementations.
 * Enables dependency injection and easier testing through mock implementations.
 *
 * @module context/IExecutionContext
 */
import type { ScriptOptions } from "../args/types";
import type { PackageJson } from "./PackageJsonReader";

/**
 * Interface for execution context.
 *
 * Provides access to cached workflow data including package.json contents,
 * cutoff dates for safety buffer, and script configuration.
 */
export interface IExecutionContext {
  // Package.json accessors
  readonly scripts: Record<string, string>;
  readonly allDependencies: Record<string, string>;
  readonly dependencies: Record<string, string>;
  readonly devDependencies: Record<string, string>;
  readonly raw: PackageJson;

  // Workflow configuration
  readonly cutoff: Date;
  readonly cutoffIso: string;
  readonly days: number;
  readonly scriptNames: ScriptOptions;

  // Helper methods
  hasScript(name: string): boolean;
  hasPackage(name: string): boolean;
  getPackageVersion(name: string): string | undefined;
}
