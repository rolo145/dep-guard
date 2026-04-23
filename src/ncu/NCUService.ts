import type { GroupedUpdates, PackageSelection } from "./types";
import type { PromptChoice } from "./PromptChoiceBuilder";
import type { IExecutionContext } from "../context/IExecutionContext";
import { VersionAnalyzer } from "./VersionAnalyzer";
import { PromptChoiceBuilder } from "./PromptChoiceBuilder";
import { NCUConfirmation } from "./NCUConfirmation";
import { NCURegistryService } from "./NCURegistryService";
import { NCURunner } from "./NCURunner";

export interface NCUGroupingResult {
  grouped: GroupedUpdates;
  choices: PromptChoice[];
}

export class NCUService {
  private readonly context: IExecutionContext;
  private runner: NCURunner;
  private confirmation: NCUConfirmation;
  private registry: NCURegistryService;

  constructor(context: IExecutionContext) {
    this.context = context;
    this.runner = new NCURunner();
    this.confirmation = new NCUConfirmation();
    this.registry = new NCURegistryService(context);
  }

  async loadUpdates(): Promise<Record<string, string>> {
    const spinner = this.confirmation.showQueryingUpdates();
    const updates = await this.runner.loadUpdates();
    spinner.stop();
    return updates;
  }

  showNoUpdates(): void {
    this.confirmation.showNoUpdates();
  }

  showPotentialUpdates(count: number): void {
    this.confirmation.showPotentialUpdates(count);
  }

  async filterByAge(updates: Record<string, string>): Promise<Record<string, string>> {
    return this.registry.filterUpdatesByAge(updates);
  }

  showNoSafeUpdates(days: number): void {
    this.confirmation.showNoSafeUpdates(days);
  }

  showSafeUpdates(count: number): void {
    this.confirmation.showSafeUpdates(count);
  }

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

  showGroupSummary(grouped: GroupedUpdates): void {
    this.confirmation.showGroupSummary(grouped);
  }

  async promptSelection(choices: PromptChoice[]): Promise<PackageSelection[]> {
    return this.confirmation.promptSelection(choices);
  }
}
