/**
 * Workflow Context Interface
 *
 * Defines the contract for workflow context implementations.
 * Enables dependency injection and easier testing through mock implementations.
 *
 * @module context/IWorkflowContext
 */
import type { ScriptOptions } from "../args/types";
import type { PackageJson } from "./PackageJsonReader";

/**
 * Interface for workflow context.
 *
 * Provides access to cached workflow data including package.json contents,
 * cutoff dates for safety buffer, and script configuration.
 */
export interface IWorkflowContext {
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
