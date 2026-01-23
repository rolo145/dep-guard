/**
 * Quality Service
 *
 * Orchestrates quality check workflow including running multiple checks
 * and displaying summary results.
 *
 * @module quality/QualityService
 */
import type { IExecutionContext } from "../context/IExecutionContext";
import { QualityRunner, QualityCheckResults } from "./QualityRunner";
import { QualityConfirmation } from "./QualityConfirmation";
import type { ServiceResult } from "../types/ServiceResult";

/**
 * Service for orchestrating quality checks.
 *
 * Provides a unified interface for running code quality checks (lint, typecheck, test, build).
 * Handles orchestration, result aggregation, and summary feedback.
 */
export class QualityService {
  private runner: QualityRunner;
  private confirmation: QualityConfirmation;

  /**
   * Creates a new QualityService instance.
   *
   * @param context - Workflow context for accessing configuration
   */
  constructor(context: IExecutionContext) {
    this.runner = new QualityRunner(context);
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
   * @returns ServiceResult - true if passed, false if failed, null if skipped
   */
  async runLint(): Promise<ServiceResult> {
    return this.runner.runLint();
  }

  /**
   * Runs type checking
   *
   * @returns ServiceResult - true if passed, false if failed, null if skipped
   */
  async runTypeCheck(): Promise<ServiceResult> {
    return this.runner.runTypeCheck();
  }

  /**
   * Runs tests
   *
   * @returns ServiceResult - true if passed, false if failed, null if skipped
   */
  async runTests(): Promise<ServiceResult> {
    return this.runner.runTests();
  }

  /**
   * Runs the build script
   *
   * @returns ServiceResult - true if passed, false if failed, null if skipped
   */
  async runBuild(): Promise<ServiceResult> {
    return this.runner.runBuild();
  }
}
