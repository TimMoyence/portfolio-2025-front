import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import { AsiliCtaBandComponent, AsiliHeroComponent } from '../../shared/sections';
import {
  FORMATION_BENEFITS,
  FORMATIONS,
  type FormationBenefit,
  type FormationCard,
} from './formations-list.data';

/**
 * Page liste `/formations` — refonte Asili (Lot 3e).
 *
 * Compose la maquette `AsiliNewDesign/formations.html` : hero `app-asili-hero`
 * (kicker « Formations · gratuites », titre « Du concret, en *format diapo*. »)
 * → grille de quatre cartes (trois formations gratuites menant aux slide-decks
 * existants + une carte bonus « toolkit » vers la capture email) → section « le
 * format diapo » (trois bénéfices) → bande `app-asili-cta-band`.
 *
 * Les slide-decks (`/formations/<slug>`) sont HORS périmètre : la page n'y
 * touche pas, elle ne fait que les référencer. Les formations sont **gratuites**
 * (wording maquette) ; le modèle de données réserve déjà de quoi accueillir un
 * palier premium plus tard.
 *
 * Tout le texte est fourni en `$localize` (source FR verbatim de la maquette,
 * IDs `@@formations-list.*` / `@@formationsList*`) ; la traduction EN vit dans
 * les XLF. Le fond constellation est global (Lot 0, `<app-asili-background>`) :
 * la page ne recrée aucun canvas. Routes et `seoKey` inchangés.
 */
@Component({
  selector: 'app-formations-list',
  standalone: true,
  imports: [RouterLink, RevealOnScrollDirective, AsiliHeroComponent, AsiliCtaBandComponent],
  templateUrl: './formations-list.component.html',
  styleUrl: './formations-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormationsListComponent {
  /** Sur-titre mono du hero. */
  protected readonly heroKicker = $localize`:@@formationsHeroKicker:Formations · gratuites`;

  /** Accroche du hero. */
  protected readonly heroLead = $localize`:@@formationsHeroLead:Trois formations, toutes gratuites, au format slides interactives — avec quiz et sondages. Consultables en ligne ou projetables en présentation. Des réponses actionnables, pas un cours universitaire. Sans inscription : votre email sert seulement à recevoir le toolkit PDF.`;

  /** Cartes de la grille des formations. */
  protected readonly formations: readonly FormationCard[] = FORMATIONS;

  /** Sur-titre mono de la section « le format diapo ». */
  protected readonly formatKicker = $localize`:@@formationsFormatKicker:Le format`;

  /** Bénéfices de la section « le format diapo ». */
  protected readonly benefits: readonly FormationBenefit[] = FORMATION_BENEFITS;

  /** Sur-titre de la bande CTA. */
  protected readonly ctaKicker = $localize`:@@formationsCtaKicker:Tout est gratuit`;

  /** Titre de la bande CTA. */
  protected readonly ctaTitle = $localize`:@@formationsCtaTitle:Choisissez une formation et lancez les slides.`;

  /** Accroche de la bande CTA. */
  protected readonly ctaLead = $localize`:@@formationsCtaLead:Aucune inscription. Votre email n'est demandé que si vous voulez le toolkit PDF.`;

  /** CTA primaire de la bande. */
  protected readonly ctaPrimary = $localize`:@@formationsCtaPrimary:Commencer par l'IA`;

  /** CTA secondaire de la bande. */
  protected readonly ctaSecondary = $localize`:@@formationsCtaSecondary:Poser une question`;
}
