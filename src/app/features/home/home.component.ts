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
  AsiliMethodComponent,
  type AsiliMethodStep,
  AsiliProjectsGridComponent,
  type AsiliProject,
  LARGEUR_DU_CONTENEUR,
  type MorceauDeTitre,
  PLEINE_LARGEUR_SUR_TABLETTE,
} from '../../shared/sections';
import {
  carteDeRealisation,
  REALISATIONS,
  variantesDeLaCapture,
  vitrineDeLAccueil,
} from '../projets/realisations.data';
import { realisationDuHeros } from './realisation-du-heros';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    FiletDeSectionDirective,
    AsiliHeroComponent,
    AsiliMethodComponent,
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

  protected readonly siteDuHeros = realisationDuHeros(REALISATIONS);

  protected readonly variantesDuHeros = this.siteDuHeros && variantesDeLaCapture(this.siteDuHeros);

  protected readonly largeurDuVisuel = `${PLEINE_LARGEUR_SUR_TABLETTE}, calc((${LARGEUR_DU_CONTENEUR} - 32px) * 0.425)`;

  protected readonly planKicker = $localize`:@@homePlanKicker:Le plan`;

  protected readonly planSteps: readonly AsiliMethodStep[] = [
    {
      num: '01',
      index: $localize`:@@homePlanEtape1Index:— Écouter`,
      title: $localize`:@@homePlanEtape1Titre:On se parle`,
      desc: $localize`:@@homePlanEtape1Texte:Vous me racontez votre métier, vos clients et ce qui vous fait gagner du travail. Une heure suffit.`,
    },
    {
      num: '02',
      index: $localize`:@@homePlanEtape2Index:— Écrire`,
      title: $localize`:@@homePlanEtape2Titre:Je raconte et je construis`,
      desc: $localize`:@@homePlanEtape2Texte:J’écris des pages qui parlent comme vous, puis je construis un site rapide que Google et les IA comprennent.`,
    },
    {
      num: '03',
      index: $localize`:@@homePlanEtape3Index:— Lancer`,
      title: $localize`:@@homePlanEtape3Titre:Vous êtes en ligne, et autonome`,
      desc: $localize`:@@homePlanEtape3Texte:Le site est en ligne, et je vous montre comment le faire vivre sans dépendre de moi.`,
    },
  ];

  protected readonly projectsKicker = $localize`:@@homeProjectsKicker:Preuve de savoir-faire`;
  protected readonly projectsHeadLink = $localize`:@@homeProjectsHeadLink:Voir toutes les réalisations`;

  protected readonly projects: readonly AsiliProject[] = vitrineDeLAccueil().map((realisation) =>
    carteDeRealisation(realisation, 'small'),
  );

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
