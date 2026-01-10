/**
 * Workflow Context
 *
 * Singleton class that caches frequently accessed data to avoid repeated
 * file reads and calculations during the workflow execution.
 *
 * Cached data:
 * - package.json contents (scripts, dependencies)
 * - Cutoff date for safety buffer calculations
 *
 * @module context/WorkflowContext
 */

import fs from "fs";
import type { ScriptOptions } from "../constants/config";

/** Parsed package.json structure */
interface PackageJson {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Workflow context containing cached data for the update workflow
 *
 * This class reads package.json once and calculates the cutoff date once,
 * providing efficient access throughout the workflow execution.
 */
export class WorkflowContext {
  private static instance: WorkflowContext | null = null;

  private readonly packageJson: PackageJson;
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
    this.packageJson = this.readPackageJsonFile();

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

  /**
   * Reads and parses package.json from current directory
   */
  private readPackageJsonFile(): PackageJson {
    const content = fs.readFileSync("package.json", "utf8");
    return JSON.parse(content);
  }

  // ============================================================================
  // Accessors
  // ============================================================================

  /**
   * Gets the npm scripts from package.json
   */
  get scripts(): Record<string, string> {
    return this.packageJson.scripts ?? {};
  }

  /**
   * Gets all dependencies (both dependencies and devDependencies)
   */
  get allDependencies(): Record<string, string> {
    return {
      ...this.packageJson.dependencies,
      ...this.packageJson.devDependencies,
    };
  }

  /**
   * Gets only production dependencies
   */
  get dependencies(): Record<string, string> {
    return this.packageJson.dependencies ?? {};
  }

  /**
   * Gets only dev dependencies
   */
  get devDependencies(): Record<string, string> {
    return this.packageJson.devDependencies ?? {};
  }

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

  /**
   * Gets the raw package.json object
   */
  get raw(): PackageJson {
    return this.packageJson;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Checks if a script exists in package.json
   */
  hasScript(name: string): boolean {
    return !!this.scripts[name];
  }

  /**
   * Checks if a package is in dependencies or devDependencies
   */
  hasPackage(name: string): boolean {
    return !!(this.packageJson.dependencies?.[name] || this.packageJson.devDependencies?.[name]);
  }

  /**
   * Gets the current version of a package
   */
  getPackageVersion(name: string): string | undefined {
    return this.packageJson.dependencies?.[name] ?? this.packageJson.devDependencies?.[name];
  }
}
