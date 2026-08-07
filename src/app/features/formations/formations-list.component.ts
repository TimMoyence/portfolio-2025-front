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

@Component({
  selector: 'app-formations-list',
  standalone: true,
  imports: [RouterLink, RevealOnScrollDirective, AsiliHeroComponent, AsiliCtaBandComponent],
  templateUrl: './formations-list.component.html',
  styleUrl: './formations-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormationsListComponent {
  protected readonly heroKicker = $localize`:@@formationsHeroKicker:Formations · gratuites`;

  protected readonly heroLead = $localize`:@@formationsHeroLead:Trois formations, toutes gratuites, au format slides interactives — avec quiz et sondages. Consultables en ligne ou projetables en présentation. Des réponses actionnables, pas un cours universitaire. Sans inscription : votre email sert seulement à recevoir le toolkit PDF.`;

  protected readonly formations: readonly FormationCard[] = FORMATIONS;

  protected readonly formatKicker = $localize`:@@formationsFormatKicker:Le format`;

  protected readonly benefits: readonly FormationBenefit[] = FORMATION_BENEFITS;

  protected readonly ctaKicker = $localize`:@@formationsCtaKicker:Tout est gratuit`;

  protected readonly ctaTitle = $localize`:@@formationsCtaTitle:Choisissez une formation et lancez les slides.`;

  protected readonly ctaLead = $localize`:@@formationsCtaLead:Aucune inscription. Votre email n'est demandé que si vous voulez le toolkit PDF.`;

  protected readonly ctaPrimary = $localize`:@@formationsCtaPrimary:Commencer par l'IA`;

  protected readonly ctaSecondary = $localize`:@@formationsCtaSecondary:Poser une question`;
}
