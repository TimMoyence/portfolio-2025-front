import { isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  PLATFORM_ID,
  signal,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { SlideInDirective } from "../../shared/directives/slide-in.directive";
import { SebastianBadgeCardComponent } from "./components/sebastian-badge-card.component";
import {
  getHeatmapLevel,
  HEATMAP_DAY_LABELS,
  MOCK_BAC,
  MOCK_BADGES,
  MOCK_DAILY_COUNTS,
  MOCK_HEATMAP,
  MOCK_HEALTH_SCORE,
  MOCK_TRENDS,
  TREND_DAY_LABELS,
} from "./sebastian-presentation-data";

/** Perimetre du cercle SVG (r=45, 2*PI*45 ~ 283). */
const GAUGE_PERIMETER = 283;

/**
 * Page de presentation immersive de Sebastian.
 * Affiche des donnees fictives realistes dans un design dark lounge
 * avec jauge animee, apercu du dashboard, badges et heatmap.
 * Destinee aux utilisateurs non authentifies.
 */
@Component({
  selector: "app-sebastian-presentation",
  standalone: true,
  imports: [RouterModule, SlideInDirective, SebastianBadgeCardComponent],
  templateUrl: "./sebastian-presentation.component.html",
  styleUrl: "./sebastian-presentation.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianPresentationComponent {
  private readonly platformId = inject(PLATFORM_ID);

  /** Score de sante fictif (78/100, phase 2). */
  readonly healthScore = MOCK_HEALTH_SCORE;

  /** Resultat BAC fictif (0.12 g/L). */
  readonly bac = MOCK_BAC;

  /** 10 badges, tous verrouilles. */
  readonly badges = MOCK_BADGES;

  /** Tendances sur 7 jours. */
  readonly trends = MOCK_TRENDS;

  /** Heatmap 28 jours. */
  readonly heatmap = MOCK_HEATMAP;

  /** Compteurs journaliers (cafe 2/4, alcool 1/3). */
  readonly dailyCounts = MOCK_DAILY_COUNTS;

  /** Labels des jours pour la heatmap. */
  readonly heatmapDayLabels = HEATMAP_DAY_LABELS;

  /** Labels des jours pour le trend chart. */
  readonly trendDayLabels = TREND_DAY_LABELS;

  /** Valeur courante de la jauge, animee de 0 a 78. */
  readonly gaugeValue = signal(0);

  /** Offset stroke-dashoffset calcule depuis la valeur de la jauge. */
  readonly gaugeOffset = computed(
    () => GAUGE_PERIMETER - (this.gaugeValue() / 100) * GAUGE_PERIMETER,
  );

  /** Pourcentage de remplissage de la barre cafe. */
  readonly coffeePercent = computed(
    () =>
      Math.round(
        (this.dailyCounts.coffee.current / this.dailyCounts.coffee.goal) * 100,
      ) + "%",
  );

  /** Pourcentage de remplissage de la barre alcool. */
  readonly alcoholPercent = computed(
    () =>
      Math.round(
        (this.dailyCounts.alcohol.current / this.dailyCounts.alcohol.goal) *
          100,
      ) + "%",
  );

  /** Calcule le niveau d'intensite heatmap (0-4). */
  getHeatmapLevel = getHeatmapLevel;

  /**
   * Callback declenche quand la section hero entre dans le viewport.
   * Anime la jauge de 0 a 78 via requestAnimationFrame (SSR-safe).
   */
  onGaugeVisible(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.gaugeValue() > 0) return;

    const target = this.healthScore.score;
    const duration = 1500;
    const start = performance.now();

    const animate = (now: number): void => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      this.gaugeValue.set(Math.round(eased * target));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }
}
