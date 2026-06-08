/**
 * Modeles de donnees du composant partage `ToolkitGatePageComponent`.
 *
 * Les pages gate (capture email) des formations partagent un scaffold
 * identique (carte centree, items inclus, formulaire de capture, contenu
 * editorial). Seuls le texte, le `formationSlug` et les IDs i18n different :
 * chaque page shell fournit donc ses chaines **deja localisees** (`$localize`)
 * via ces structures, a la maniere de `formations-list.data.ts`.
 */

/** Un item « inclus » de la carte gate (puce a coche). */
export interface ToolkitGateItem {
  /** Libelle localise de l'item. */
  label: string;
}

/** Une question/reponse de la FAQ editoriale (signaux SEO/AEO). */
export interface ToolkitGateFaq {
  /** Question (rendue en `<h3>`). */
  question: string;
  /** Reponse (rendue en `<p>`). */
  answer: string;
}

/**
 * Donnees completes d'une page gate toolkit, fournies par la page shell.
 *
 * Le titre n'est PAS dans ce modele : il porte un accent typographique
 * (`<em>`) propre a chaque maquette et passe par projection de contenu
 * (`<ng-container title>`), ce qui preserve le markup verbatim et l'`i18n`
 * exact de chaque page.
 */
export interface ToolkitGatePageData {
  /** Accroche sous le titre (`.lead`). */
  lead: string;
  /** Trois items « inclus » affiches sous l'accroche. */
  items: readonly ToolkitGateItem[];
  /** Mention de pied de carte (gratuit, RGPD…). */
  foot: string;
  /** Titre de la section editoriale « ce que contient le toolkit ». */
  contentsTitle: string;
  /** Puces de la section « ce que contient » (signaux anti thin-content). */
  contents: readonly string[];
  /** Titre de la section FAQ. */
  faqTitle: string;
  /** Questions/reponses de la FAQ. */
  faq: readonly ToolkitGateFaq[];
  /** Mention de marque (« Asili Design — asilidesign.fr »). */
  brand: string;
  /** Libelle du lien « Politique de confidentialite ». */
  privacyLabel: string;
}
