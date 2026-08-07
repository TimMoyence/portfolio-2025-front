import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import { animateValue } from '../../shared/utils/animate-value';
import {
  buildDeterministicHeatmap,
  buildRandomHeatmap,
  gaugeOffset,
} from '../../shared/demos/sebastian-gauge';
import {
  MOCK_BAC,
  MOCK_BADGES,
  MOCK_DAILY_COUNTS,
  MOCK_HEALTH_SCORE,
  MOCK_HEATMAP,
  MOCK_TRENDS,
} from './sebastian-presentation-data';

/**
 * Habitude cochable de la demo jouable Sebastian.
 * Cocher/decocher recalcule le score de sante en direct (calque du script
 * de la maquette `landing-sebastian.html`).
 */
interface DemoHabit {
  /** Identifiant technique. */
  readonly id: string;
  /** Libelle affiche (emoji inclus). */
  readonly label: string;
  /** Poids ajoute au score quand l'habitude est cochee. */
  readonly weight: number;
}

/**
 * Landing marketing de Sebastian (`/atelier/sebastian`).
 *
 * Compose la maquette `AsiliNewDesign/landing-sebastian.html` au format landing
 * Asili thème gold (`.lp-seb`) : hero split avec accroche + stats + CTA vers
 * l'app, une **demo jouable simulee** (jauge de score de sante animee + 4
 * habitudes cochables recalculant le score en direct + heatmap d'activite),
 * trois cartes features, une demo band et un CTA final.
 *
 * La demo est **autonome** : aucune dependance aux vraies apps (Lots 4/5). Les
 * donnees fictives de presentation (`sebastian-presentation-data.ts`) restent
 * exposees pour la coherence du contenu (score, BAC, badges, trends).
 *
 * Standalone, OnPush, SSR-safe : la jauge part de sa valeur cible en
 * SSR/prerender (etat lisible sans JS) puis s'anime de 0 en navigateur ; la
 * heatmap est deterministe cote serveur (pas de `Math.random`) et peut etre
 * regeneree en navigateur. Les revelations au scroll passent par `appReveal`
 * (fail-open). Destinee aux utilisateurs non authentifies (guard
 * `redirectIfAuthorizedGuard('sebastian')` sur la route).
 *
 * Tout le texte est fourni en `$localize` (source FR verbatim de la maquette,
 * IDs `@@sebastianLanding*`) ; la traduction EN vit dans les XLF.
 */
@Component({
  selector: 'app-sebastian-presentation',
  standalone: true,
  imports: [RouterModule, RevealOnScrollDirective],
  templateUrl: './sebastian-presentation.component.html',
  styleUrl: './sebastian-presentation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianPresentationComponent {
  private readonly platformId = inject(PLATFORM_ID);

  // --- Mock data de presentation (preservees) -------------------------------

  /** Score de sante fictif (78/100, phase 2). */
  readonly healthScore = MOCK_HEALTH_SCORE;

  /** Resultat BAC fictif (0.12 g/L). */
  readonly bac = MOCK_BAC;

  /** 10 badges, tous verrouilles. */
  readonly badges = MOCK_BADGES;

  /** Tendances sur 7 jours. */
  readonly trends = MOCK_TRENDS;

  /** Heatmap 28 jours (donnees de reference). */
  readonly heatmapData = MOCK_HEATMAP;

  /** Compteurs journaliers (cafe 2/4, alcool 1/3). */
  readonly dailyCounts = MOCK_DAILY_COUNTS;

  // --- Demo jouable : habitudes cochables + jauge animee --------------------

  /**
   * Quatre habitudes cochables (calque maquette). La somme des poids des
   * habitudes cochees forme le score de sante (plafonne a 100).
   */
  readonly habits: readonly DemoHabit[] = [
    {
      id: 'hydration',
      label: $localize`:@@sebastianLandingHabitHydration:💧 Hydratation`,
      weight: 22,
    },
    {
      id: 'sleep',
      label: $localize`:@@sebastianLandingHabitSleep:🌙 Sommeil 7h+`,
      weight: 18,
    },
    {
      id: 'moderation',
      label: $localize`:@@sebastianLandingHabitModeration:🚫 Pas d'excès`,
      weight: 32,
    },
    {
      id: 'activity',
      label: $localize`:@@sebastianLandingHabitActivity:🏃 Activité`,
      weight: 16,
    },
  ];

  /** Ensemble des identifiants d'habitudes actuellement cochees. */
  readonly checkedHabits = signal<ReadonlySet<string>>(
    new Set(['hydration', 'sleep', 'moderation']),
  );

  /** Score de sante cible derive des habitudes cochees (plafonne a 100). */
  readonly targetScore = computed(() => {
    const checked = this.checkedHabits();
    const sum = this.habits.reduce((acc, h) => (checked.has(h.id) ? acc + h.weight : acc), 0);
    return Math.min(100, sum);
  });

  /** Serie en cours : 12 jours si tout est coche, sinon decroit. */
  readonly streak = computed(() => {
    const missing = this.habits.length - this.checkedHabits().size;
    return Math.max(0, 12 - missing);
  });

  /**
   * Valeur courante de la jauge. En SSR/prerender elle reste a sa valeur cible
   * (etat lisible sans JS) ; en navigateur elle part de 0 puis s'anime via
   * `animateGauge()`, puis suit `targetScore` a chaque (de)cochage.
   */
  readonly gaugeValue = signal<number>(0);

  /** `stroke-dashoffset` de la jauge derive de `gaugeValue`. */
  readonly gaugeOffset = computed(() => gaugeOffset(this.gaugeValue()));

  /** Indique si la jauge a deja joue son animation d'apparition. */
  private hasAnimated = false;

  /**
   * Heatmap d'activite sur 56 jours (8 semaines × 7, niveaux 0–3).
   * En SSR la sequence est deterministe (pas de `Math.random`) pour un rendu
   * stable et hydratable ; en navigateur elle est regeneree, variee.
   */
  readonly heatmap = signal<number[]>(buildDeterministicHeatmap(56, 0.32));

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // La jauge part de 0 puis s'anime : effet « vivant » browser-only.
      this.animateGauge();
      // Regenere une heatmap variee (Math.random) uniquement cote client.
      this.heatmap.set(buildRandomHeatmap(56, 0.32));
    } else {
      // SSR : etat statique lisible a la valeur cible.
      this.gaugeValue.set(this.targetScore());
    }
  }

  /** Bascule l'etat coche/decoche d'une habitude et recale la jauge. */
  toggleHabit(id: string): void {
    const next = new Set(this.checkedHabits());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.checkedHabits.set(next);
    // Une fois l'apparition jouee, la jauge suit immediatement le score cible.
    if (this.hasAnimated || !isPlatformBrowser(this.platformId)) {
      this.gaugeValue.set(this.targetScore());
    }
  }

  /** Indique si une habitude est cochee (pour le template). */
  isChecked(id: string): boolean {
    return this.checkedHabits().has(id);
  }

  /**
   * Anime la jauge de 0 a `targetScore` via `requestAnimationFrame`.
   * Browser-only (gardee par le constructeur). SSR-safe : non appelee cote
   * serveur ou la jauge reste statique.
   */
  private animateGauge(): void {
    const target = this.targetScore();
    animateValue({
      from: 0,
      to: target,
      durationMs: 1500,
      onFrame: (v) => this.gaugeValue.set(Math.round(v)),
      onComplete: () => {
        this.hasAnimated = true;
      },
    });
  }
}
