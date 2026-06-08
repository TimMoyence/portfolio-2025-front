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
    <!--
      Objectifs App Sebastian — thème "dark lounge ambré" porté de la maquette
      AsiliNewDesign/sebastian-app.html + asili-app.css : .panel (glass) pour le
      formulaire, .goal/.goal-top/.gmeta pour chaque objectif. PAS de barre de
      progression : le modèle SebastianGoal n'expose aucun avancement réel, on
      n'affiche donc pas la jauge gold de la maquette (donnée fictive proscrite).
      Restyle 100 % visuel : goalCategory/goalQuantity/goalPeriod, addGoal/
      removeGoal/loadGoals, emoji 🍺/☕ par catégorie, état vide et tous les
      data-testid (goal-category/goal-quantity/goal-period/goal-submit,
      goal-item, delete-goal, empty-state) conservés.
    -->
    <div class="space-y-6">
      <!-- Formulaire d'ajout d'objectif (glass .panel, champs dark ambrés) -->
      <div
        class="rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-6 backdrop-blur-[18px]"
      >
        <h2 class="mb-4 font-display text-h5 text-white">Nouvel objectif</h2>
        <div class="space-y-3">
          <select
            data-testid="goal-category"
            class="w-full rounded-lg border border-[rgba(230,170,70,0.14)] bg-white/[0.04] px-3 py-2 text-sm text-white transition-colors focus:border-[rgba(230,170,70,0.45)] focus:outline-none [&>option]:bg-[#14100a] [&>option]:text-white"
            [(ngModel)]="goalCategory"
          >
            <option value="alcohol">Alcool</option>
            <option value="coffee">Cafe</option>
          </select>
          <input
            data-testid="goal-quantity"
            type="number"
            min="1"
            class="w-full rounded-lg border border-[rgba(230,170,70,0.14)] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/30 transition-colors focus:border-[rgba(230,170,70,0.45)] focus:outline-none"
            [(ngModel)]="goalQuantity"
            placeholder="Quantite max"
          />
          <select
            data-testid="goal-period"
            class="w-full rounded-lg border border-[rgba(230,170,70,0.14)] bg-white/[0.04] px-3 py-2 text-sm text-white transition-colors focus:border-[rgba(230,170,70,0.45)] focus:outline-none [&>option]:bg-[#14100a] [&>option]:text-white"
            [(ngModel)]="goalPeriod"
          >
            <option value="daily">Quotidien</option>
            <option value="weekly">Hebdomadaire</option>
            <option value="monthly">Mensuel</option>
          </select>
          <button
            data-testid="goal-submit"
            type="button"
            class="w-full rounded-full bg-gold px-4 py-2 text-sm font-semibold text-[#1a1206] transition-transform hover:-translate-y-0.5"
            (click)="addGoal()"
          >
            Definir l'objectif
          </button>
        </div>
      </div>

      <!-- Liste des objectifs actifs (.goal/.goal-top/.goal-track/.gmeta) -->
      <div class="space-y-3">
        @for (goal of goals(); track goal.id) {
          <div
            data-testid="goal-item"
            class="rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-5"
          >
            <!-- .goal-top : libellé + suppression -->
            <div class="mb-3 flex items-center justify-between gap-3">
              <span
                class="flex items-center gap-2 text-base font-semibold text-white"
              >
                <span class="text-xl">{{
                  goal.category === "alcohol" ? "🍺" : "☕"
                }}</span>
                {{ goal.targetQuantity }}/{{
                  goal.period === "daily"
                    ? "jour"
                    : goal.period === "weekly"
                      ? "sem."
                      : "mois"
                }}
              </span>
              <button
                data-testid="delete-goal"
                type="button"
                class="rounded-lg px-2 py-1 text-sm text-red-400 transition-colors hover:bg-red-400/20"
                (click)="removeGoal(goal.id)"
              >
                Supprimer
              </button>
            </div>
            <!-- .gmeta : période (factuelle ; pas de jauge d'avancement fictive) -->
            <div class="flex gap-5 font-mono text-xs text-white/55">
              <span>{{
                goal.period === "daily"
                  ? "Quotidien"
                  : goal.period === "weekly"
                    ? "Hebdomadaire"
                    : "Mensuel"
              }}</span>
            </div>
          </div>
        } @empty {
          <p
            data-testid="empty-state"
            class="text-center text-sm text-white/45"
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
