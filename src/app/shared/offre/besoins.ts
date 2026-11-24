import { nomCourtServi } from '../../core/seo/site-servi';

export const BESOINS = [
  { id: 'creer', libelle: nomCourtServi('/offer') },
  { id: 'refaire', libelle: $localize`:Besoin du contact@@besoinRefaire:Refaire mon site` },
  { id: 'app-mobile', libelle: $localize`:Besoin du contact@@besoinAppMobile:Une app mobile` },
  { id: 'sur-mesure', libelle: $localize`:Besoin du contact@@besoinSurMesure:Un outil sur mesure` },
  { id: 'former', libelle: $localize`:Besoin du contact@@besoinFormer:Former mon équipe` },
  { id: 'cours', libelle: $localize`:Besoin du contact@@besoinCours:Un cours BTS / Bachelor` },
] as const;

export type BesoinDeContact = (typeof BESOINS)[number]['id'];
