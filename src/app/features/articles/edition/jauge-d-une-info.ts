import type { ItemDeSection } from '../../../core/models/article.model';

export const PUBLICS_D_UNE_INFO: Record<NonNullable<ItemDeSection['audience']>, string> = {
  tous: $localize`:@@articlesPublicTous:Tous`,
  dirigeants: $localize`:@@articlesPublicDirigeants:Dirigeants`,
  developpeurs: $localize`:@@articlesPublicDeveloppeurs:Développeurs`,
};

export const HORIZONS_D_UNE_INFO: Record<NonNullable<ItemDeSection['horizon']>, string> = {
  aujourdhui: $localize`:@@articlesHorizonAujourdhui:Aujourd’hui`,
  trimestre: $localize`:@@articlesHorizonTrimestre:Ce trimestre`,
  a_surveiller: $localize`:@@articlesHorizonASurveiller:À surveiller`,
};
