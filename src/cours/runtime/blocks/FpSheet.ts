import type { FeuilleEvaluee, NatureDeCellule, ValeurFormule } from '../../content/types';
import { dansUnDefileur } from '../core/defileur';
import {
  DESACTIVE,
  type EscapedHtml,
  escapeHtml,
  LECTURE_SEULE,
  safeHtml,
  VIDE,
} from '../core/html';
import { bornerEntre, entierBorne, estTexteNonVide } from '../core/valeurs';
import {
  type DemandeEnAttente,
  FpProductionEvaluee,
  type PlanEtaye,
  copierLEnonce,
  memesSaisies,
} from './production';
import type { EvaluationDeFeuille } from './retours';

export interface SheetPlanPublic extends PlanEtaye {
  readonly lignes: number;
  readonly colonnes: number;
  readonly cellules: Readonly<Record<string, string>>;
  readonly verrouillees: readonly string[];
  readonly lettres: readonly string[];
  readonly grille: readonly (readonly string[])[];
  readonly longueurMaxSaisie: number;
  readonly initiale: FeuilleEvaluee;
}

interface AttenduDeFeuille {
  readonly reference: string;
  readonly formuleReference: string;
  readonly valeur: ValeurFormule;
  readonly affichage: string;
}

type Foyer = 'cellule' | 'barre' | null;

type Contenus = Readonly<Record<string, string>>;

interface Recopie {
  readonly de: string;
  readonly vers: string;
}

const STYLE_CELLULE = 'fp-sheet__cellule';
const STYLE_ENTETE = 'fp-sheet__entete';
const PREFIXE_COLONNE = 'fp-sheet-col-';
const PREFIXE_LIGNE = 'fp-sheet-ligne-';
const SIGNE_ERREUR = '⚠';
const LIMITE_GRILLE = 40;
export const LIGNES_AVANT_RESSERREMENT = 10;
const TABLEAU_RESSERRE = safeHtml` fp-sheet__tableau--dense`;
const LARGEUR_MIN_DE_COLONNE_CH = 8;
const LARGEUR_MAX_DE_COLONNE_CH = 24;
const SANS_EVALUATION: FeuilleEvaluee = { saisies: {}, affichages: {}, natures: {}, formules: [] };

function natureDUneValeur(valeur: ValeurFormule): NatureDeCellule {
  switch (typeof valeur) {
    case 'number':
      return 'nombre';
    case 'boolean':
      return 'logique';
    default:
      return 'texte';
  }
}

function marqueDeNature(nature: NatureDeCellule | null): EscapedHtml {
  return nature === null ? VIDE : safeHtml`data-nature="${escapeHtml(nature)}"`;
}

function borner(brut: number): number {
  return entierBorne(brut, 0, LIMITE_GRILLE, 0);
}

function copierCellules(source: Contenus, grille: ReadonlySet<string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(source)
      .map(([nom, contenu]): [string, string] => [nom.toUpperCase(), String(contenu)])
      .filter(([nom]) => grille.has(nom)),
  );
}

function copierPlan(source: SheetPlanPublic): SheetPlanPublic {
  const grille = source.grille
    .slice(0, LIMITE_GRILLE)
    .map((rang) => rang.slice(0, LIMITE_GRILLE).map(String));
  return {
    ...copierLEnonce(source),
    lignes: borner(source.lignes),
    colonnes: borner(source.colonnes),
    cellules: copierCellules(source.cellules, new Set(grille.flat())),
    verrouillees: source.verrouillees.map((nom) => nom.toUpperCase()),
    lettres: source.lettres.slice(0, LIMITE_GRILLE).map(String),
    grille,
    longueurMaxSaisie: entierBorne(source.longueurMaxSaisie, 0, Number.MAX_SAFE_INTEGER, 0),
    initiale: source.initiale,
  };
}

export class FpSheet extends FpProductionEvaluee<
  SheetPlanPublic,
  AttenduDeFeuille,
  EvaluationDeFeuille,
  Recopie | null
