import { isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  PLATFORM_ID,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { SlideInDirective } from "../../shared/directives/slide-in.directive";
import { BudgetSummaryCardComponent } from "../common-budget-tm/components/budget-summary-card/budget-summary-card.component";
import {
  MOCK_ACTIVE_MONTH,
  MOCK_CATEGORIES,
  MOCK_CATEGORY_TOTALS,
  MOCK_CONIC_GRADIENT,
  MOCK_CONTRIBUTIONS,
  MOCK_DONUT_SEGMENTS,
  MOCK_FEATURES,
  MOCK_MONTHS,
  MOCK_SUMMARY,
  MOCK_TIMELINE,
} from "./budget-presentation-data";

/**
 * Page de presentation immersive de l'application budget.
 * Affiche des donnees fictives realistes dans un design warm/nature
 * avec donut chart CSS, barres de contributions et composants summary reels.
 * Destinee aux utilisateurs non authentifies.
 */
@Component({
  selector: "app-budget-presentation",
  standalone: true,
  imports: [RouterModule, SlideInDirective, BudgetSummaryCardComponent],
  templateUrl: "./budget-presentation.component.html",
  styleUrl: "./budget-presentation.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetPresentationComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  /** Categories de budget fictives (8). */
  readonly categories = MOCK_CATEGORIES;

  /** Totaux par categorie pour le donut et le tableau. */
  readonly categoryTotals = MOCK_CATEGORY_TOTALS;

  /** Metriques de synthese (depenses, revenus, contributions). */
  readonly summary = MOCK_SUMMARY;

  /** Contributions Tim / Maria. */
  readonly contributions = MOCK_CONTRIBUTIONS;

  /** Liste des mois en pilules. */
  readonly months = MOCK_MONTHS;

  /** Mois actif. */
  readonly activeMonth = MOCK_ACTIVE_MONTH;

  /** Segments du donut pre-calcules. */
  readonly donutSegments = MOCK_DONUT_SEGMENTS;

  /** Conic-gradient CSS pour le donut. */
  readonly conicGradient = MOCK_CONIC_GRADIENT;

  /** Fonctionnalites marketing. */
  readonly features = MOCK_FEATURES;

  /** Etapes de la timeline "Comment ca marche". */
  readonly timeline = MOCK_TIMELINE;

  /** Offset parallaxe du hero (en pixels). */
  parallaxOffset = 0;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    let ticking = false;

    const onScroll = (): void => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.parallaxOffset = Math.min(Math.round(window.scrollY * 0.12), 60);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    this.destroyRef.onDestroy(() => {
      window.removeEventListener("scroll", onScroll);
    });
  }
}
