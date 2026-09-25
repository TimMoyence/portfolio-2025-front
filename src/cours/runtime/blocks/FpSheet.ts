import {
  type Feuille,
  type ResultatFormule,
  decalerFormule,
  evaluerFeuille,
  formaterResultat,
  lettreColonne,
  nomCellule,
} from '../core/formula';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpProductionEtayee, type PlanEtaye, copierLEnonce } from './production';

export interface SheetPlanPublic extends PlanEtaye {
  readonly lignes: number;
  readonly colonnes: number;
  readonly cellules: Readonly<Record<string, string>>;
  readonly verrouillees: readonly string[];
}

interface AttenduDeFeuille {
  readonly reference: string;
  readonly formuleReference: string;
  readonly valeur: number;
}

type Foyer = 'cellule' | 'barre' | null;

interface EvaluationDeLaFeuille {
  readonly contenus: Readonly<Record<string, string>>;
  readonly resultats: ReadonlyMap<string, ResultatFormule>;
}

const CELLULE_INITIALE = 'A1';
const STYLE_CELLULE = 'fp-sheet__cellule';
const STYLE_ENTETE = 'fp-sheet__entete';
const PREFIXE_COLONNE = 'fp-sheet-col-';
const PREFIXE_LIGNE = 'fp-sheet-ligne-';
const VIDE = escapeHtml('');
const LECTURE_SEULE = safeHtml`readonly`;
const DESACTIVE = safeHtml`disabled`;
const SIGNE_ERREUR = '⚠';
const LIMITE_GRILLE = 40;
const LONGUEUR_MAX_CELLULE = 200;

function borner(brut: number): number {
  return Number.isFinite(brut) ? Math.min(LIMITE_GRILLE, Math.max(0, Math.trunc(brut))) : 0;
}

function nomsDeLaGrille(lignes: number, colonnes: number): ReadonlySet<string> {
  const noms = new Set<string>();
  for (let ligne = 0; ligne < lignes; ligne += 1) {
    for (let colonne = 0; colonne < colonnes; colonne += 1) {
      noms.add(nomCellule(ligne, colonne));
    }
  }
  return noms;
}

function copierCellules(
  source: Readonly<Record<string, string>>,
  grille: ReadonlySet<string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(source)
      .map(([nom, contenu]): [string, string] => [nom.toUpperCase(), String(contenu)])
      .filter(([nom]) => grille.has(nom)),
  );
}

function copierPlan(source: SheetPlanPublic): SheetPlanPublic {
  const lignes = borner(source.lignes);
  const colonnes = borner(source.colonnes);
  return {
    ...copierLEnonce(source),
    lignes,
    colonnes,
    cellules: copierCellules(source.cellules, nomsDeLaGrille(lignes, colonnes)),
    verrouillees: source.verrouillees.map((nom) => nom.toUpperCase()),
  };
}

export class FpSheet extends FpProductionEtayee<SheetPlanPublic, AttenduDeFeuille> {
  protected readonly evenementDeSoumission = 'fp-sheet-submit';
  protected readonly bloc = 'sheet';
  protected readonly lectureDuCorrige = {
    type: 'feuille',
    champs: { reference: 'string', formuleReference: 'string', valeur: 'number' },
  } as const;
  private contenus: Record<string, string> = {};
  private selection = CELLULE_INITIALE;
  private foyer: Foyer = null;
  private evaluation: EvaluationDeLaFeuille | null = null;

  set plan(valeur: SheetPlanPublic | null) {
    this.poserLePlan(valeur, copierPlan);
  }

  get plan(): SheetPlanPublic | null {
    return this.interne;
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
    this.contenus = { ...(this.interne?.cellules ?? {}) };
    this.selection = CELLULE_INITIALE;
  }

  private modifiable(nom: string): boolean {
    return !this.verrouillee(nom) && this.accessible(nom);
  }

  private accessible(nom: string): boolean {
    return !this.verrouille() || (this.correction === 0 && this.detailDe(nom)?.juste === false);
  }

  private dansLaGrille(nom: string): boolean {
    const plan = this.interne;
    if (plan === null) {
      return false;
    }
    for (let ligne = 0; ligne < plan.lignes; ligne += 1) {
      for (let colonne = 0; colonne < plan.colonnes; colonne += 1) {
        if (nomCellule(ligne, colonne) === nom) {
          return true;
        }
      }
    }
    return false;
  }

  private boutonRecopier(): EscapedHtml {
    return safeHtml`<button type="button" class="fp-sheet__recopier" data-testid="recopier" ${this.verrouille() ? DESACTIVE : VIDE}>${escapeHtml(this.texte('sheet-recopier'))}</button>`;
  }

  private brancherBarre(barre: HTMLInputElement | null): void {
    if (barre === null) {
      return;
    }
    barre.disabled = !this.accessible(this.selection);
    barre.addEventListener('input', () => this.ecrire(this.selection, barre.value, 'barre'));
    if (this.foyer === 'barre' && this.accessible(this.selection)) {
      barre.focus();
      barre.setSelectionRange(barre.value.length, barre.value.length);
    }
  }

