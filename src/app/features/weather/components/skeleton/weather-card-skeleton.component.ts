import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Skeleton loader pour les cartes metriques weather.
 * Affiche une animation de pulsation glassmorphism pendant le chargement.
 */
@Component({
  selector: 'app-weather-card-skeleton',
  standalone: true,
  host: { class: 'block' },
  template: `
    <!--
      Skeleton carte instrument — re-skin Asili : glass .gp/.wx-card (rayon
      --r-lg 20px, border teal subtile, backdrop-blur). Pulse conservé.
    -->
    <div
      class="animate-pulse rounded-[20px] border border-teal/15 bg-white/5 p-4 backdrop-blur-xl"
      [class.p-3]="compact()"
    >
      <!-- Titre -->
      <div class="mb-3 h-4 w-24 rounded bg-white/15"></div>
      <!-- Valeur principale -->
      <div class="h-8 w-16 rounded bg-white/10"></div>
      <!-- Sous-texte -->
      <div class="mt-2 h-3 w-32 rounded bg-white/[0.06]"></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherCardSkeletonComponent {
  /** Mode compact pour mobile. */
  readonly compact = input(false);
}
