export interface OffreDeSite {
  readonly prixPlancherHt: number;
  readonly semainesMin: number;
  readonly semainesMax: number;
}

export interface QuestionDeFaq {
  readonly question: string;
  readonly reponse: string;
}

export const OFFRE_DE_SITE: OffreDeSite = { prixPlancherHt: 1500, semainesMin: 3, semainesMax: 4 };

export function prixPlancher(locale: string, offre: OffreDeSite = OFFRE_DE_SITE): string {
  const montant = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(offre.prixPlancherHt);
  return $localize`:Prix plancher d'un site@@offrePrixPlancher:à partir de ${montant}:montant: HT`;
}

export function delaiDeMiseEnLigne(offre: OffreDeSite = OFFRE_DE_SITE): string {
  const { semainesMin: min, semainesMax: max } = offre;
  return $localize`:Délai de mise en ligne d'un site@@offreDelaiDeMiseEnLigne:en ligne en ${min}:min: à ${max}:max: semaines`;
}

export function faqDuSite(locale: string, offre: OffreDeSite = OFFRE_DE_SITE): QuestionDeFaq[] {
  const prix = prixPlancher(locale, offre);
  const delai = delaiDeMiseEnLigne(offre);
  return [
    {
      question: $localize`:@@faqDuSitePrixQuestion:Combien coûte un site ?`,
      reponse: $localize`:@@faqDuSitePrixReponse:Comptez ${prix}:prix: pour un site clair, rapide et trouvable. Le devis précis suit un premier échange sur votre besoin, sans engagement.`,
    },
    {
      question: $localize`:@@faqDuSiteDelaiQuestion:En combien de temps mon site est-il en ligne ?`,
      reponse: $localize`:@@faqDuSiteDelaiReponse:Votre site est ${delai}:delai:, du premier échange à la mise en ligne. La date est fixée dès le départ : c’est le contenu qui s’ajuste, et j’écris les textes avec vous.`,
    },
    {
      question: $localize`:@@faqDuSiteApresQuestion:Et après la mise en ligne ?`,
      reponse: $localize`:@@faqDuSiteApresReponse:Je reste à vos côtés : corrections, petites évolutions et suivi de votre visibilité sur Google et dans les réponses des IA. Une formation courte vous apprend à faire vivre le site vous-même.`,
    },
  ];
}
