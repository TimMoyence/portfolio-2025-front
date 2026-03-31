import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from "@angular/core";
import type { WeatherLevel } from "../../../../core/models/weather.model";
import { WeatherLevelService } from "../../services/weather-level.service";

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
  selector: "app-level-selector",
  standalone: true,
  template: `
    <nav
      class="inline-flex rounded-xl border border-white/20 bg-white/10 p-1 backdrop-blur-md"
      role="tablist"
      [attr.aria-label]="ariaLabel"
    >
      @for (tab of levels; track tab.value) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="levelService.level() === tab.value"
          class="rounded-lg px-4 py-1.5 text-sm font-medium transition-all"
          [class]="
            levelService.level() === tab.value
              ? 'bg-white/25 text-white shadow-sm'
              : 'text-white/60 hover:text-white/80'
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
  readonly levelService = inject(WeatherLevelService);

  /** Emis lorsqu'un nouveau niveau est selectionne. */
  readonly levelChanged = output<WeatherLevel>();

  /** Label d'accessibilite pour la barre de navigation. */
  readonly ariaLabel = $localize`:weather.level.selector.aria|@@weatherLevelSelectorAria:Sélecteur de niveau météo`;

  /** Liste des niveaux disponibles avec leurs labels localises. */
  readonly levels: LevelTab[] = [
    {
      value: "discovery",
      label: $localize`:weather.level.discovery|@@weatherLevelDiscovery:Découverte`,
    },
    {
      value: "curious",
      label: $localize`:weather.level.curious|@@weatherLevelCurious:Curieux`,
    },
    {
      value: "expert",
      label: $localize`:weather.level.expert|@@weatherLevelExpert:Expert`,
    },
  ];

  /** Change le niveau via le service et emet l'evenement. */
  onLevelChange(level: WeatherLevel): void {
    this.levelService.setLevel(level);
    this.levelChanged.emit(level);
  }
}
