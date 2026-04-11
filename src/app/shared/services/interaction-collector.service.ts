import { computed, Injectable, signal } from "@angular/core";
import type { InteractionProfile } from "../../core/models/interaction-profile.model";

/**
 * Service de collecte du profil d'interaction du lecteur.
 *
 * Scope au composant via `providers` (pas `providedIn: 'root'`).
 * Accumule les reponses aux interactions (self-rating, checklist, demo)
 * pour enrichir la demande de toolkit (lead magnet).
 */
@Injectable()
export class InteractionCollectorService {
  private readonly _aiLevel = signal<InteractionProfile["aiLevel"]>(null);
  private readonly _toolsAlreadyUsed = signal<string[]>([]);
  private readonly _budgetTier = signal<InteractionProfile["budgetTier"]>(null);
  private readonly _sector = signal<string | null>(null);
  private readonly _generatedPrompt = signal<string | null>(null);

  /** Profil agrege en lecture seule, derive des signaux internes. */
  readonly profile = computed<InteractionProfile>(() => ({
    aiLevel: this._aiLevel(),
    toolsAlreadyUsed: this._toolsAlreadyUsed(),
    budgetTier: this._budgetTier(),
    sector: this._sector(),
    generatedPrompt: this._generatedPrompt(),
  }));

  /** True si au moins un champ a ete renseigne par le lecteur. */
  readonly hasData = computed<boolean>(() => {
    return (
      this._aiLevel() !== null ||
      this._toolsAlreadyUsed().length > 0 ||
      this._budgetTier() !== null ||
      this._sector() !== null ||
      this._generatedPrompt() !== null
    );
  });

  /** Met a jour le niveau IA auto-evalue. */
  setAiLevel(level: InteractionProfile["aiLevel"]): void {
    this._aiLevel.set(level);
  }

  /** Met a jour la liste d'outils deja utilises. */
  setToolsUsed(tools: string[]): void {
    this._toolsAlreadyUsed.set(tools);
  }

  /** Met a jour la tranche budgetaire. */
  setBudgetTier(tier: InteractionProfile["budgetTier"]): void {
    this._budgetTier.set(tier);
  }

  /** Met a jour le secteur d'activite saisi. */
  setSector(sector: string | null): void {
    this._sector.set(sector);
  }

  /** Met a jour le prompt genere. */
  setGeneratedPrompt(prompt: string | null): void {
    this._generatedPrompt.set(prompt);
  }
}
