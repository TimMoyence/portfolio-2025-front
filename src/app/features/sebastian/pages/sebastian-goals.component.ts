import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  CreateGoalPayload,
  SebastianCategory,
  SebastianGoal,
  SebastianPeriod,
} from '../../../core/models/sebastian.model';
import { SEBASTIAN_PORT, type SebastianPort } from '../../../core/ports/sebastian.port';

const PERIOD_UNITS: Record<SebastianPeriod, string> = {
  daily: $localize`:@@sebastianGoalPerDay:jour`,
  weekly: $localize`:@@sebastianGoalPerWeek:sem.`,
  monthly: $localize`:@@sebastianGoalPerMonth:mois`,
};

const PERIOD_LABELS: Record<SebastianPeriod, string> = {
  daily: $localize`:@@sebastianGoalPeriodDaily:Quotidien`,
  weekly: $localize`:@@sebastianGoalPeriodWeekly:Hebdomadaire`,
  monthly: $localize`:@@sebastianGoalPeriodMonthly:Mensuel`,
};

@Component({
  selector: 'app-sebastian-goals',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <div
        class="rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-6 backdrop-blur-[18px]"
      >
        <h2 class="mb-4 font-display text-h5 text-white" i18n="@@sebastianGoalNew">
          Nouvel objectif
        </h2>
        <div class="space-y-3">
          <select
            data-testid="goal-category"
            class="w-full rounded-lg border border-[rgba(230,170,70,0.14)] bg-white/[0.04] px-3 py-2 text-sm text-white transition-colors focus:border-[rgba(230,170,70,0.45)] focus:outline-none [&>option]:bg-[#14100a] [&>option]:text-white"
            [(ngModel)]="goalCategory"
          >
            <option value="alcohol" i18n="@@sebastianCategoryAlcohol">Alcool</option>
            <option value="coffee" i18n="@@sebastianCategoryCoffee">Cafe</option>
          </select>
          <input
            data-testid="goal-quantity"
            type="number"
            min="1"
            class="w-full rounded-lg border border-[rgba(230,170,70,0.14)] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/30 transition-colors focus:border-[rgba(230,170,70,0.45)] focus:outline-none"
            [(ngModel)]="goalQuantity"
            placeholder="Quantite max"
            i18n-placeholder="@@sebastianGoalQuantityPlaceholder"
          />
          <select
            data-testid="goal-period"
            class="w-full rounded-lg border border-[rgba(230,170,70,0.14)] bg-white/[0.04] px-3 py-2 text-sm text-white transition-colors focus:border-[rgba(230,170,70,0.45)] focus:outline-none [&>option]:bg-[#14100a] [&>option]:text-white"
            [(ngModel)]="goalPeriod"
          >
            @for (period of periods; track period) {
              <option [value]="period">{{ periodLabels[period] }}</option>
            }
          </select>
          <button
            data-testid="goal-submit"
            type="button"
            class="w-full rounded-full bg-gold px-4 py-2 text-sm font-semibold text-[#1a1206] transition-transform hover:-translate-y-0.5"
            (click)="addGoal()"
            i18n="@@sebastianGoalSubmit"
          >
            Definir l'objectif
          </button>
        </div>
      </div>

      <div class="space-y-3">
        @for (goal of goals(); track goal.id) {
          <div
            data-testid="goal-item"
            class="rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-5"
          >
            <div class="mb-3 flex items-center justify-between gap-3">
              <span class="flex items-center gap-2 text-base font-semibold text-white">
                <span class="text-xl">{{ goal.category === 'alcohol' ? '🍺' : '☕' }}</span>
                {{ goal.targetQuantity }}/{{ periodUnits[goal.period] }}
              </span>
              <button
                data-testid="delete-goal"
                type="button"
                class="rounded-lg px-2 py-1 text-sm text-red-400 transition-colors hover:bg-red-400/20"
                (click)="removeGoal(goal.id)"
                i18n="@@sebastianDelete"
              >
                Supprimer
              </button>
            </div>
            <div class="flex gap-5 font-mono text-xs text-white/55">
              <span>{{ periodLabels[goal.period] }}</span>
            </div>
          </div>
        } @empty {
          <p
            data-testid="empty-state"
            class="text-center text-sm text-white/45"
            i18n="@@sebastianGoalEmpty"
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

  readonly goals = signal<SebastianGoal[]>([]);

  protected readonly periods: readonly SebastianPeriod[] = ['daily', 'weekly', 'monthly'];
  protected readonly periodLabels = PERIOD_LABELS;
  protected readonly periodUnits = PERIOD_UNITS;

  goalCategory: SebastianCategory = 'coffee';
  goalQuantity = 3;
  goalPeriod: SebastianPeriod = 'daily';

  constructor() {
    this.loadGoals();
  }

  loadGoals(): void {
    this.port.getGoals().subscribe((goals) => this.goals.set(goals));
  }

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

  removeGoal(id: string): void {
    this.port.deleteGoal(id).subscribe(() => {
      this.goals.update((list) => list.filter((g) => g.id !== id));
    });
  }
}
