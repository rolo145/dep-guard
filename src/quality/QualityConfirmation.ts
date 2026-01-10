/**
 * Quality Confirmation
 *
 * Handles user feedback and UI for quality check orchestration.
 * Displays summary messages for quality check results.
 *
 * @module quality/QualityConfirmation
 */
import { logger } from "../logger";
import { QualityCheckResults } from "./QualityRunner";

/**
 * Handles user feedback for quality check orchestration.
 *
 * Displays summary messages based on quality check results.
 */
export class QualityConfirmation {
  /**
   * Shows summary of quality check results
   *
   * @param results - Results from running quality checks
   */
  showSummary(results: QualityCheckResults): void {
    const failures = [
      results.lint === false && "lint",
      results.typeCheck === false && "type checks",
      results.tests === false && "tests",
    ].filter(Boolean);

    if (failures.length > 0) {
      logger.warning(`Quality checks completed with failures: ${failures.join(", ")}`);
    } else {
      logger.success("Quality checks complete!");
    }
  }
}
