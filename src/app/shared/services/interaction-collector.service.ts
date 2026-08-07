import { computed, Injectable, signal } from '@angular/core';
import type { InteractionProfile } from '../../core/models/interaction-profile.model';

@Injectable()
export class InteractionCollectorService {
  private readonly _aiLevel = signal<InteractionProfile['aiLevel']>(null);
  private readonly _toolsAlreadyUsed = signal<string[]>([]);
  private readonly _budgetTier = signal<InteractionProfile['budgetTier']>(null);
  private readonly _sector = signal<string | null>(null);
  private readonly _generatedPrompt = signal<string | null>(null);

  readonly profile = computed<InteractionProfile>(() => ({
    aiLevel: this._aiLevel(),
    toolsAlreadyUsed: this._toolsAlreadyUsed(),
    budgetTier: this._budgetTier(),
    sector: this._sector(),
    generatedPrompt: this._generatedPrompt(),
  }));

  readonly hasData = computed<boolean>(() => {
    return (
      this._aiLevel() !== null ||
      this._toolsAlreadyUsed().length > 0 ||
      this._budgetTier() !== null ||
      this._sector() !== null ||
      this._generatedPrompt() !== null
    );
  });

  setAiLevel(level: InteractionProfile['aiLevel']): void {
    this._aiLevel.set(level);
  }

  setToolsUsed(tools: string[]): void {
    this._toolsAlreadyUsed.set(tools);
  }

  setBudgetTier(tier: InteractionProfile['budgetTier']): void {
    this._budgetTier.set(tier);
  }

  setSector(sector: string | null): void {
    this._sector.set(sector);
  }

  setGeneratedPrompt(prompt: string | null): void {
    this._generatedPrompt.set(prompt);
  }
}
