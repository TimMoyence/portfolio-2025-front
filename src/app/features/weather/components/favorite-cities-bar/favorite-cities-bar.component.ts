import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  input,
  Output,
} from "@angular/core";
import type {
  CityResult,
  FavoriteCity,
} from "../../../../core/models/weather.model";

/**
 * Barre horizontale de villes favorites.
 * Affiche les villes favorites sous forme de chips cliquables
 * et un bouton etoile pour ajouter/retirer la ville courante.
 */
@Component({
  selector: "app-favorite-cities-bar",
  standalone: true,
  imports: [CommonModule],
  host: { class: "block" },
  template: `
    <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <!-- Bouton etoile : ajouter/retirer la ville courante -->
      @if (selectedCity()) {
        <button
          type="button"
          (click)="toggleFavorite()"
          class="flex-shrink-0 rounded-lg border p-2 transition-colors"
          [ngClass]="
            darkMode()
              ? 'border-white/20 bg-white/10 text-white/70 hover:bg-white/20'
              : 'border-scheme-border bg-scheme-surface text-scheme-text-muted hover:bg-scheme-border'
          "
          [class.text-yellow-400]="isCurrentFavorite()"
          [attr.aria-label]="
            isCurrentFavorite() ? removeFromFavoritesLabel : addToFavoritesLabel
          "
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

      <!-- Chips des villes favorites -->
      @for (city of favorites(); track city.name) {
        <button
          type="button"
          (click)="onCityClick(city)"
          class="flex-shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors"
          [ngClass]="
            isSelected(city)
              ? darkMode()
                ? 'border-white/50 bg-white/20 text-white'
                : 'border-scheme-accent bg-scheme-accent/10 text-scheme-accent'
              : darkMode()
                ? 'border-white/20 bg-white/10 text-white/80 hover:bg-white/20'
                : 'border-scheme-border bg-scheme-surface text-scheme-text-muted hover:bg-scheme-border'
          "
        >
          {{ city.name }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoriteCitiesBarComponent {
  /** Mode sombre (fond gradient) ou clair (fond blanc). */
  readonly darkMode = input(true);

  /** Liste des villes favorites. */
  readonly favorites = input<FavoriteCity[]>([]);

  /** Ville actuellement selectionnee. */
  readonly selectedCity = input<CityResult | null>(null);

  /** Emet la ville selectionnee parmi les favoris. */
  @Output() readonly favoriteSelected = new EventEmitter<CityResult>();

  /** Emet l'ajout d'une ville aux favoris. */
  @Output() readonly addFavorite = new EventEmitter<FavoriteCity>();

  /** Emet la suppression d'une ville des favoris. */
  @Output() readonly removeFavorite = new EventEmitter<FavoriteCity>();

  readonly addToFavoritesLabel = $localize`:weather.favorites.add|@@weatherFavoritesAdd:Ajouter aux favoris`;
  readonly removeFromFavoritesLabel = $localize`:weather.favorites.remove|@@weatherFavoritesRemove:Retirer des favoris`;

  /** Verifie si la ville courante est deja en favori. */
  readonly isCurrentFavorite = computed(() => {
    const city = this.selectedCity();
    if (!city) return false;
    return this.favorites().some(
      (f) => f.latitude === city.latitude && f.longitude === city.longitude,
    );
  });

  /** Verifie si une ville favorite est la ville selectionnee. */
  isSelected(city: FavoriteCity): boolean {
    const sel = this.selectedCity();
    return (
      !!sel &&
      sel.latitude === city.latitude &&
      sel.longitude === city.longitude
    );
  }

  /** Selectionne une ville favorite pour charger ses previsions. */
  onCityClick(city: FavoriteCity): void {
    this.favoriteSelected.emit({
      id: -1,
      name: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
      country: city.country,
      country_code: "",
    });
  }

  /** Ajoute ou retire la ville courante des favoris. */
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
