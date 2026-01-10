/**
 * Quality Service
 *
 * Orchestrates quality check workflow including running multiple checks
 * and displaying summary results.
 *
 * @module quality/QualityService
 */
import { QualityRunner, QualityCheckResults } from "./QualityRunner";
import { QualityConfirmation } from "./QualityConfirmation";

/**
 * Service for orchestrating quality checks.
 *
 * Provides a unified interface for running code quality checks (lint, typecheck, test, build).
 * Handles orchestration, result aggregation, and summary feedback.
 */
export class QualityService {
  private runner: QualityRunner;
  private confirmation: QualityConfirmation;

  constructor() {
    this.runner = new QualityRunner();
    this.confirmation = new QualityConfirmation();
  }

  /**
   * Runs all quality checks: lint, type checking, and tests
   *
   * @returns Object with pass/fail/skip status for each check
   */
  async runAll(): Promise<QualityCheckResults> {
    const results = await this.runner.runAll();
    this.confirmation.showSummary(results);
    return results;
  }

  /**
   * Runs the linter
   *
   * @returns True if passed, false if failed, null if skipped
   */
  async runLint(): Promise<boolean | null> {
    return this.runner.runLint();
  }

  /**
   * Runs type checking
   *
   * @returns True if passed, false if failed, null if skipped
   */
  async runTypeCheck(): Promise<boolean | null> {
    return this.runner.runTypeCheck();
  }

  /**
   * Runs tests
   *
   * @returns True if passed, false if failed, null if skipped
   */
  async runTests(): Promise<boolean | null> {
    return this.runner.runTests();
  }

  /**
   * Runs the build script
   *
   * @returns True if passed, false if failed, null if skipped
   */
  async runBuild(): Promise<boolean | null> {
    return this.runner.runBuild();
  }
}
