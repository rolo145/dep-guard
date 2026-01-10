/**
 * NCU Service
 *
 * Orchestrates npm-check-updates workflow including loading updates,
 * filtering, grouping, and prompting user selection.
 *
 * @module ncu/NCUService
 */
import type { GroupedUpdates, PackageSelection } from "./types";
import type { PromptChoice } from "./PromptChoiceBuilder";
import { VersionAnalyzer } from "./VersionAnalyzer";
import { PromptChoiceBuilder } from "./PromptChoiceBuilder";
import { NCUConfirmation } from "./NCUConfirmation";
import { NCURegistryService } from "./NCURegistryService";
import { NCURunner } from "./NCURunner";

export interface NCUGroupingResult {
  grouped: GroupedUpdates;
  choices: PromptChoice[];
}

/**
 * Service for orchestrating npm-check-updates workflow.
 */
export class NCUService {
  private runner: NCURunner;
  private confirmation: NCUConfirmation;
  private registry: NCURegistryService;

  constructor() {
    this.runner = new NCURunner();
    this.confirmation = new NCUConfirmation();
    this.registry = new NCURegistryService();
  }

  /**
   * Loads raw updates from npm-check-updates
   */
  async loadUpdates(): Promise<Record<string, string>> {
    const spinner = this.confirmation.showQueryingUpdates();
    const updates = await this.runner.loadUpdates();
    spinner.stop();
    return updates;
  }

  /**
   * Displays message for no updates
   */
  showNoUpdates(): void {
    this.confirmation.showNoUpdates();
  }

  /**
   * Displays count of potential updates
   */
  showPotentialUpdates(count: number): void {
    this.confirmation.showPotentialUpdates(count);
  }

  /**
   * Filters updates by safety buffer
   */
  async filterByAge(updates: Record<string, string>): Promise<Record<string, string>> {
    return this.registry.filterUpdatesByAge(updates);
  }

  /**
   * Displays message for no safe updates
   */
  showNoSafeUpdates(days: number): void {
    this.confirmation.showNoSafeUpdates(days);
  }

  /**
   * Displays count of safe updates
   */
  showSafeUpdates(count: number): void {
    this.confirmation.showSafeUpdates(count);
  }

  /**
   * Groups updates by bump type and builds prompt choices
   */
  buildChoices(
    updates: Record<string, string>,
    allDependencies: Record<string, string>,
  ): NCUGroupingResult {
    const grouped = VersionAnalyzer.groupByType(updates, allDependencies);
    const maxNameLength = VersionAnalyzer.getMaxPackageNameLength(grouped);
    const choices = new PromptChoiceBuilder(grouped, maxNameLength)
      .addPatchGroup()
      .addMinorGroup()
      .addMajorGroup()
      .build();
    return { grouped, choices };
  }

  /**
   * Displays summary of grouped updates
   */
  showGroupSummary(grouped: GroupedUpdates): void {
    this.confirmation.showGroupSummary(grouped);
  }

  /**
   * Prompts user to select packages
   */
  async promptSelection(choices: PromptChoice[]): Promise<PackageSelection[]> {
    return this.confirmation.promptSelection(choices);
  }
}
