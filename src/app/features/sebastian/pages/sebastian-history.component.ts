import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { SebastianCategory, SebastianEntry } from '../../../core/models/sebastian.model';
import { SEBASTIAN_PORT, type SebastianPort } from '../../../core/ports/sebastian.port';

@Component({
  selector: 'app-sebastian-history',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="space-y-6">
      <div
        class="flex flex-wrap gap-3 rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-4"
      >
        <select
          data-testid="category-filter"
          class="rounded-lg border border-[rgba(230,170,70,0.14)] bg-white/[0.04] px-3 py-2 text-sm text-white transition-colors focus:border-[rgba(230,170,70,0.45)] focus:outline-none [&>option]:bg-[#14100a] [&>option]:text-white"
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
          class="rounded-lg border border-[rgba(230,170,70,0.14)] bg-white/[0.04] px-3 py-2 text-sm text-white transition-colors focus:border-[rgba(230,170,70,0.45)] focus:outline-none [color-scheme:dark]"
          [ngModel]="filterFrom()"
          (ngModelChange)="onFromChange($event)"
          placeholder="Date debut"
        />
        <input
          data-testid="date-to"
          type="date"
          class="rounded-lg border border-[rgba(230,170,70,0.14)] bg-white/[0.04] px-3 py-2 text-sm text-white transition-colors focus:border-[rgba(230,170,70,0.45)] focus:outline-none [color-scheme:dark]"
          [ngModel]="filterTo()"
          (ngModelChange)="onToChange($event)"
          placeholder="Date fin"
        />
      </div>

      <div class="space-y-1">
        @for (entry of entries(); track entry.id) {
          <div
            data-testid="entry-item"
            class="flex items-center justify-between rounded-[10px] px-3 py-3 transition-colors hover:bg-white/[0.04]"
          >
            <div class="flex items-center gap-3">
              <span class="text-xl">{{
                entry.drinkType === 'wine'
                  ? '🍷'
                  : entry.drinkType === 'champagne'
                    ? '🍾'
                    : entry.category === 'alcohol'
                      ? '🍺'
                      : '☕'
              }}</span>
              <div>
                <span class="font-medium text-white">
                  {{ entry.quantity }}
                  {{
                    entry.drinkType === 'wine'
                      ? 'verre(s) de vin'
                      : entry.drinkType === 'champagne'
                        ? 'coupe(s) de champagne'
                        : entry.category === 'alcohol'
                          ? 'biere(s)'
                          : 'tasse(s)'
                  }}
                  @if (entry.alcoholDegree) {
                    {{ entry.alcoholDegree }}°
                  }
                  @if (entry.volumeCl) {
                    ({{ entry.volumeCl }}cl)
                  }
                </span>
                <p class="font-mono text-xs text-white/45">
                  {{ entry.date | date: 'dd/MM/yyyy' }}
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
          <p data-testid="empty-state" class="text-center text-sm text-white/45">
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

  readonly entries = signal<SebastianEntry[]>([]);

  readonly filterCategory = signal<SebastianCategory | ''>('');

  readonly filterFrom = signal<string>('');

  readonly filterTo = signal<string>('');

  constructor() {
    this.loadEntries();
  }

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

  onCategoryChange(value: SebastianCategory | ''): void {
    this.filterCategory.set(value);
    this.loadEntries();
  }

  onFromChange(value: string): void {
    this.filterFrom.set(value);
    this.loadEntries();
  }

  onToChange(value: string): void {
    this.filterTo.set(value);
    this.loadEntries();
  }

  removeEntry(id: string): void {
    this.port.deleteEntry(id).subscribe(() => {
      this.entries.update((list) => list.filter((e) => e.id !== id));
    });
  }
}
