/**
 * Workflow Context
 *
 * Singleton class that caches frequently accessed data to avoid repeated
 * calculations during the workflow execution.
 *
 * Cached data:
 * - package.json contents (via PackageJsonReader)
 * - Cutoff date for safety buffer calculations
 *
 * @module context/WorkflowContext
 */
import type { ScriptOptions } from "../constants/config";
import { PackageJsonReader } from "./PackageJsonReader";

/**
 * Workflow context containing cached data for the update workflow
 *
 * This class provides efficient access to package.json data and
 * calculates the cutoff date once at initialization.
 */
export class WorkflowContext {
  private static instance: WorkflowContext | null = null;

  private readonly packageReader: PackageJsonReader;
  private readonly cutoffDate: Date;
  private readonly cutoffIsoString: string;
  private readonly safetyBufferDays: number;
  private readonly scriptOptions: ScriptOptions;

  /**
   * Private constructor - use WorkflowContext.create() or WorkflowContext.getInstance()
   */
  private constructor(days: number, scripts: ScriptOptions) {
    this.safetyBufferDays = days;
    this.scriptOptions = scripts;

    // Read package.json once
    this.packageReader = new PackageJsonReader();

    // Calculate cutoff date once
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    this.cutoffDate = new Date(Date.now() - (days * ONE_DAY_MS));
    this.cutoffIsoString = this.cutoffDate.toISOString();
  }

  /**
   * Creates and initializes the singleton context
   * Should be called once at the start of the workflow
   *
   * @param days - Number of days for safety buffer
   * @param scripts - Script name configuration
   * @returns The initialized context instance
   */
  static create(days: number, scripts: ScriptOptions): WorkflowContext {
    WorkflowContext.instance = new WorkflowContext(days, scripts);
    return WorkflowContext.instance;
  }

  /**
   * Gets the existing context instance
   * Throws if context hasn't been created yet
   *
   * @returns The context instance
   * @throws Error if context hasn't been initialized
   */
  static getInstance(): WorkflowContext {
    if (!WorkflowContext.instance) {
      throw new Error("WorkflowContext not initialized. Call WorkflowContext.create() first.");
    }
    return WorkflowContext.instance;
  }

  /**
   * Checks if context has been initialized
   */
  static isInitialized(): boolean {
    return WorkflowContext.instance !== null;
  }

  /**
   * Resets the singleton instance (useful for testing)
   */
  static reset(): void {
    WorkflowContext.instance = null;
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
  get raw() {
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
