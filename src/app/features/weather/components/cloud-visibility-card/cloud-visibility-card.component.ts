import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { LearningTooltipComponent } from "../learning-tooltip/learning-tooltip.component";

/**
 * Carte de couverture nuageuse et visibilite.
 * Utilise les icones PNG du projet selon le niveau de couverture.
 */
@Component({
  selector: "app-cloud-visibility-card",
  standalone: true,
  imports: [CommonModule, LearningTooltipComponent],
  template: `
    <div
      class="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md"
    >
      <div class="mb-3 flex items-center justify-between">
        <h3
          class="text-sm font-medium text-white/70"
          i18n="weather.cloud.title|@@weatherCloudTitle"
        >
          Couverture nuageuse
        </h3>
        <app-learning-tooltip
          id="cloud-cover"
          i18n-title="weather.cloud.tooltip.title|@@weatherCloudTooltipTitle"
          title="Couverture nuageuse"
          i18n-content="
            weather.cloud.tooltip.content|@@weatherCloudTooltipContent"
          content="La couverture nuageuse indique le pourcentage du ciel masqué par les nuages. La visibilité mesure la distance maximale à laquelle on distingue un objet : elle diminue avec le brouillard, la pluie ou les particules en suspension."
        />
      </div>

      <div class="flex items-center gap-4">
        <img [src]="cloudIcon()" alt="" class="h-12 w-12 drop-shadow-md" />

        <div class="flex flex-col gap-1">
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-light text-white">
              {{ cloudCover() }}%
            </span>
            <span class="text-sm text-white/50">
              {{ cloudLabel() }}
            </span>
          </div>

          @if (visibility() !== null) {
            <span class="text-sm text-white/50">
              <span i18n="weather.cloud.visibility|@@weatherCloudVisibility"
                >Visibilité</span
              >
              : {{ visibilityKm() }} km
            </span>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudVisibilityCardComponent {
  /** Pourcentage de couverture nuageuse (0-100). */
  readonly cloudCover = input<number>(0);

  /** Visibilite en metres. */
  readonly visibility = input<number | null>(null);

  /** Icone PNG appropriee selon le niveau de couverture nuageuse. */
  readonly cloudIcon = computed(() => {
    const cover = this.cloudCover();
    const base = "/assets/images/meteo/";
    if (cover <= 20) return base + "soleil.png";
    if (cover <= 70) return base + "soleil-et-nuage.png";
    return base + "nuage.png";
  });

  /** Label descriptif de la couverture nuageuse en francais. */
  readonly cloudLabel = computed(() => {
    const cover = this.cloudCover();
    if (cover <= 10)
      return $localize`:weather.cloud.clear|@@weatherCloudClear:Dégagé`;
    if (cover <= 30)
      return $localize`:weather.cloud.fewClouds|@@weatherCloudFewClouds:Peu nuageux`;
    if (cover <= 70)
      return $localize`:weather.cloud.partlyCloudy|@@weatherCloudPartlyCloudy:Partiellement nuageux`;
    if (cover <= 90)
      return $localize`:weather.cloud.mostlyCloudy|@@weatherCloudMostlyCloudy:Très nuageux`;
    return $localize`:weather.cloud.overcast|@@weatherCloudOvercast:Couvert`;
  });

  /** Visibilite convertie en kilometres (arrondie a 1 decimale). */
  readonly visibilityKm = computed(() => {
    const v = this.visibility();
    if (v === null) return 0;
    return Math.round(v / 100) / 10;
  });
}
