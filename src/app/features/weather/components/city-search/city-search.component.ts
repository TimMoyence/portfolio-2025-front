import { CommonModule, isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  input,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
  signal,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { map, of, Subject, Subscription } from "rxjs";
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
} from "rxjs/operators";
import type { CityResult } from "../../../../core/models/weather.model";
import type { WeatherPort } from "../../../../core/ports/weather.port";
import { WEATHER_PORT } from "../../../../core/ports/weather.port";
import { GeolocationService } from "../../services/geolocation.service";

/**
 * Composant de recherche de ville.
 * Affiche un champ de saisie avec autocompletion et emet la ville selectionnee.
 */
@Component({
  selector: "app-city-search",
  standalone: true,
  imports: [CommonModule, FormsModule],
  host: { class: "block" },
  template: `
    <div class="relative w-full max-w-md mx-auto" #searchContainer>
      <div class="relative flex gap-2">
        <div class="relative flex-1">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
            [ngClass]="darkMode() ? 'text-white/60' : 'text-scheme-text-muted'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            [ngModel]="query()"
            (ngModelChange)="onQueryChange($event)"
            i18n-placeholder="
              weather.search.placeholder|@@weatherSearchPlaceholder"
            placeholder="Rechercher une ville..."
            class="w-full rounded-xl border py-3 pl-10 pr-4 outline-none transition-colors"
            [ngClass]="
              darkMode()
                ? 'border-white/20 bg-white/10 text-white placeholder-white/50 backdrop-blur-md focus-visible:border-white/40 focus-visible:bg-white/15'
                : 'border-scheme-border bg-scheme-surface text-scheme-text placeholder-scheme-text-muted focus-visible:border-scheme-accent'
            "
            autocomplete="off"
            role="combobox"
            aria-controls="city-search-listbox"
            [attr.aria-expanded]="showDropdown()"
            aria-haspopup="listbox"
            aria-autocomplete="list"
          />
        </div>
        <button
          type="button"
          class="flex-shrink-0 rounded-xl border p-3 transition-colors disabled:opacity-40"
          [ngClass]="
            darkMode()
              ? 'border-white/20 bg-white/10 text-white/70 backdrop-blur-md hover:bg-white/20 hover:text-white'
              : 'border-scheme-border bg-scheme-surface text-scheme-text-muted hover:bg-scheme-border hover:text-scheme-text'
          "
          (click)="locateMe()"
          [disabled]="locating()"
          i18n-aria-label="weather.geo.button|@@weatherGeoButton"
          [attr.aria-label]="'Me localiser'"
          i18n-title="weather.geo.button|@@weatherGeoButtonTitle"
          title="Me localiser"
        >
          @if (locating()) {
            <div
              class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
            ></div>
          } @else {
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"
              />
            </svg>
          }
        </button>
      </div>

      @if (geoError(); as error) {
        <p
          class="mt-2 text-center text-sm"
          [ngClass]="darkMode() ? 'text-red-300' : 'text-red-600'"
          role="alert"
        >
          {{ error }}
        </p>
      }

      @if (showDropdown() && results().length > 0) {
        <ul
          class="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border"
          [ngClass]="
            darkMode()
              ? 'border-white/20 bg-white/10 backdrop-blur-xl'
              : 'border-scheme-border bg-scheme-background shadow-lg'
          "
          id="city-search-listbox"
          role="listbox"
        >
          @for (city of results(); track city.id) {
            <li
              role="option"
              [attr.aria-selected]="false"
              class="cursor-pointer px-4 py-3 transition-colors"
              [ngClass]="
                darkMode()
                  ? 'text-white hover:bg-white/20'
                  : 'text-scheme-text hover:bg-scheme-surface'
              "
              (click)="selectCity(city)"
              (keydown.enter)="selectCity(city)"
              tabindex="0"
            >
              <span class="font-medium">{{ city.name }}</span>
              <span
                class="ml-1 text-sm"
                [ngClass]="
                  darkMode() ? 'text-white/60' : 'text-scheme-text-muted'
                "
              >
                @if (city.admin1) {
                  {{ city.admin1 }},
                }
                {{ city.country }}
              </span>
            </li>
          }
        </ul>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CitySearchComponent implements OnInit, OnDestroy {
  /** Mode sombre (fond gradient) ou clair (fond blanc). */
  readonly darkMode = input(true);

  /** Evenement emis lorsqu'une ville est selectionnee. */
  @Output() readonly citySelected = new EventEmitter<CityResult>();

  @ViewChild("searchContainer", { static: true }) searchContainer!: ElementRef;

  readonly query = signal("");
  readonly results = signal<CityResult[]>([]);
  readonly showDropdown = signal(false);
  readonly locating = signal(false);
  readonly geoError = signal<string | null>(null);

  private readonly weatherService: WeatherPort = inject(WEATHER_PORT);
  private readonly geolocationService = inject(GeolocationService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((term) => term.length >= 2),
        switchMap((term) => this.weatherService.searchCity(term)),
      )
      .subscribe({
        next: (response) => {
          this.results.set(response.results ?? []);
          this.showDropdown.set(true);
        },
        error: () => {
          this.results.set([]);
          this.showDropdown.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  /** Traite le changement de saisie dans le champ de recherche. */
  onQueryChange(value: string): void {
    this.query.set(value);
    if (value.length < 2) {
      this.results.set([]);
      this.showDropdown.set(false);
      return;
    }
    this.searchSubject.next(value);
  }

  /** Selectionne une ville et ferme le menu deroulant. */
  selectCity(city: CityResult): void {
    this.query.set(city.name);
    this.showDropdown.set(false);
    this.results.set([]);
    this.citySelected.emit(city);
  }

  /** Localise l'utilisateur via le navigateur et emet la ville. */
  locateMe(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.locating.set(true);
    this.geoError.set(null);
    this.geolocationService
      .locate()
      .pipe(
        switchMap((city) =>
          this.geolocationService
            .reverseGeocode(city.latitude, city.longitude)
            .pipe(
              map((name) => (name ? { ...city, name } : city)),
              catchError(() => of(city)),
            ),
        ),
      )
      .subscribe({
        next: (city) => {
          this.query.set(city.name);
          this.locating.set(false);
          this.citySelected.emit(city);
        },
        error: (err) => {
          this.locating.set(false);
          const code = err?.code;
          if (code === 1) {
            this.geoError.set(
              $localize`:weather.geo.denied|@@weatherGeoDenied:Géolocalisation refusée. Autorisez l'accès dans les paramètres du navigateur.`,
            );
          } else {
            this.geoError.set(
              $localize`:weather.geo.error|@@weatherGeoError:Impossible de vous localiser. Vérifiez vos paramètres.`,
            );
          }
        },
      });
  }

  /** Ferme le menu deroulant lors d'un clic exterieur. */
  @HostListener("document:click", ["$event"])
  onDocumentClick(event: Event): void {
    if (!this.searchContainer?.nativeElement?.contains(event.target)) {
      this.showDropdown.set(false);
    }
  }
}
