import { DecimalPipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import type { EnsembleData } from "../../../../core/models/weather.model";

/**
 * Carte de comparaison multi-modeles (ECMWF, GFS, ICON).
 * Affiche un tableau avec les metriques cles sur les 24 premieres heures.
 * Les divergences significatives (> 3 degres C) sont signalees en orange.
 */
@Component({
  selector: "app-model-comparison",
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div
      class="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md"
    >
      <h3
        class="mb-3 text-sm font-medium text-white/70"
        i18n="weather.modelComparison.title|@@weatherModelComparisonTitle"
      >
        Comparaison des modèles
      </h3>

      @if (ensemble(); as data) {
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-white">
            <thead>
              <tr class="border-b border-white/10">
                <th
                  class="px-3 py-2 text-left text-xs font-medium text-white/50"
                  i18n="
                    weather.modelComparison.metric|@@weatherModelComparisonMetric"
                >
                  Métrique
                </th>
                @for (col of columns(); track col.model) {
                  <th
                    class="px-3 py-2 text-center text-xs font-medium text-white/50"
                  >
                    {{ col.model }}
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              <!-- Temperature moyenne 24h -->
              <tr class="border-b border-white/5">
                <td
                  class="px-3 py-2 text-white/70"
                  i18n="
                    weather.modelComparison.avgTemp|@@weatherModelComparisonAvgTemp"
                >
                  Temp. moy. 24h
                </td>
                @for (col of columns(); track col.model) {
                  <td
                    class="px-3 py-2 text-center"
                    [class.text-orange-400]="tempDivergent()"
                    [class.text-white]="!tempDivergent()"
                  >
                    {{ col.avgTemp | number: "1.1-1" }}°C
                  </td>
                }
              </tr>
              <!-- Precipitations totales 24h -->
              <tr>
                <td
                  class="px-3 py-2 text-white/70"
                  i18n="
                    weather.modelComparison.totalPrecip|@@weatherModelComparisonTotalPrecip"
                >
                  Précip. totales 24h
                </td>
                @for (col of columns(); track col.model) {
                  <td class="px-3 py-2 text-center text-white">
                    {{ col.totalPrecip | number: "1.1-1" }} mm
                  </td>
                }
              </tr>
            </tbody>
          </table>
        </div>

        @if (tempDivergent()) {
          <p
            class="mt-2 text-xs text-orange-400"
            i18n="
              weather.modelComparison.divergence|@@weatherModelComparisonDivergence"
          >
            Les modèles divergent significativement (> 3 °C).
          </p>
        }
      } @else {
        <p
          class="text-sm text-white/40"
          i18n="
            weather.modelComparison.unavailable|@@weatherModelComparisonUnavailable"
        >
          Données indisponibles
        </p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelComparisonComponent {
  /** Donnees d'ensemble multi-modeles. */
  readonly ensemble = input<EnsembleData | null>(null);

  /** Colonnes du tableau avec metriques calculees par modele sur 24h. */
  readonly columns = computed(() => {
    const data = this.ensemble();
    if (!data) return [];

    return data.models.map((m) => {
      const temps = m.hourly.temperature_2m.slice(0, 24);
      const precips = m.hourly.precipitation.slice(0, 24);
      const avgTemp =
        temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0;
      const totalPrecip = precips.reduce((a, b) => a + b, 0);

      return {
        model: m.model,
        avgTemp,
        totalPrecip,
      };
    });
  });

  /** Indique si les temperatures moyennes divergent de plus de 3 degres entre modeles. */
  readonly tempDivergent = computed(() => {
    const cols = this.columns();
    if (cols.length < 2) return false;
    const temps = cols.map((c) => c.avgTemp);
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    return maxTemp - minTemp > 3;
  });
}
