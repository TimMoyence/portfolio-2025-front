import { isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  PLATFORM_ID,
} from "@angular/core";
import type {
  EnsembleData,
  ForecastResponse,
} from "../../../../core/models/weather.model";

/**
 * Carte d'export des donnees meteo en CSV ou JSON.
 * Permet a l'utilisateur expert de telecharger les donnees brutes.
 * Compatible SSR : le telechargement utilise document.createElement('a')
 * protege par un guard isPlatformBrowser.
 */
@Component({
  selector: "app-data-export",
  standalone: true,
  template: `
    <div
      class="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md"
    >
      <h3
        class="mb-3 text-sm font-medium text-white/70"
        i18n="weather.dataExport.title|@@weatherDataExportTitle"
      >
        Export des données
      </h3>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          (click)="exportCsv()"
          i18n="weather.dataExport.csv|@@weatherDataExportCsv"
        >
          Exporter CSV
        </button>
        <button
          type="button"
          class="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          (click)="exportJson()"
          i18n="weather.dataExport.json|@@weatherDataExportJson"
        >
          Exporter JSON
        </button>
      </div>

      <!-- Placeholder radar -->
      <div
        class="mt-4 rounded-xl border border-dashed border-white/20 p-3 text-center"
      >
        <p
          class="text-xs text-white/40"
          i18n="
            weather.dataExport.radarPlaceholder|@@weatherDataExportRadarPlaceholder"
        >
          Carte radar — bientôt disponible
        </p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataExportComponent {
  /** Previsions meteo standards a exporter. */
  readonly forecast = input<ForecastResponse | null>(null);

  /** Donnees d'ensemble multi-modeles a exporter. */
  readonly ensemble = input<EnsembleData | null>(null);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Exporte les donnees horaires de prevision au format CSV. */
  exportCsv(): void {
    if (!this.isBrowser) return;

    const data = this.forecast();
    if (!data) return;

    const headers = [
      "time",
      "temperature_2m",
      "precipitation",
      "wind_speed_10m",
    ];
    const rows = data.hourly.time.map((t, i) =>
      [
        t,
        data.hourly.temperature_2m[i],
        data.hourly.precipitation[i],
        data.hourly.wind_speed_10m[i],
      ].join(","),
    );

    const csv = [headers.join(","), ...rows].join("\n");
    this.downloadFile(csv, "meteo-export.csv", "text/csv");
  }

  /** Exporte les donnees brutes (previsions + ensemble) au format JSON. */
  exportJson(): void {
    if (!this.isBrowser) return;

    const payload = {
      forecast: this.forecast(),
      ensemble: this.ensemble(),
    };

    const json = JSON.stringify(payload, null, 2);
    this.downloadFile(json, "meteo-export.json", "application/json");
  }

  /** Declenche le telechargement d'un fichier via un lien <a> temporaire. */
  private downloadFile(content: string, filename: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
