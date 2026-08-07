import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import type { SebastianHeatmapPoint } from '../../../core/models/sebastian.model';

type HeatmapMode = 'combined' | 'alcohol' | 'coffee';

interface ModeOption {
  value: HeatmapMode;
  label: string;
}

@Component({
  selector: 'app-sebastian-heatmap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      data-testid="heatmap-container"
      class="rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-4"
    >
      <div class="mb-4 flex gap-2">
        @for (m of modes; track m.value) {
          <button
            data-testid="mode-button"
            (click)="mode.set(m.value)"
            [class]="
              mode() === m.value
                ? 'bg-gold text-[#1a1206] border-gold'
                : 'bg-white/[0.04] text-white/55 hover:text-white hover:border-[rgba(230,170,70,0.35)]'
            "
            class="rounded-full border border-[rgba(230,170,70,0.14)] px-3 py-1 font-mono text-xs uppercase tracking-[0.06em] transition-colors"
          >
            {{ m.label }}
          </button>
        }
      </div>

      <div class="mb-1 grid grid-cols-7 gap-1 text-center">
        @for (label of dayLabels; track label) {
          <span class="font-mono text-xs text-white/45">{{ label }}</span>
        }
      </div>

      <div class="grid grid-cols-7 gap-1">
        @for (cell of cells(); track cell.date) {
          <div
            data-testid="heatmap-cell"
            [class]="cellClass(cell)"
            class="flex h-8 w-full items-center justify-center rounded text-xs font-medium"
          >
            {{ cell.dayNumber }}
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianHeatmapComponent {
  readonly data = input.required<SebastianHeatmapPoint[]>();

  readonly mode = signal<HeatmapMode>('combined');

  readonly modes: ModeOption[] = [
    { value: 'combined', label: 'Combine' },
    { value: 'alcohol', label: 'Alcool' },
    { value: 'coffee', label: 'Cafe' },
  ];

  readonly dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  readonly cells = computed(() => {
    return this.data().map((point) => ({
      date: point.date,
      dayNumber: new Date(point.date).getDate(),
      value: this.getValue(point),
    }));
  });

  private readonly maxValue = computed(() => {
    const values = this.cells().map((c) => c.value);
    return Math.max(...values, 1);
  });

  cellClass(cell: { value: number }): string {
    if (cell.value === 0) {
      return 'bg-[rgba(230,170,70,0.1)] text-white/40';
    }

    const ratio = cell.value / this.maxValue();

    if (ratio <= 0.25) {
      return 'bg-[rgba(230,170,70,0.3)] text-white/80';
    }
    if (ratio <= 0.5) {
      return 'bg-[rgba(230,170,70,0.55)] text-[#1a1206]';
    }
    if (ratio <= 0.75) {
      return 'bg-[rgba(230,170,70,0.7)] text-[#1a1206]';
    }
    return 'bg-[rgba(230,170,70,0.85)] text-[#1a1206]';
  }

  private getValue(point: SebastianHeatmapPoint): number {
    switch (this.mode()) {
      case 'alcohol':
        return point.alcohol;
      case 'coffee':
        return point.coffee;
      case 'combined':
      default:
        return point.combined;
    }
  }
}
