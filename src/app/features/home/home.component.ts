import { ChangeDetectionStrategy, Component, LOCALE_ID, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FiletDeSectionDirective } from '../../shared/directives/filet-de-section.directive';
import { ENTREES_DE_FORMATION } from '../../core/config/familles-de-formation';
import { faqDuSite } from '../../shared/offre/prix-et-delai';
import {
  AsiliCtaBandComponent,
  type AsiliCta,
  AsiliFaqComponent,
  AsiliHeroComponent,
  AsiliProjectsGridComponent,
  type AsiliProject,
  IllustrationDuHerosComponent,
  type MorceauDeTitre,
  PortraitComponent,
  SocleEtElanComponent,
} from '../../shared/sections';
import { carteDeRealisation, vitrineDeLAccueil } from '../projets/realisations.data';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    FiletDeSectionDirective,
    AsiliHeroComponent,
    IllustrationDuHerosComponent,
    PortraitComponent,
    SocleEtElanComponent,
    AsiliProjectsGridComponent,
    AsiliFaqComponent,
    AsiliCtaBandComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly titre: readonly MorceauDeTitre[] = [
    {
      texte: $localize`:Titre de l’accueil, avant l’accent@@homeHeroTitreDebut:Votre métier mérite mieux qu’une page `,
    },
    {
      texte: $localize`:Titre de l’accueil, en accent@@homeHeroTitreAccent:qu’on ne trouve pas`,
      accent: true,
    },
    { texte: '.' },
  ];

  protected readonly heroChip = $localize`:@@homeHeroKicker:Création de sites web · Bordeaux`;

  protected readonly heroLead = $localize`:@@homeHeroAccroche:Je crée le site des artisans, commerces et indépendants : clair à lire, facile à trouver, sur Google comme dans les réponses des IA, avant vos concurrents. Vous parlez de votre métier, je m’occupe du reste.`;

  protected readonly planKicker = $localize`:@@homePlanKicker:Le plan`;

  protected readonly projectsKicker = $localize`:@@homeProjectsKicker:Preuve de savoir-faire`;
  protected readonly projectsHeadLink = $localize`:@@homeProjectsHeadLink:Voir toutes les réalisations`;

  protected readonly projects: readonly AsiliProject[] =
    vitrineDeLAccueil().map(carteDeRealisation);

  protected readonly formations = ENTREES_DE_FORMATION;

  protected readonly faqKicker = $localize`:@@homeFaqKicker:Questions fréquentes`;
  protected readonly faqTitre = $localize`:@@homeFaqTitre:Vos questions, avant de vous lancer.`;
  protected readonly faq = faqDuSite(inject(LOCALE_ID));

  protected readonly appel: AsiliCta = {
    kicker: $localize`:@@homeAppelKicker:Votre site, maintenant`,
    title: $localize`:@@homeAppelTitre:Parlons de votre site.`,
    lead: $localize`:@@homeAppelTexte:Dites-moi en quelques lignes ce que vous faites et qui vous voulez toucher. Je vous réponds avec une proposition claire.`,
  };
}
