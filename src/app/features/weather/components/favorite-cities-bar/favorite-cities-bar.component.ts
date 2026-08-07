import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  input,
  Output,
  output,
} from '@angular/core';
import type { CityResult, FavoriteCity } from '../../../../core/models/weather.model';

@Component({
  selector: 'app-favorite-cities-bar',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  template: `
    <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      @if (selectedCity()) {
        <button
          type="button"
          (click)="toggleFavorite()"
          class="flex-shrink-0 rounded-full border p-2 transition-colors"
          [ngClass]="
            darkMode()
              ? 'border-teal/15 bg-white/5 text-white/70 hover:border-teal/40 hover:text-white'
              : 'border-scheme-border bg-scheme-surface text-scheme-text-muted hover:bg-scheme-border'
          "
          [class.text-teal]="isCurrentFavorite()"
          [attr.aria-label]="isCurrentFavorite() ? removeFromFavoritesLabel : addToFavoritesLabel"
        >
          <svg
            class="h-4 w-4"
            [attr.fill]="isCurrentFavorite() ? 'currentColor' : 'none'"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </button>
      }

      @for (city of favorites(); track city.name; let i = $index) {
        <div class="flex-shrink-0 flex items-center gap-0.5">
          <button
            type="button"
            (click)="onCityClick(city)"
            class="rounded-l-full border border-r-0 px-3 py-1.5 text-sm font-medium transition-colors"
            [ngClass]="
              isSelected(city)
                ? darkMode()
                  ? 'border-teal bg-teal font-semibold text-[#06231f]'
                  : 'border-scheme-accent bg-scheme-accent/10 text-scheme-accent'
                : darkMode()
                  ? 'border-teal/15 bg-white/5 text-white/80 hover:border-teal/40 hover:text-white'
                  : 'border-scheme-border bg-scheme-surface text-scheme-text-muted hover:bg-scheme-border'
            "
          >
            {{ city.name }}
          </button>
          <button
            type="button"
            (click)="toggleDefault(i)"
            class="rounded-r-full border px-1.5 py-1.5 text-xs transition-colors"
            [ngClass]="
              darkMode()
                ? 'border-teal/15 bg-white/5 text-white/60 hover:border-teal/40 hover:text-white'
                : 'border-scheme-border bg-scheme-surface text-scheme-text-muted hover:bg-scheme-border'
            "
            [class.text-teal]="defaultCityIndex() === i"
            [attr.aria-label]="
              defaultCityIndex() === i ? defaultCityRemoveLabel : defaultCitySetLabel
            "
          >
            <svg
              class="h-3 w-3"
              [attr.fill]="defaultCityIndex() === i ? 'currentColor' : 'none'"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoriteCitiesBarComponent {
  readonly darkMode = input(true);

  readonly favorites = input<FavoriteCity[]>([]);

  readonly selectedCity = input<CityResult | null>(null);

  @Output() readonly favoriteSelected = new EventEmitter<CityResult>();

  @Output() readonly addFavorite = new EventEmitter<FavoriteCity>();

  @Output() readonly removeFavorite = new EventEmitter<FavoriteCity>();

  readonly defaultCityIndex = input<number | null>(null);

  readonly defaultCityChange = output<number | null>();

  readonly addToFavoritesLabel = $localize`:weather.favorites.add|@@weatherFavoritesAdd:Ajouter aux favoris`;
  readonly removeFromFavoritesLabel = $localize`:weather.favorites.remove|@@weatherFavoritesRemove:Retirer des favoris`;
  readonly defaultCitySetLabel = $localize`:weather.favorites.setDefault|@@weatherFavoritesSetDefault:Definir comme ville par defaut`;
  readonly defaultCityRemoveLabel = $localize`:weather.favorites.removeDefault|@@weatherFavoritesRemoveDefault:Retirer la ville par defaut`;

  readonly isCurrentFavorite = computed(() => {
    const city = this.selectedCity();
    if (!city) return false;
    return this.favorites().some(
      (f) => f.latitude === city.latitude && f.longitude === city.longitude,
    );
  });

  isSelected(city: FavoriteCity): boolean {
    const sel = this.selectedCity();
    return !!sel && sel.latitude === city.latitude && sel.longitude === city.longitude;
  }

  onCityClick(city: FavoriteCity): void {
    this.favoriteSelected.emit({
      id: -1,
      name: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
      country: city.country,
      country_code: '',
    });
  }

  toggleDefault(index: number): void {
    if (this.defaultCityIndex() === index) {
      this.defaultCityChange.emit(null);
    } else {
      this.defaultCityChange.emit(index);
    }
  }

  toggleFavorite(): void {
    const city = this.selectedCity();
    if (!city) return;

    const fav: FavoriteCity = {
      name: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
      country: city.country,
    };

    if (this.isCurrentFavorite()) {
      this.removeFavorite.emit(fav);
    } else {
      this.addFavorite.emit(fav);
    }
  }
}
