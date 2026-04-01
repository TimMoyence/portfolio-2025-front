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
 */
@Component({
  selector: "app-radar-map",
  standalone: true,
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
      <div
        #mapContainer
        class="h-64 w-full rounded-xl overflow-hidden md:h-80"
      ></div>
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
      this.map.setView([this.latitude(), this.longitude()], 8);
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

    // Fond de carte OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(this.map);

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