> {
  protected readonly evenementDeSoumission = 'fp-sheet-submit';
  protected readonly evenementDEvaluation = 'fp-sheet-evaluation';
  protected readonly bloc = 'sheet';
  protected readonly lectureDuCorrige = {
    type: 'feuille',
    champs: {
      reference: 'string',
      formuleReference: 'string',
      valeur: 'valeur',
      affichage: 'string',
    },
  } as const;
  private contenus: Contenus = {};
  private selection = '';
  private foyer: Foyer = null;
  private evaluee: FeuilleEvaluee = SANS_EVALUATION;

  set plan(valeur: SheetPlanPublic | null) {
    this.poserLePlan(valeur, copierPlan);
  }

  get plan(): SheetPlanPublic | null {
    return this.interne;
  }

  protected recevoirLEvaluation(
    valeur: EvaluationDeFeuille,
    attente: DemandeEnAttente<Recopie | null>,
  ): void {
    this.evaluee = valeur.evaluee;
    const recopie = attente.complement;
    if (recopie === null) {
      return;
    }
    const recopiee = valeur.evaluee.saisies[recopie.vers] ?? '';
    this.contenus = { ...this.contenus, [recopie.vers]: recopiee };
    this.saisiesEvaluees = { ...attente.saisies, [recopie.vers]: recopiee };
    this.saisiesDemandees = this.saisiesEvaluees;
    if (this.selection === recopie.de) {
      this.selection = recopie.vers;
      this.foyer = 'cellule';
    }
    this.signalerLeBrouillon(this.saisiesDeLEtudiant());
  }

  protected validerApresEvaluation(): void {
    this.validerLaCellule();
  }

  protected reprendreLeBrouillon(brouillon: Readonly<Record<string, unknown>>): boolean {
    if (this.interne === null) {
      return false;
    }
    const reprises = Object.entries(brouillon).filter(
      (entree): entree is [string, string] =>
        typeof entree[1] === 'string' &&
        this.dansLaGrille(entree[0].toUpperCase()) &&
        !this.verrouillee(entree[0].toUpperCase()),
    );
    this.contenus = {
      ...this.contenus,
      ...Object.fromEntries(reprises.map(([nom, contenu]) => [nom.toUpperCase(), contenu])),
    };
    this.validerLaCellule();
    return true;
  }

  protected scene(plan: SheetPlanPublic): EscapedHtml {
    return safeHtml`
      <section class="fp-carte fp-scene fp-sheet__atelier">
        ${this.consignes(plan)}
        ${this.tableau(false)}
      </section>
    `;
  }

  protected atelier(plan: SheetPlanPublic): EscapedHtml {
    return safeHtml`
      <section class="fp-carte fp-scene fp-sheet__atelier">
        <p class="fp-sheet__consigne">${escapeHtml(this.texte('sheet-consigne'))}</p>
        ${this.consignes(plan)}
        ${this.barre()}
        ${this.tableau(true)}
        ${this.actionsDeProduction(this.boutonRecopier())}
        ${this.bilanErreurs()}
        ${this.suiviDeProduction({ justes: this.justes(), total: this.interneVerdict?.details.length ?? 0 }, this.correctionServie())}
      </section>
    `;
  }

  protected brancherLAtelier(racine: ShadowRoot): void {
    for (const champ of racine.querySelectorAll<HTMLInputElement>('[data-role="cellule"]')) {
      this.brancherCellule(champ);
    }
    this.brancherBarre(racine.querySelector<HTMLInputElement>('[data-testid="barre"]'));
    racine
      .querySelector<HTMLButtonElement>('[data-testid="recopier"]')
      ?.addEventListener('click', () => this.recopier());
  }

  protected relacherLaSaisie(): void {
    this.foyer = null;
  }

  protected effacerLaSaisie(): void {
    this.relacherLaSaisie();
    const plan = this.interne;
    this.contenus = { ...(plan?.cellules ?? {}) };
    this.selection = plan?.grille[0]?.[0] ?? '';
    this.evaluee = plan?.initiale ?? SANS_EVALUATION;
    this.repartirDe(this.contenus);
  }

  private modifiable(nom: string): boolean {
    return !this.verrouillee(nom) && this.celluleAccessible(nom);
  }

  private dansLaGrille(nom: string): boolean {
    return this.coordonnees(nom) !== null;
  }

  private recopieEnAttente(): boolean {
    return this.enAttente?.complement != null;
  }

  private boutonRecopier(): EscapedHtml {
    const bloque = this.verrouille() || this.recopieEnAttente();
    return safeHtml`<button type="button" class="fp-sheet__recopier" data-testid="recopier" ${bloque ? DESACTIVE : VIDE}>${escapeHtml(this.texte('sheet-recopier'))}</button>`;
  }

  private brancherBarre(barre: HTMLInputElement | null): void {
    if (barre === null) {
      return;
    }
    barre.disabled = !this.celluleAccessible(this.selection);
    barre.addEventListener('input', () => this.ecrire(this.selection, barre.value, 'barre'));
    if (this.foyer === 'barre' && this.celluleAccessible(this.selection)) {
      barre.focus();
      barre.setSelectionRange(barre.value.length, barre.value.length);
    }
  }

  private brancherCellule(champ: HTMLInputElement): void {
    const nom = champ.dataset['nom'] ?? this.selection;
    champ.addEventListener('input', () => this.ecrire(nom, champ.value, 'cellule'));
    champ.addEventListener('focus', () => this.selectionner(nom));
    champ.addEventListener('keydown', (evenement) => this.auClavier(evenement, nom));
    if (nom === this.selection && this.foyer === 'cellule' && this.celluleAccessible(nom)) {
      champ.focus();
      champ.setSelectionRange(champ.value.length, champ.value.length);
    }
  }

  private auClavier(evenement: KeyboardEvent, nom: string): void {
    if (evenement.key !== 'Enter') {
      return;
    }
    evenement.preventDefault();
    this.validerLaCellule();
    this.selection = this.dessous(nom);
    this.foyer = 'cellule';
    this.message = '';
    this.refresh();
  }

  private dessous(nom: string): string {
    const depart = this.coordonnees(nom);
    if (depart === null) {
      return nom;
    }
    return this.interne?.grille[depart.ligne + 1]?.[depart.colonne] ?? nom;
  }

  private coordonnees(nom: string): { ligne: number; colonne: number } | null {
    const grille = this.interne?.grille ?? [];
    const ligne = grille.findIndex((rang) => rang.includes(nom));
    return ligne < 0 ? null : { ligne, colonne: grille[ligne].indexOf(nom) };
  }

  private selectionner(nom: string): void {
    if (nom !== this.selection && this.celluleAccessible(nom)) {
      this.validerLaCellule();
      this.selection = nom;
      this.foyer = 'cellule';
      this.refresh();
    }
  }

  private verrouillee(nom: string): boolean {
    return this.interne?.verrouillees.includes(nom) === true;
  }

  private saisiesDeLEtudiant(): Record<string, string> {
    const initiales = this.interne?.cellules ?? {};
    return Object.fromEntries(
      Object.entries(this.contenus).filter(
        ([nom, contenu]) =>
          !this.verrouillee(nom) && estTexteNonVide(contenu) && contenu !== (initiales[nom] ?? ''),
      ),
    );
  }

  private ecrire(nom: string, contenu: string, source: Foyer): void {
    if (!this.modifiable(nom)) {
      return;
    }
    if (nom !== this.selection) {
      this.validerLaCellule();
    }
    const longueur = this.interne?.longueurMaxSaisie ?? 0;
    this.contenus = { ...this.contenus, [nom]: contenu.slice(0, longueur) };
    this.selection = nom;
    this.foyer = source;
    this.noterLaSaisie(nom, this.saisiesDeLEtudiant());
  }

  private validerLaCellule(): void {
    if (memesSaisies(this.contenus, this.saisiesDemandees)) {
      return;
    }
    if (this.recopieEnAttente()) {
      this.validationDifferee = true;
      return;
    }
    this.demanderPour(null);
  }

  private demanderPour(recopie: Recopie | null): void {
    this.demanderLEvaluation(this.contenus, recopie, {
      cellules: this.saisiesDeLEtudiant(),
      ...(recopie === null ? {} : { recopie: { de: recopie.de } }),
    });
  }

  private recopier(): void {
    if (this.recopieEnAttente()) {
      return;
    }
    const cible = this.dessous(this.selection);
    if (this.verrouille() || cible === this.selection || this.verrouillee(cible)) {
      this.message = this.texte('sheet-recopie-impossible');
      this.refresh();
      return;
    }
    this.message = '';
    this.demanderPour({ de: this.selection, vers: cible });
    this.refresh();
  }

  private brut(nom: string): string {
    return this.contenus[nom] ?? '';
  }

  private courante(nom: string): boolean {
    return this.brut(nom) === (this.saisiesEvaluees[nom] ?? '');
  }

  private natureServie(nom: string): NatureDeCellule | null {
    return this.courante(nom) ? (this.evaluee.natures[nom] ?? null) : null;
  }

  private porteUneFormule(nom: string): boolean {
    return this.courante(nom) && this.evaluee.formules.includes(nom);
  }

  private affichage(nom: string, interactif: boolean): string {
    const brut = this.brut(nom);
    if ((interactif && nom === this.selection) || !this.courante(nom)) {
      return brut;
    }
    return this.evaluee.affichages[nom] ?? brut;
  }

  private nature(nom: string, interactif: boolean): NatureDeCellule | null {
    if (!estTexteNonVide(this.brut(nom))) {
      return null;
    }
    const servie = this.natureServie(nom);
    if (interactif && nom === this.selection && (servie === null || this.porteUneFormule(nom))) {
      return 'texte';
    }
    return servie;
  }

  private cellulesEnErreur(): string[] {
    return (this.interne?.grille ?? []).flat().filter((nom) => this.natureServie(nom) === 'erreur');
  }

  private barre(): EscapedHtml {
    return safeHtml`
      <p class="fp-sheet__barre">
        <label class="fp-sheet__reference" for="fp-sheet-barre" data-testid="reference">${escapeHtml(this.selection)}</label>
        <input class="fp-sheet__saisie" id="fp-sheet-barre" data-testid="barre" type="text" autocomplete="off" spellcheck="false" maxlength="${this.interne?.longueurMaxSaisie ?? 0}" value="${escapeHtml(this.brut(this.selection))}">
      </p>
    `;
  }

  private tableau(interactif: boolean): EscapedHtml {
    const grille = this.interne?.grille ?? [];
    const largeurs = this.largeursDesColonnes();
    return safeHtml`
      ${dansUnDefileur(safeHtml`
        <table class="fp-sheet__tableau${grille.length > LIGNES_AVANT_RESSERREMENT ? TABLEAU_RESSERRE : VIDE}" data-testid="tableau">
          <caption class="fp-sheet__intitule">${escapeHtml(this.interne?.intitule ?? '')}</caption>
          <thead><tr>${this.coin()}${this.enteteColonnes()}</tr></thead>
          <tbody>${grille.map((rang, ligne) => this.ligne(rang, ligne, interactif, largeurs))}</tbody>
        </table>
      `)}
      ${grille.length === 0 ? this.grilleVide() : VIDE}
    `;
  }

  private grilleVide(): EscapedHtml {
    return safeHtml`<p class="fp-sheet__vide" data-testid="vide">${escapeHtml(this.texte('sheet-vide'))}</p>`;
  }

  private coin(): EscapedHtml {
    return safeHtml`<th class="${escapeHtml(STYLE_ENTETE)}" scope="col"><span class="fp-sheet__coin">${escapeHtml(this.texte('sheet-coin'))}</span></th>`;
  }

  private enteteColonnes(): EscapedHtml {
    return safeHtml`${(this.interne?.lettres ?? []).map(
      (lettre) =>
        safeHtml`<th class="${escapeHtml(STYLE_ENTETE)}" scope="col" id="${escapeHtml(PREFIXE_COLONNE + lettre)}" data-testid="colonne">${escapeHtml(lettre)}</th>`,
    )}`;
  }

  private ligne(
    rang: readonly string[],
    ligne: number,
    interactif: boolean,
    largeurs: readonly number[],
  ): EscapedHtml {
    return safeHtml`
      <tr class="fp-sheet__ligne" data-testid="ligne">
        <th class="fp-sheet__rang" scope="row" id="${escapeHtml(PREFIXE_LIGNE + (ligne + 1))}">${ligne + 1}</th>
        ${rang.map((nom, colonne) => this.cellule(nom, ligne, colonne, interactif, largeurs[colonne] ?? LARGEUR_MIN_DE_COLONNE_CH))}
      </tr>
    `;
  }

  private largeursDesColonnes(): number[] {
    const plan = this.interne;
    if (plan === null) {
      return [];
    }
    return plan.lettres.map((_, colonne) => {
      const libelles = plan.grille
        .map((rang) => rang[colonne] ?? '')
        .filter((nom) => !plan.initiale.formules.includes(nom))
        .map((nom) => plan.cellules[nom] ?? '');
      return bornerEntre(
        Math.max(...libelles.map((libelle) => [...libelle].length)),
        LARGEUR_MIN_DE_COLONNE_CH,
        LARGEUR_MAX_DE_COLONNE_CH,
      );
    });
  }

  private cellule(
    nom: string,
    ligne: number,
    colonne: number,
    interactif: boolean,
    largeur: number,
  ): EscapedHtml {
    const lettre = this.interne?.lettres[colonne] ?? '';
    const portes = `${PREFIXE_COLONNE}${lettre} ${PREFIXE_LIGNE}${ligne + 1}`;
    if (!interactif) {
      const nature = this.estUnIntituleDeColonne(ligne, nom)
        ? safeHtml` ${escapeHtml(STYLE_CELLULE)}--intitule`
        : VIDE;
      return safeHtml`<td class="${escapeHtml(STYLE_CELLULE)}${nature}" headers="${escapeHtml(portes)}" ${marqueDeNature(this.nature(nom, false))}>${this.lecture(nom)}</td>`;
    }
    return safeHtml`<td class="${escapeHtml(STYLE_CELLULE)} ${escapeHtml(STYLE_CELLULE)}--saisie" headers="${escapeHtml(portes)}" style="--fp-sheet-largeur: ${largeur}" ${this.etatDeLaCellule(nom)}>${this.champ(nom)}</td>`;
  }

  private estUnIntituleDeColonne(ligne: number, nom: string): boolean {
    return ligne === 0 && this.natureServie(nom) === 'texte' && !this.porteUneFormule(nom);
  }

  private etatDeLaCellule(nom: string): EscapedHtml {
    if (this.reprises.has(nom)) {
      return safeHtml`data-etat="reprise"`;
    }
    const detail = this.detailDe(nom);
    return detail === null
      ? VIDE
      : safeHtml`${this.etatDuDetail(detail)} data-testid="cellule-verdict"`;
  }

  private lecture(nom: string): EscapedHtml {
    const attendu = this.attendus.find((candidat) => candidat.reference === nom);
    if (attendu !== undefined && this.correction >= 1) {
      return safeHtml`<span class="fp-sheet__correction" data-testid="correction-feuille" data-nom="${escapeHtml(nom)}" ${marqueDeNature(natureDUneValeur(attendu.valeur))}><code>${escapeHtml(attendu.formuleReference)}</code>${this.valeurAttendue(attendu)}</span>`;
    }
    return safeHtml`<span data-testid="cellule" data-nom="${escapeHtml(nom)}">${escapeHtml(this.affichage(nom, false))}</span>`;
  }

  private valeurAttendue(attendu: AttenduDeFeuille): EscapedHtml {
    return this.correction >= 2
      ? safeHtml` <span class="fp-montant">${escapeHtml(attendu.affichage)}</span>`
      : VIDE;
  }

  private champ(nom: string): EscapedHtml {
    const alerte = `${SIGNE_ERREUR} ${this.texte('sheet-cellule-fautive')}`;
    const marque =
      this.natureServie(nom) === 'erreur'
        ? safeHtml`aria-invalid="true" data-erreur="${escapeHtml(this.evaluee.affichages[nom] ?? '')}" title="${escapeHtml(alerte)}"`
        : VIDE;
    const enonce = `${this.texte('sheet-cellule')} ${nom}`;
    const bloquee = !this.modifiable(nom);
    return safeHtml`<input class="fp-sheet__champ fp-montant" data-testid="cellule" data-role="cellule" data-nom="${escapeHtml(nom)}" type="text" autocomplete="off" spellcheck="false" maxlength="${this.interne?.longueurMaxSaisie ?? 0}" aria-label="${escapeHtml(enonce)}" value="${escapeHtml(this.affichage(nom, true))}" ${marqueDeNature(this.nature(nom, true))} ${marque} ${bloquee ? LECTURE_SEULE : VIDE}>`;
  }

  private bilanErreurs(): EscapedHtml {
    const fautives = this.cellulesEnErreur();
    if (fautives.length === 0) {
      return safeHtml`<p class="fp-sheet__bilan" aria-live="polite" data-testid="erreurs"></p>`;
    }
    return safeHtml`<p class="fp-sheet__bilan fp-sheet__bilan--fautif" aria-live="polite" data-testid="erreurs">${escapeHtml(SIGNE_ERREUR)} ${escapeHtml(this.texte('sheet-erreurs'))} ${escapeHtml(fautives.join(', '))}</p>`;
  }

  private correctionServie(): EscapedHtml {
    if (this.attendus.length === 0 || this.correction < 1) {
      return VIDE;
    }
    const lignes = this.attendus.map(
      (attendu) =>
        safeHtml`<li class="fp-sheet__attendu" data-testid="attendu" data-nom="${escapeHtml(attendu.reference)}"><strong>${escapeHtml(attendu.reference)}</strong> <code>${escapeHtml(attendu.formuleReference)}</code>${this.valeurAttendue(attendu)}</li>`,
    );
    return safeHtml`<ul class="fp-sheet__attendus" data-testid="attendus">${lignes}</ul>`;
  }

  protected valider(): void {
    const plan = this.planAValider();
    if (plan === null) {
      return;
    }
    const cellules = this.saisiesDeLEtudiant();
    if (Object.keys(cellules).length === 0) {
      this.refuserLEnvoi(this.texte('production-vide'));
      return;
    }
    this.conclure({ planId: plan.id, cellules });
  }
}
