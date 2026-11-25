import type { AsiliMethodStep } from '../sections';
import { OFFRE_DE_SITE, type OffreDeSite } from './prix-et-delai';

export interface PhaseDeLaMethode {
  readonly titre: string;
  readonly phrase: string;
  readonly livrable: string;
  readonly duree: string;
}

export interface EngagementInclus {
  readonly titre: string;
  readonly phrase: string;
}

export function phasesDeLaMethode(offre: OffreDeSite = OFFRE_DE_SITE): PhaseDeLaMethode[] {
  const { semainesMin: min, semainesMax: max } = offre;
  return [
    {
      titre: $localize`:Phase de la méthode@@methodeCadrerTitre:Cadrer`,
      phrase: $localize`:@@methodeCadrerPhrase:Vous fixez votre budget et votre date de mise en ligne : le contenu s’ajuste, jamais la date.`,
      livrable: $localize`:@@methodeCadrerLivrable:Le carnet de décisions`,
      duree: $localize`:@@methodeCadrerDuree:jours 1-2`,
    },
    {
      titre: $localize`:Phase de la méthode@@methodeEcrireTitre:Écrire`,
      phrase: $localize`:@@methodeEcrirePhrase:Vous validez des textes écrits avec vous, dans vos mots, et votre démo est en ligne avant la fin de la semaine.`,
      livrable: $localize`:@@methodeEcrireLivrable:Les textes de la version 1 et la démo en ligne`,
      duree: $localize`:@@methodeEcrireDuree:semaine 1`,
    },
    {
      titre: $localize`:Phase de la méthode@@methodeConstruireTitre:Construire`,
      phrase: $localize`:@@methodeConstruirePhrase:Chaque semaine, vous voyez la démo avancer lors d’un point de trente minutes.`,
      livrable: $localize`:@@methodeConstruireLivrable:La démo, mise à jour chaque semaine`,
      duree: $localize`:@@methodeConstruireDuree:semaines 2 à ${min}:min:`,
    },
    {
      titre: $localize`:Phase de la méthode@@methodeLancerTitre:Lancer`,
      phrase: $localize`:@@methodeLancerPhrase:Votre site passe le contrôle point par point, puis il est en ligne et vous savez le faire vivre.`,
      livrable: $localize`:@@methodeLancerLivrable:Le rapport de vérification, le site en ligne, la prise en main`,
      duree: $localize`:@@methodeLancerDuree:semaines ${min}:min: à ${max}:max:`,
    },
    {
      titre: $localize`:Phase de la méthode@@methodeElanTitre:Élan`,
      phrase: $localize`:@@methodeElanPhrase:Un mois après, on lit vos vraies visites et on améliore ce qui freine.`,
      livrable: $localize`:@@methodeElanLivrable:Le bilan et l’amélioration prioritaire`,
      duree: $localize`:@@methodeElanDuree:30 jours après`,
    },
  ];
}

export const etapesDeLaMethode = (): AsiliMethodStep[] =>
  phasesDeLaMethode().map(({ titre, phrase, livrable, duree }, rang) => ({
    num: String(rang + 1).padStart(2, '0'),
    title: titre,
    desc: phrase,
    livrable,
    duree,
  }));

export const ENGAGEMENTS_INCLUS: readonly EngagementInclus[] = [
  {
    titre: $localize`:@@inclusDemoTitre:Une démo dès la semaine 1`,
    phrase: $localize`:@@inclusDemoPhrase:Vous voyez votre site en ligne, sur un lien privé, avant la fin de la première semaine.`,
  },
  {
    titre: $localize`:@@inclusCarnetTitre:Un carnet de décisions`,
    phrase: $localize`:@@inclusCarnetPhrase:Chaque choix est noté avec ma recommandation, et vous le gardez.`,
  },
  {
    titre: $localize`:@@inclusRapportTitre:Un rapport de vérification`,
    phrase: $localize`:@@inclusRapportPhrase:Vitesse, affichage mobile et lisibilité par Google et les IA sont contrôlés avant la mise en ligne.`,
  },
  {
    titre: $localize`:@@inclusBilanTitre:Un bilan à 30 jours`,
    phrase: $localize`:@@inclusBilanPhrase:Un mois après, vos vraies visites disent quoi améliorer en premier, et je le fais.`,
  },
];
