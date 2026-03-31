import { CommonModule, isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
  signal,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Subject, Subscription } from "rxjs";
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
} from "rxjs/operators";
import type { CityResult } from "../../../../core/models/weather.model";
import { WeatherService } from "../../../../core/services/weather.service";

/**
 * Composant de recherche de ville.
 * Affiche un champ de saisie avec autocompletion et emet la ville selectionnee.
 */
@Component({
  selector: "app-city-search",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative w-full max-w-md mx-auto" #searchContainer>
      <div class="relative">
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60"
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
          class="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-10 pr-4 text-white placeholder-white/50 backdrop-blur-md outline-none transition-colors focus:border-white/40 focus:bg-white/15"
          autocomplete="off"
          role="combobox"
          aria-controls="city-search-listbox"
          [attr.aria-expanded]="showDropdown()"
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
      </div>

      @if (showDropdown() && results().length > 0) {
        <ul
          class="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl"
          id="city-search-listbox"
          role="listbox"
        >
          @for (city of results(); track city.id) {
            <li
              role="option"
              [attr.aria-selected]="false"
              class="cursor-pointer px-4 py-3 text-white transition-colors hover:bg-white/20"
              (click)="selectCity(city)"
              (keydown.enter)="selectCity(city)"
              tabindex="0"
            >
              <span class="font-medium">{{ city.name }}</span>
              <span class="ml-1 text-sm text-white/60">
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
  /** Evenement emis lorsqu'une ville est selectionnee. */
  @Output() readonly citySelected = new EventEmitter<CityResult>();

  @ViewChild("searchContainer", { static: true }) searchContainer!: ElementRef;

  readonly query = signal("");
  readonly results = signal<CityResult[]>([]);
  readonly showDropdown = signal(false);

  private readonly weatherService = inject(WeatherService);
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

  /** Ferme le menu deroulant lors d'un clic exterieur. */
  @HostListener("document:click", ["$event"])
  onDocumentClick(event: Event): void {
    if (!this.searchContainer?.nativeElement?.contains(event.target)) {
      this.showDropdown.set(false);
    }
  }
}
