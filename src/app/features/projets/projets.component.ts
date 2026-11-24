import { ChangeDetectionStrategy, Component } from '@angular/core';
import { nomCourtServi } from '../../core/seo/site-servi';
import {
  AsiliCtaBandComponent,
  type AsiliCtaAction,
  AsiliHeroComponent,
  AsiliMethodComponent,
  type AsiliMethodStep,
  type MorceauDeTitre,
  AsiliProjectsGridComponent,
} from '../../shared/sections';
import { carteDeRealisation, FAMILLES_DE_REALISATIONS, REALISATIONS } from './realisations.data';

@Component({
  selector: 'app-projets',
  standalone: true,
  imports: [
    AsiliHeroComponent,
    AsiliProjectsGridComponent,
    AsiliMethodComponent,
    AsiliCtaBandComponent,
  ],
  templateUrl: './projets.component.html',
  styleUrl: './projets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjetsComponent {
  protected readonly titre: readonly MorceauDeTitre[] = [
    {
      texte: $localize`:Titre des réalisations, première ligne@@projetsHeroTitreDebut:Des preuves,`,
    },
    {
      texte: $localize`:Titre des réalisations, avant l’accent@@projetsHeroTitreSuite:pas des `,
      aLaLigne: true,
    },
    {
      texte: $localize`:Titre des réalisations, en accent@@projetsHeroTitreAccent:promesses`,
      accent: true,
    },
    { texte: '.' },
  ];

  protected readonly heroKicker = $localize`:@@projetsHeroKicker:Réalisations`;

  protected readonly heroLead = $localize`:@@projetsHeroLead:Chaque projet part d'un besoin réel et finit par un outil qui tient dans le temps. Voici des réalisations web, métier et IA construites sur des situations concrètes.`;

  protected readonly familles = FAMILLES_DE_REALISATIONS.map((famille) => ({
    ...famille,
    cartes: REALISATIONS.filter((realisation) => realisation.famille === famille.id).map(
      (realisation) => carteDeRealisation(realisation),
    ),
  }));

  protected readonly methodKicker = $localize`:@@projetsMethodKicker:Le fil rouge`;

  protected readonly methodSteps: readonly AsiliMethodStep[] = [
    {
      num: '01',
      index: $localize`:@@projetsMethodStep1Index:— Clarifier`,
      title: $localize`:@@projetsMethodStep1Title:Comprendre`,
      desc: $localize`:@@projetsMethodStep1Desc:Cartographier le besoin réel avant tout.`,
    },
    {
      num: '02',
      index: $localize`:@@projetsMethodStep2Index:— Construire`,
      title: $localize`:@@projetsMethodStep2Title:Déployer`,
      desc: $localize`:@@projetsMethodStep2Desc:Des outils robustes, dimensionnés juste.`,
    },
    {
      num: '03',
      index: $localize`:@@projetsMethodStep3Index:— Tester`,
      title: $localize`:@@projetsMethodStep3Title:Éprouver`,
      desc: $localize`:@@projetsMethodStep3Desc:Confronter à l'usage, mesurer, ajuster.`,
    },
    {
      num: '04',
      index: $localize`:@@projetsMethodStep4Index:— Évoluer`,
      title: $localize`:@@projetsMethodStep4Title:Faire durer`,
      desc: $localize`:@@projetsMethodStep4Desc:L'outil grandit avec vous.`,
    },
  ];

  protected readonly ctaKicker = $localize`:@@projetsCtaKicker:Un projet en tête ?`;

  protected readonly ctaTitle = $localize`:@@projetsCtaTitle:Racontez-moi votre situation. On verra ce qui mérite d'être construit.`;

  protected readonly ctaActions: readonly AsiliCtaAction[] = [
    {
      libelle: $localize`:@@projetsCtaPrimary:Démarrer la conversation`,
      lien: '/contact',
      variante: 'principale',
    },
    {
      libelle: nomCourtServi('/growth-audit'),
      lien: '/growth-audit',
      variante: 'secondaire',
    },
  ];
}
