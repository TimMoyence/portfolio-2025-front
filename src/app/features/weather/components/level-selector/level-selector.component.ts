import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import type { WeatherLevel } from '../../../../core/models/weather.model';
import { WeatherLevelService } from '../../services/weather-level.service';

/** Definition d'un onglet de niveau pour le selecteur. */
interface LevelTab {
  value: WeatherLevel;
  label: string;
}

/**
 * Selecteur de niveau d'experience meteo.
 * Affiche trois onglets (Decouverte, Curieux, Expert) sous forme de pilules
 * en glassmorphism. Emet le changement de niveau.
 */
@Component({
  selector: 'app-level-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!--
      Sélecteur de niveau — re-skin Asili AsiliNewDesign/asili-app.css :
      .unit-toggle (segment pill, bordure subtile) + onglet actif .on
      (fond teal sur foncé, libellé font-mono). Restyle visuel uniquement —
      WeatherLevelService, (levelChanged), role=tablist/aria-selected/
      aria-label inchangés.
    -->
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
  /** Mode sombre (fond gradient) ou clair (fond blanc). */
  readonly darkMode = input(true);

  readonly levelService = inject(WeatherLevelService);

  /** Emis lorsqu'un nouveau niveau est selectionne. */
  readonly levelChanged = output<WeatherLevel>();

  /** Label d'accessibilite pour la barre de navigation. */
  readonly ariaLabel = $localize`:weather.level.selector.aria|@@weatherLevelSelectorAria:Sélecteur de niveau météo`;

  /** Liste des niveaux disponibles avec leurs labels localises. */
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

  /** Change le niveau via le service et emet l'evenement. */
  onLevelChange(level: WeatherLevel): void {
    this.levelService.setLevel(level);
    this.levelChanged.emit(level);
  }
}
