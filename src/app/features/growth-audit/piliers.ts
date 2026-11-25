import type { PillarKey } from '../../core/models/audit-request.model';

interface Pilier {
  readonly nom: string;
  readonly description: string;
}

export const PILIERS: Readonly<Record<PillarKey, Pilier>> = {
  conversion: {
    nom: $localize`:@@auditPillarConversionTitle:Clarté et appels`,
    description: $localize`:@@auditPillarConversionDesc:Ce que vous faites, dit en une phrase ; le bouton qui fait appeler ; un contact sans effort ; l’affichage sur téléphone.`,
  },
  performance: {
    nom: $localize`:@@auditPillarPerformanceTitle:Vitesse`,
    description: $localize`:@@auditPillarPerformanceDesc:Le temps d’affichage de vos pages, le poids des images, la fluidité sur téléphone.`,
  },
  seo: {
    nom: $localize`:@@auditPillarSeoTitle:Être trouvé sur Google`,
    description: $localize`:@@auditPillarSeoDesc:Le titre de chaque page, ce que Google en lit, les pages qu’il connaît, votre présence près de chez vous.`,
  },
  trust: {
    nom: $localize`:@@auditPillarTrustTitle:Confiance`,
    description: $localize`:@@auditPillarTrustDesc:Avis clients, réalisations montrées, tout ce qui rassure avant d’appeler.`,
  },
  technical: {
    nom: $localize`:@@auditPillarTechTitle:Solidité du site`,
    description: $localize`:@@auditPillarTechDesc:L’outil qui fait tourner le site, la sécurité, les pages en erreur, la facilité d’entretien.`,
  },
  aiVisibility: {
    nom: $localize`:@@auditPillarAiVisibilityTitle:Visibilité dans les IA`,
    description: $localize`:@@auditPillarAiVisibilityDesc:Ce que les assistants IA comprennent de votre métier et répondent quand on les interroge.`,
  },
  citationWorthiness: {
    nom: $localize`:@@auditPillarCitationWorthinessTitle:Matière à citer`,
    description: $localize`:@@auditPillarCitationWorthinessDesc:Sources, preuves, questions fréquentes : ce que Google et les IA peuvent reprendre de vos pages.`,
  },
};

export const nomDuPilier = (cle: string): string =>
  Object.entries(PILIERS).find(([connue]) => connue === cle)?.[1].nom ?? cle;
