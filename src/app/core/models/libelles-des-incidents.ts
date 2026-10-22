import type { TypeDIncident } from '../../../../contrat/types.gen';

export const LIBELLES_DES_INCIDENTS: Readonly<Record<TypeDIncident, string>> = {
  tab_hidden: $localize`:@@incidentOngletMasque:onglet masqué`,
  window_blur: $localize`:@@incidentFenetreQuittee:fenêtre quittée`,
  copy_attempt: $localize`:@@incidentTentativeDeCopier:tentative de copier`,
  paste_attempt: $localize`:@@incidentTentativeDeColler:tentative de coller`,
  context_menu: $localize`:@@incidentMenuContextuel:menu contextuel ouvert`,
  blocked_shortcut: $localize`:@@incidentRaccourciBloque:raccourci bloqué`,
  devtools_suspected: $localize`:@@incidentOutilsDeDeveloppement:outils de développement soupçonnés`,
  page_unload: $localize`:@@incidentPageQuittee:page quittée ou rechargée`,
  fast_answer: $localize`:@@incidentReponseTropRapide:réponse trop rapide`,
};