  private brancherCellule(champ: HTMLInputElement): void {
    const nom = champ.dataset['nom'] ?? CELLULE_INITIALE;
    champ.addEventListener('input', () => this.ecrire(nom, champ.value, 'cellule'));
    champ.addEventListener('focus', () => this.selectionner(nom));
    champ.addEventListener('keydown', (evenement) => this.auClavier(evenement, nom));
    if (nom === this.selection && this.foyer === 'cellule' && this.accessible(nom)) {
      champ.focus();
      champ.setSelectionRange(champ.value.length, champ.value.length);
    }
  }

  private auClavier(evenement: KeyboardEvent, nom: string): void {
    if (evenement.key !== 'Enter') {
      return;
    }
    evenement.preventDefault();
    this.selection = this.dessous(nom);
    this.foyer = 'cellule';
    this.message = '';
    this.refresh();
  }

  private dessous(nom: string): string {
    const plan = this.interne;
    const depart = this.coordonnees(nom);
    if (plan === null || depart === null || depart.ligne + 1 >= plan.lignes) {
      return nom;
    }
    return nomCellule(depart.ligne + 1, depart.colonne);
  }

  private coordonnees(nom: string): { ligne: number; colonne: number } | null {
    for (let ligne = 0; ligne < (this.interne?.lignes ?? 0); ligne += 1) {
      for (let colonne = 0; colonne < (this.interne?.colonnes ?? 0); colonne += 1) {
        if (nomCellule(ligne, colonne) === nom) {
          return { ligne, colonne };
        }
      }
    }
    return null;
  }

