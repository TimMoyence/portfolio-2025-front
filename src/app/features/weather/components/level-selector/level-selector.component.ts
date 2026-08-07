import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import type { WeatherLevel } from '../../../../core/models/weather.model';
import { WeatherLevelService } from '../../services/weather-level.service';

interface LevelTab {
  value: WeatherLevel;
  label: string;
}

@Component({
  selector: 'app-level-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav
      class="inline-flex overflow-hidden rounded-full border p-1 font-mono"
      [ngClass]="
        darkMode()
          ? 'border-teal/15 bg-white/5 backdrop-blur-xl'
          : 'border-scheme-border bg-scheme-surface'
      "
      role="tablist"
      [attr.aria-label]="ariaLabel"
    >
      @for (tab of levels; track tab.value) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="levelService.level() === tab.value"
          class="rounded-full px-4 py-1.5 text-sm font-medium transition-all"
          [ngClass]="
            levelService.level() === tab.value
              ? darkMode()
                ? 'bg-teal font-semibold text-[#06231f]'
                : 'bg-scheme-accent text-white shadow-sm'
              : darkMode()
                ? 'text-white/55 hover:text-white'
                : 'text-scheme-text-muted hover:text-scheme-text'
          "
          (click)="onLevelChange(tab.value)"
        >
          {{ tab.label }}
        </button>
      }
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelSelectorComponent {
  readonly darkMode = input(true);

  readonly levelService = inject(WeatherLevelService);

  readonly levelChanged = output<WeatherLevel>();

  readonly ariaLabel = $localize`:weather.level.selector.aria|@@weatherLevelSelectorAria:Sélecteur de niveau météo`;

  readonly levels: LevelTab[] = [
    {
      value: 'discovery',
      label: $localize`:weather.level.discovery|@@weatherLevelDiscovery:Découverte`,
    },
    {
      value: 'curious',
      label: $localize`:weather.level.curious|@@weatherLevelCurious:Curieux`,
    },
    {
      value: 'expert',
      label: $localize`:weather.level.expert|@@weatherLevelExpert:Expert`,
    },
  ];

  onLevelChange(level: WeatherLevel): void {
    this.levelService.setLevel(level);
    this.levelChanged.emit(level);
  }
}
