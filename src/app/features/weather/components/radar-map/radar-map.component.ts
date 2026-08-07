import { isPlatformBrowser } from '@angular/common';
import type { AfterViewInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Inject,
  inject,
  input,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RADAR_PORT } from '../../../../core/ports/radar.port';

@Component({
  selector: 'app-radar-map',
  standalone: true,
  styles: `
    :host {
      display: block;
    }
    .leaflet-container {
      border-radius: 0.75rem;
      font-family: inherit;
    }
    /* Controles de zoom stylises (border teal Asili) */
    :host ::ng-deep .leaflet-control-zoom a {
      background: rgba(0, 0, 0, 0.6) !important;
      color: white !important;
      border: 1px solid rgba(79, 179, 162, 0.25) !important;
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
    <div class="rounded-[20px] border border-teal/15 bg-white/5 p-4 backdrop-blur-xl">
      <h3
        class="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-white/55"
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
  readonly latitude = input(48.85);

  readonly longitude = input(2.35);

  @ViewChild('mapContainer', { static: false })
  mapContainer!: ElementRef<HTMLElement>;

  private map: import('leaflet').Map | null = null;
  private radarLayer: import('leaflet').TileLayer | null = null;
  private leaflet: typeof import('leaflet') | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private readonly radarPort = inject(RADAR_PORT);
  private readonly destroyRef = inject(DestroyRef);

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    await this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;
    if (changes['latitude'] || changes['longitude']) {
      this.map.setView([this.latitude(), this.longitude()], 8, {
        animate: true,
        duration: 0.5,
      });
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

  private async initMap(): Promise<void> {
    const leafletModule = await import('leaflet');
    const L = (
      'default' in leafletModule ? leafletModule.default : leafletModule
    ) as typeof import('leaflet');
    this.leaflet = L;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [this.latitude(), this.longitude()],
      zoom: 8,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 18,
      subdomains: 'abcd',
    }).addTo(this.map);

    this.loadRadarLayer();

    this.resizeObserver = new ResizeObserver(() => {
      this.map?.invalidateSize();
    });
    this.resizeObserver.observe(this.mapContainer.nativeElement);

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 600);
  }

  private loadRadarLayer(): void {
    this.radarPort
      .getLatestRadarTileUrlTemplate()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((urlTemplate) => {
        if (!urlTemplate || !this.map || !this.leaflet) return;
        this.radarLayer = this.leaflet
          .tileLayer(urlTemplate, { opacity: 0.6, maxZoom: 18 })
          .addTo(this.map);
      });
  }
}
