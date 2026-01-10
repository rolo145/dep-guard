/**
 * Quality Runner
 *
 * Handles execution of all quality checks.
 * Orchestrates running lint, type check, test, and build services.
 *
 * @module quality/QualityRunner
 */
import { LintService } from "./lint/LintService";
import { TypeCheckService } from "./typecheck/TypeCheckService";
import { TestService } from "./test/TestService";
import { BuildService } from "./build/BuildService";

export interface QualityCheckResults {
  lint: boolean | null;
  typeCheck: boolean | null;
  tests: boolean | null;
}

/**
 * Runner for orchestrating multiple quality check services.
 *
 * Executes lint, type check, and test services in sequence and
 * aggregates their results.
 */
export class QualityRunner {
  private lintService: LintService;
  private typeCheckService: TypeCheckService;
  private testService: TestService;
  private buildService: BuildService;

  constructor() {
    this.lintService = new LintService();
    this.typeCheckService = new TypeCheckService();
    this.testService = new TestService();
    this.buildService = new BuildService();
  }

  /**
   * Runs all quality checks in sequence
   *
   * @returns Results object with pass/fail/skip status for each check
   */
  async runAll(): Promise<QualityCheckResults> {
    const results: QualityCheckResults = {
      lint: await this.lintService.run(),
      typeCheck: await this.typeCheckService.run(),
      tests: await this.testService.run(),
    };

    return results;
  }

  /**
   * Runs lint check
   *
   * @returns True if passed, false if failed, null if skipped
   */
  async runLint(): Promise<boolean | null> {
    return this.lintService.run();
  }

  /**
   * Runs type check
   *
   * @returns True if passed, false if failed, null if skipped
   */
  async runTypeCheck(): Promise<boolean | null> {
    return this.typeCheckService.run();
  }

  /**
   * Runs tests
   *
   * @returns True if passed, false if failed, null if skipped
   */
  async runTests(): Promise<boolean | null> {
    return this.testService.run();
  }

  /**
   * Runs build
   *
   * @returns True if passed, false if failed, null if skipped
   */
  async runBuild(): Promise<boolean | null> {
    return this.buildService.run();
  }
}
