import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import type {
  CreateGoalPayload,
  SebastianCategory,
  SebastianGoal,
  SebastianPeriod,
} from "../../../core/models/sebastian.model";
import {
  SEBASTIAN_PORT,
  type SebastianPort,
} from "../../../core/ports/sebastian.port";

/**
 * Page de gestion des objectifs Sebastian.
 * Permet de creer, visualiser et supprimer des objectifs
 * de consommation (alcool, cafe).
 */
@Component({
  selector: "app-sebastian-goals",
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Formulaire d'ajout d'objectif -->
      <div
        class="rounded-card border border-scheme-border bg-scheme-surface p-6"
      >
        <h2 class="mb-4 font-heading text-h5 text-scheme-text">
          Nouvel objectif
        </h2>
        <div class="space-y-3">
          <select
            data-testid="goal-category"
            class="w-full rounded-form border border-scheme-border bg-scheme-surface px-3 py-2 text-sm text-scheme-text"
            [(ngModel)]="goalCategory"
          >
            <option value="alcohol">Alcool</option>
            <option value="coffee">Cafe</option>
          </select>
          <input
            data-testid="goal-quantity"
            type="number"
            min="1"
            class="w-full rounded-form border border-scheme-border bg-scheme-surface px-3 py-2 text-sm text-scheme-text placeholder-scheme-text-muted"
            [(ngModel)]="goalQuantity"
            placeholder="Quantite max"
          />
          <select
            data-testid="goal-period"
            class="w-full rounded-form border border-scheme-border bg-scheme-surface px-3 py-2 text-sm text-scheme-text"
            [(ngModel)]="goalPeriod"
          >
            <option value="daily">Quotidien</option>
            <option value="weekly">Hebdomadaire</option>
            <option value="monthly">Mensuel</option>
          </select>
          <button
            data-testid="goal-submit"
            type="button"
            class="w-full rounded-button bg-scheme-accent px-4 py-2 text-sm font-semibold text-scheme-on-accent transition-colors hover:bg-scheme-accent-hover"
            (click)="addGoal()"
          >
            Definir l'objectif
          </button>
        </div>
      </div>

      <!-- Liste des objectifs actifs -->
      <div class="space-y-2">
        @for (goal of goals(); track goal.id) {
          <div
            data-testid="goal-item"
            class="flex items-center justify-between rounded-card border border-scheme-border bg-scheme-surface px-4 py-3"
          >
            <div class="flex items-center gap-3">
              <span class="text-xl">{{
                goal.category === "alcohol" ? "🍺" : "☕"
              }}</span>
              <span class="text-sm font-medium text-scheme-text">
                {{ goal.targetQuantity }}/{{
                  goal.period === "daily"
                    ? "jour"
                    : goal.period === "weekly"
                      ? "sem."
                      : "mois"
                }}
              </span>
            </div>
            <button
              data-testid="delete-goal"
              type="button"
              class="rounded-lg px-2 py-1 text-sm text-red-400 transition-colors hover:bg-red-400/20"
              (click)="removeGoal(goal.id)"
            >
              Supprimer
            </button>
          </div>
        } @empty {
          <p
            data-testid="empty-state"
            class="text-center text-sm text-scheme-text-muted"
          >
            Aucun objectif actif
          </p>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianGoalsComponent {
  private readonly port: SebastianPort = inject(SEBASTIAN_PORT);

  /** Objectifs actifs. */
  readonly goals = signal<SebastianGoal[]>([]);

  /** Champs du formulaire. */
  goalCategory: SebastianCategory = "coffee";
  goalQuantity = 3;
  goalPeriod: SebastianPeriod = "daily";

  constructor() {
    this.loadGoals();
  }

  /** Charge les objectifs depuis le port. */
  loadGoals(): void {
    this.port.getGoals().subscribe((goals) => this.goals.set(goals));
  }

  /** Ajoute un nouvel objectif et met a jour la liste. */
  addGoal(): void {
    const payload: CreateGoalPayload = {
      category: this.goalCategory,
      targetQuantity: this.goalQuantity,
      period: this.goalPeriod,
    };
    this.port.setGoal(payload).subscribe((goal) => {
      this.goals.update((list) => [...list, goal]);
    });
  }

  /** Supprime un objectif et met a jour la liste locale. */
  removeGoal(id: string): void {
    this.port.deleteGoal(id).subscribe(() => {
      this.goals.update((list) => list.filter((g) => g.id !== id));
    });
  }
}
