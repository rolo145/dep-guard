/**
 * Execution Context
 *
 * Provides cached access to frequently needed data during workflow execution.
 * Designed for dependency injection - create via ExecutionContextFactory and
 * pass to services that need it.
 *
 * Cached data:
 * - package.json contents (via PackageJsonReader)
 * - Cutoff date for safety buffer calculations
 *
 * @module context/ExecutionContext
 */
import type { ScriptOptions } from "../args/types";
import type { IExecutionContext } from "./IExecutionContext";
import { PackageJsonReader, type PackageJson } from "./PackageJsonReader";

/**
 * Options for creating an ExecutionContext
 */
export interface ExecutionContextOptions {
  days: number;
  scripts: ScriptOptions;
  packageJsonPath?: string;
}

/**
 * Execution context containing cached data for the update workflow.
 *
 * This class provides efficient access to package.json data and
 * calculates the cutoff date once at initialization.
 *
 * @example
 * ```typescript
 * // Create via factory
 * const context = ExecutionContextFactory.create({ days: 7, scripts });
 *
 * // Inject into services
 * const ncuService = new NCUService(context);
 * const lintService = new LintService(context);
 * ```
 */
export class ExecutionContext implements IExecutionContext {
  private readonly packageReader: PackageJsonReader;
  private readonly cutoffDate: Date;
  private readonly cutoffIsoString: string;
  private readonly safetyBufferDays: number;
  private readonly scriptOptions: ScriptOptions;

  /**
   * Creates a new ExecutionContext instance.
   *
   * Prefer using ExecutionContextFactory.create() for standard usage.
   *
   * @param options - Context configuration options
   */
  constructor(options: ExecutionContextOptions) {
    this.safetyBufferDays = options.days;
    this.scriptOptions = options.scripts;

    // Read package.json once
    this.packageReader = new PackageJsonReader(options.packageJsonPath);

    // Calculate cutoff date once
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    this.cutoffDate = new Date(Date.now() - options.days * ONE_DAY_MS);
    this.cutoffIsoString = this.cutoffDate.toISOString();
  }

  // ============================================================================
  // Package.json Accessors (delegated to PackageJsonReader)
  // ============================================================================

  /**
   * Gets the npm scripts from package.json
   */
  get scripts(): Record<string, string> {
    return this.packageReader.scripts;
  }

  /**
   * Gets all dependencies (both dependencies and devDependencies)
   */
  get allDependencies(): Record<string, string> {
    return this.packageReader.allDependencies;
  }

  /**
   * Gets only production dependencies
   */
  get dependencies(): Record<string, string> {
    return this.packageReader.dependencies;
  }

  /**
   * Gets only dev dependencies
   */
  get devDependencies(): Record<string, string> {
    return this.packageReader.devDependencies;
  }

  /**
   * Gets the raw package.json object
   */
  get raw(): PackageJson {
    return this.packageReader.raw;
  }

  // ============================================================================
  // Workflow Configuration Accessors
  // ============================================================================

  /**
   * Gets the cutoff date for version filtering
   */
  get cutoff(): Date {
    return this.cutoffDate;
  }

  /**
   * Gets the cutoff date as ISO string (for scfw --before flag)
   */
  get cutoffIso(): string {
    return this.cutoffIsoString;
  }

  /**
   * Gets the safety buffer in days
   */
  get days(): number {
    return this.safetyBufferDays;
  }

  /**
   * Gets the configured script names
   */
  get scriptNames(): ScriptOptions {
    return this.scriptOptions;
  }

  // ============================================================================
  // Helper Methods (delegated to PackageJsonReader)
  // ============================================================================

  /**
   * Checks if a script exists in package.json
   */
  hasScript(name: string): boolean {
    return this.packageReader.hasScript(name);
  }

  /**
   * Checks if a package is in dependencies or devDependencies
   */
  hasPackage(name: string): boolean {
    return this.packageReader.hasPackage(name);
  }

  /**
   * Gets the current version of a package
   */
  getPackageVersion(name: string): string | undefined {
    return this.packageReader.getPackageVersion(name);
  }
}
