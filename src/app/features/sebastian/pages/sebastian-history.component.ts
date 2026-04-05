import { DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import type {
  SebastianCategory,
  SebastianEntry,
} from "../../../core/models/sebastian.model";
import {
  SEBASTIAN_PORT,
  type SebastianPort,
} from "../../../core/ports/sebastian.port";

/**
 * Page d'historique des consommations Sebastian.
 * Affiche la liste des entrees avec filtres par categorie et dates,
 * et permet la suppression d'entrees individuelles.
 */
@Component({
  selector: "app-sebastian-history",
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="space-y-6">
      <!-- Barre de filtres -->
      <div
        class="flex flex-wrap gap-3 rounded-card border border-scheme-border bg-scheme-surface p-4"
      >
        <select
          data-testid="category-filter"
          class="rounded-form border border-scheme-border bg-scheme-surface px-3 py-2 text-sm text-scheme-text"
          [ngModel]="filterCategory()"
          (ngModelChange)="onCategoryChange($event)"
        >
          <option value="">Toutes les categories</option>
          <option value="alcohol">Alcool</option>
          <option value="coffee">Cafe</option>
        </select>

        <input
          data-testid="date-from"
          type="date"
          class="rounded-form border border-scheme-border bg-scheme-surface px-3 py-2 text-sm text-scheme-text"
          [ngModel]="filterFrom()"
          (ngModelChange)="onFromChange($event)"
          placeholder="Date debut"
        />
        <input
          data-testid="date-to"
          type="date"
          class="rounded-form border border-scheme-border bg-scheme-surface px-3 py-2 text-sm text-scheme-text"
          [ngModel]="filterTo()"
          (ngModelChange)="onToChange($event)"
          placeholder="Date fin"
        />
      </div>

      <!-- Liste des entrees -->
      <div class="space-y-2">
        @for (entry of entries(); track entry.id) {
          <div
            data-testid="entry-item"
            class="flex items-center justify-between rounded-card border border-scheme-border bg-scheme-surface px-4 py-3"
          >
            <div class="flex items-center gap-3">
              <span class="text-xl">{{
                entry.category === "alcohol" ? "🍺" : "☕"
              }}</span>
              <div>
                <span class="font-medium text-scheme-text"
                  >{{ entry.quantity }}
                  {{
                    entry.category === "alcohol" ? "verre(s)" : "tasse(s)"
                  }}</span
                >
                <p class="text-xs text-scheme-text-muted">
                  {{ entry.date | date: "dd/MM/yyyy" }}
                  @if (entry.notes) {
                    — {{ entry.notes }}
                  }
                </p>
              </div>
            </div>
            <button
              data-testid="delete-entry"
              type="button"
              class="rounded-lg px-2 py-1 text-sm text-red-400 transition-colors hover:bg-red-400/20"
              (click)="removeEntry(entry.id)"
            >
              Supprimer
            </button>
          </div>
        } @empty {
          <p
            data-testid="empty-state"
            class="text-center text-sm text-scheme-text-muted"
          >
            Aucune entree enregistree
          </p>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianHistoryComponent {
  private readonly port: SebastianPort = inject(SEBASTIAN_PORT);

  /** Liste des entrees chargees. */
  readonly entries = signal<SebastianEntry[]>([]);

  /** Filtre par categorie. */
  readonly filterCategory = signal<SebastianCategory | "">("");

  /** Filtre date de debut. */
  readonly filterFrom = signal<string>("");

  /** Filtre date de fin. */
  readonly filterTo = signal<string>("");

  constructor() {
    this.loadEntries();
  }

  /** Charge les entrees depuis le port avec les filtres actifs. */
  loadEntries(): void {
    const params: {
      from?: string;
      to?: string;
      category?: SebastianCategory;
    } = {};

    const category = this.filterCategory();
    if (category) {
      params.category = category;
    }
    const from = this.filterFrom();
    if (from) {
      params.from = from;
    }
    const to = this.filterTo();
    if (to) {
      params.to = to;
    }

    this.port
      .getEntries(Object.keys(params).length > 0 ? params : undefined)
      .subscribe((entries) => this.entries.set(entries));
  }

  /** Met a jour le filtre de categorie et recharge. */
  onCategoryChange(value: SebastianCategory | ""): void {
    this.filterCategory.set(value);
    this.loadEntries();
  }

  /** Met a jour le filtre date de debut et recharge. */
  onFromChange(value: string): void {
    this.filterFrom.set(value);
    this.loadEntries();
  }

  /** Met a jour le filtre date de fin et recharge. */
  onToChange(value: string): void {
    this.filterTo.set(value);
    this.loadEntries();
  }

  /** Supprime une entree et met a jour la liste locale. */
  removeEntry(id: string): void {
    this.port.deleteEntry(id).subscribe(() => {
      this.entries.update((list) => list.filter((e) => e.id !== id));
    });
  }
}