  private selectionner(nom: string): void {
    if (nom !== this.selection && this.accessible(nom)) {
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
          !this.verrouillee(nom) && contenu.trim().length > 0 && contenu !== (initiales[nom] ?? ''),
      ),
    );
  }

  private ecrire(nom: string, contenu: string, source: Foyer): void {
    if (!this.modifiable(nom)) {
      return;
    }
    this.contenus = { ...this.contenus, [nom]: contenu.slice(0, LONGUEUR_MAX_CELLULE) };
    this.selection = nom;
    this.foyer = source;
    this.message = '';
    if (this.verrouille()) {
      this.reprises = new Set([...this.reprises, nom]);
    }
    this.signalerBrouillon(this.interne?.id ?? '', this.saisiesDeLEtudiant());
    this.refresh();
  }

  private recopier(): void {
    const cible = this.dessous(this.selection);
    if (this.verrouille() || cible === this.selection || this.verrouillee(cible)) {
      this.message = this.texte('sheet-recopie-impossible');
      this.refresh();
      return;
    }
    const decalee = decalerFormule(this.contenus[this.selection] ?? '', 1, 0);
    this.contenus = { ...this.contenus, [cible]: decalee };
    this.selection = cible;
    this.foyer = 'cellule';
    this.message = '';
    this.signalerBrouillon(this.interne?.id ?? '', this.saisiesDeLEtudiant());
    this.refresh();
  }

  private feuille(): Feuille {
    return {
      lignes: this.interne?.lignes ?? 0,
      colonnes: this.interne?.colonnes ?? 0,
      cellules: this.contenus,
    };
  }

  private resultat(nom: string): ResultatFormule {
    if (this.evaluation?.contenus !== this.contenus) {
      this.evaluation = { contenus: this.contenus, resultats: evaluerFeuille(this.feuille()) };
    }
    return this.evaluation.resultats.get(nom) ?? { valeur: null, erreur: null };
  }

  private brut(nom: string): string {
    return this.contenus[nom] ?? '';
  }

  private affichage(nom: string, interactif: boolean): string {
    const brut = this.brut(nom);
    if ((interactif && nom === this.selection) || !brut.trimStart().startsWith('=')) {
      return brut;
    }
    return formaterResultat(this.resultat(nom));
  }

  private cellulesEnErreur(): string[] {
    return Object.keys(this.contenus).filter(
      (nom) => this.brut(nom).trimStart().startsWith('=') && this.resultat(nom).erreur !== null,
    );
  }

  private barre(): EscapedHtml {
    return safeHtml`
      <p class="fp-sheet__barre">
        <label class="fp-sheet__reference" for="fp-sheet-barre" data-testid="reference">${escapeHtml(this.selection)}</label>
        <input class="fp-sheet__saisie" id="fp-sheet-barre" data-testid="barre" type="text" autocomplete="off" spellcheck="false" maxlength="${LONGUEUR_MAX_CELLULE}" value="${escapeHtml(this.brut(this.selection))}">
      </p>
    `;
  }

  private tableau(interactif: boolean): EscapedHtml {
    const lignes = [...Array(this.interne?.lignes ?? 0).keys()];
    return safeHtml`
      <table class="fp-sheet__tableau" data-testid="tableau">
        <caption class="fp-sheet__intitule">${escapeHtml(this.interne?.intitule ?? '')}</caption>
        <thead><tr>${this.coin()}${this.enteteColonnes()}</tr></thead>
        <tbody>${lignes.map((ligne) => this.ligne(ligne, interactif))}</tbody>
      </table>
      ${lignes.length === 0 ? this.grilleVide() : VIDE}
    `;
  }

  private grilleVide(): EscapedHtml {
    return safeHtml`<p class="fp-sheet__vide" data-testid="vide">${escapeHtml(this.texte('sheet-vide'))}</p>`;
  }

  private coin(): EscapedHtml {
    return safeHtml`<th class="${escapeHtml(STYLE_ENTETE)}" scope="col"><span class="fp-sheet__coin">${escapeHtml(this.texte('sheet-coin'))}</span></th>`;
  }

  private enteteColonnes(): EscapedHtml {
    const colonnes = [...Array(this.interne?.colonnes ?? 0).keys()];
    return safeHtml`${colonnes.map(
      (colonne) =>
        safeHtml`<th class="${escapeHtml(STYLE_ENTETE)}" scope="col" id="${escapeHtml(PREFIXE_COLONNE + lettreColonne(colonne))}" data-testid="colonne">${escapeHtml(lettreColonne(colonne))}</th>`,
    )}`;
  }

  private ligne(ligne: number, interactif: boolean): EscapedHtml {
    const colonnes = [...Array(this.interne?.colonnes ?? 0).keys()];
    return safeHtml`
      <tr class="fp-sheet__ligne" data-testid="ligne">
        <th class="fp-sheet__rang" scope="row" id="${escapeHtml(PREFIXE_LIGNE + (ligne + 1))}">${ligne + 1}</th>
        ${colonnes.map((colonne) => this.cellule(ligne, colonne, interactif))}
      </tr>
    `;
  }

  private cellule(ligne: number, colonne: number, interactif: boolean): EscapedHtml {
    const nom = nomCellule(ligne, colonne);
    const portes = `${PREFIXE_COLONNE}${lettreColonne(colonne)} ${PREFIXE_LIGNE}${ligne + 1}`;
    const contenu = interactif ? this.champ(nom) : this.lecture(nom);
    const etat = interactif ? this.etatDeLaCellule(nom) : VIDE;
    return safeHtml`<td class="${escapeHtml(STYLE_CELLULE)}" headers="${escapeHtml(portes)}" ${etat}>${contenu}</td>`;
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
      const valeur =
        this.correction >= 2
          ? safeHtml` <span class="fp-montant">${escapeHtml(formaterResultat({ valeur: attendu.valeur, erreur: null }))}</span>`
          : VIDE;
      return safeHtml`<span class="fp-sheet__correction" data-testid="correction-feuille" data-nom="${escapeHtml(nom)}"><code>${escapeHtml(attendu.formuleReference)}</code>${valeur}</span>`;
    }
    return safeHtml`<span data-testid="cellule" data-nom="${escapeHtml(nom)}">${escapeHtml(this.affichage(nom, false))}</span>`;
  }

  private champ(nom: string): EscapedHtml {
    const formule = this.brut(nom).trimStart().startsWith('=');
    const code = formule ? this.resultat(nom).erreur : null;
    const alerte = `${SIGNE_ERREUR} ${this.texte('sheet-cellule-fautive')}`;
    const marque =
      code === null
        ? VIDE
        : safeHtml`aria-invalid="true" data-erreur="${escapeHtml(code)}" title="${escapeHtml(alerte)}"`;
    const enonce = `${this.texte('sheet-cellule')} ${nom}`;
    const bloquee = !this.modifiable(nom);
    return safeHtml`<input class="fp-sheet__champ fp-montant" data-testid="cellule" data-role="cellule" data-nom="${escapeHtml(nom)}" type="text" autocomplete="off" spellcheck="false" maxlength="${LONGUEUR_MAX_CELLULE}" aria-label="${escapeHtml(enonce)}" value="${escapeHtml(this.affichage(nom, true))}" ${marque} ${bloquee ? LECTURE_SEULE : VIDE}>`;
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
    const valeur = (attendu: AttenduDeFeuille): EscapedHtml =>
      this.correction >= 2
        ? safeHtml` <span class="fp-montant">${escapeHtml(formaterResultat({ valeur: attendu.valeur, erreur: null }))}</span>`
        : VIDE;
    const lignes = this.attendus.map(
      (attendu) =>
        safeHtml`<li class="fp-sheet__attendu" data-testid="attendu" data-nom="${escapeHtml(attendu.reference)}"><strong>${escapeHtml(attendu.reference)}</strong> <code>${escapeHtml(attendu.formuleReference)}</code>${valeur(attendu)}</li>`,
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
