import { isPlatformBrowser } from "@angular/common";
import type {
  AfterViewInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from "@angular/core";
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  input,
  PLATFORM_ID,
  ViewChild,
} from "@angular/core";

/**
 * Carte radar meteorologique utilisant Leaflet + tuiles RainViewer.
 * Le chargement de Leaflet est differe cote navigateur (SSR-safe).
 * Inclut une legende des precipitations et des controles stylises.
 */
@Component({
  selector: "app-radar-map",
  standalone: true,
  styles: `
    :host {
      display: block;
    }
    .leaflet-container {
      border-radius: 0.75rem;
      font-family: inherit;
    }
    /* Controles de zoom stylises */
    :host ::ng-deep .leaflet-control-zoom a {
      background: rgba(0, 0, 0, 0.6) !important;
      color: white !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      backdrop-filter: blur(4px);
    }
    :host ::ng-deep .leaflet-control-zoom a:hover {
      background: rgba(0, 0, 0, 0.8) !important;
    }
    :host ::ng-deep .leaflet-control-attribution {
      background: rgba(0, 0, 0, 0.5) !important;
      color: rgba(255, 255, 255, 0.7) !important;
      font-size: 10px;
      border-radius: 4px 0 0 0;
    }
    :host ::ng-deep .leaflet-control-attribution a {
      color: rgba(255, 255, 255, 0.8) !important;
    }
  `,
  template: `
    <div
      class="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md"
    >
      <h3
        class="mb-3 text-sm font-medium text-white/90"
        i18n="weather.radar.title|@@weatherRadarTitle"
      >
        Carte radar
      </h3>
      <div class="relative">
        <div
          #mapContainer
          class="h-64 w-full overflow-hidden rounded-xl md:h-80"
          role="img"
          aria-label="Carte radar des précipitations"
        ></div>
        <!-- Legende des precipitations -->
        <div
          class="absolute bottom-3 left-3 z-[1000] rounded-lg border border-white/20 bg-black/60 px-3 py-2 backdrop-blur-sm"
        >
          <p
            class="mb-1.5 text-[10px] font-medium text-white/80"
            i18n="weather.radar.legend|@@weatherRadarLegend"
          >
            Précipitations
          </p>
          <div class="flex items-center gap-0.5" aria-hidden="true">
            <div class="h-2 w-4 rounded-l bg-blue-300/80"></div>
            <div class="h-2 w-4 bg-blue-500/80"></div>
            <div class="h-2 w-4 bg-green-400/80"></div>
            <div class="h-2 w-4 bg-yellow-400/80"></div>
            <div class="h-2 w-4 bg-orange-500/80"></div>
            <div class="h-2 w-4 rounded-r bg-red-500/80"></div>
          </div>
          <div class="mt-0.5 flex justify-between text-[9px] text-white/60">
            <span i18n="weather.radar.light|@@weatherRadarLight">Faible</span>
            <span i18n="weather.radar.heavy|@@weatherRadarHeavy">Fort</span>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  /** Latitude du centre de la carte. */
  readonly latitude = input(48.85);

  /** Longitude du centre de la carte. */
  readonly longitude = input(2.35);

  @ViewChild("mapContainer", { static: true })
  mapContainer!: ElementRef<HTMLElement>;

  private map: import("leaflet").Map | null = null;
  private radarLayer: import("leaflet").TileLayer | null = null;
  private leaflet: typeof import("leaflet") | null = null;

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    await this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;
    if (changes["latitude"] || changes["longitude"]) {
      this.map.setView([this.latitude(), this.longitude()], 8, {
        animate: true,
        duration: 0.5,
      });
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private async initMap(): Promise<void> {
    const L = await import("leaflet");
    this.leaflet = L;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [this.latitude(), this.longitude()],
      zoom: 8,
      zoomControl: true,
      attributionControl: true,
    });

    // Fond de carte CartoDB Dark (meilleure lisibilite pour le radar)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 18,
        subdomains: "abcd",
      },
    ).addTo(this.map);

    // Tuiles radar RainViewer
    await this.loadRadarLayer();
  }

  private async loadRadarLayer(): Promise<void> {
    if (!this.map || !this.leaflet) return;

    try {
      const resp = await fetch(
        "https://api.rainviewer.com/public/weather-maps.json",
      );
      const data = (await resp.json()) as {
        radar?: { past?: Array<{ path: string }> };
      };

      const frames = data.radar?.past;
      if (!frames?.length) return;

      const latest = frames[frames.length - 1];
      this.radarLayer = this.leaflet
        .tileLayer(
          `https://tilecache.rainviewer.com${latest.path}/256/{z}/{x}/{y}/2/1_1.png`,
          { opacity: 0.6, maxZoom: 18 },
        )
        .addTo(this.map);
    } catch {
      /* RainViewer indisponible : carte sans radar */
    }
  }
}
