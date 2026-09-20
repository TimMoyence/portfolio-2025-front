import type { MetadonneesBrique } from '../../content/types';
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
import { FpBlock } from './FpBlock';
import { projeterMetadonnees } from './projection';
import {
  estObjet,
  estVerdictDeProduction,
  type DetailDeVerdict,
  type VerdictDeProduction,
} from './retours';

export interface SheetPlanPublic {
  readonly id: string;
  readonly intitule: string;
  readonly lignes: number;
  readonly colonnes: number;
  readonly cellules: Readonly<Record<string, string>>;
  readonly verrouillees: readonly string[];
  readonly consignes?: readonly string[];
  readonly metadonnees: MetadonneesBrique;
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
const SIGNE_ERREUR = '⚠';
const LIMITE_GRILLE = 40;
const LONGUEUR_MAX_CELLULE = 200;

function borner(brut: number): number {
  return Number.isFinite(brut) ? Math.min(LIMITE_GRILLE, Math.max(0, Math.trunc(brut))) : 0;
}

function ligneDeConsigne(consigne: string): EscapedHtml {
  return safeHtml`<li>${escapeHtml(consigne)}</li>`;
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
    id: source.id,
    intitule: source.intitule,
    lignes,
    colonnes,
    cellules: copierCellules(source.cellules, nomsDeLaGrille(lignes, colonnes)),
    verrouillees: source.verrouillees.map((nom) => nom.toUpperCase()),
    consignes: (source.consignes ?? []).filter((consigne) => typeof consigne === 'string'),
    metadonnees: projeterMetadonnees(source.metadonnees),
  };
}

function lireAttendus(valeur: unknown): readonly AttenduDeFeuille[] {
  if (!estObjet(valeur) || valeur['type'] !== 'feuille' || !Array.isArray(valeur['attendus'])) {
    return [];
  }
  return valeur['attendus'].filter(
    (attendu): attendu is AttenduDeFeuille =>
      estObjet(attendu) &&
      typeof attendu['reference'] === 'string' &&
      typeof attendu['formuleReference'] === 'string' &&
      typeof attendu['valeur'] === 'number',
  );
}

export class FpSheet extends FpBlock {
  private interne: SheetPlanPublic | null = null;
  private contenus: Record<string, string> = {};
  private selection = CELLULE_INITIALE;
  private foyer: Foyer = null;
  private message = '';
  private soumis = false;
  private interneVerdict: VerdictDeProduction | null = null;
  private attendus: readonly AttenduDeFeuille[] = [];
  private evaluation: EvaluationDeLaFeuille | null = null;

  set plan(valeur: SheetPlanPublic | null) {
    const change = (valeur?.id ?? null) !== (this.interne?.id ?? null);
    this.interne = valeur === null ? null : copierPlan(valeur);
    if (change) {
      this.contenus = { ...(this.interne?.cellules ?? {}) };
      this.selection = CELLULE_INITIALE;
      this.foyer = null;
      this.message = '';
      this.soumis = false;
      this.interneVerdict = null;
    }
    this.refreshSiConnecte();
  }

  get plan(): SheetPlanPublic | null {
    return this.interne;
  }

  set verdict(valeur: VerdictDeProduction | null) {
    this.interneVerdict =
      estVerdictDeProduction(valeur) && valeur.questionId === this.interne?.id ? valeur : null;
    this.refreshSiConnecte();
  }

  get verdict(): VerdictDeProduction | null {
    return this.interneVerdict;
  }

  set corrige(valeur: unknown) {
    this.attendus = lireAttendus(valeur);
    this.refreshSiConnecte();
  }

  set brouillon(valeur: unknown) {
    const plan = this.interne;
    if (plan === null || !estObjet(valeur) || this.soumis) {
      return;
    }
    const reprises = Object.entries(valeur).filter(
      (entree): entree is [string, string] =>
        typeof entree[1] === 'string' &&
        this.dansLaGrille(entree[0].toUpperCase()) &&
        !this.verrouillee(entree[0].toUpperCase()),
    );
    this.contenus = {
      ...this.contenus,
      ...Object.fromEntries(reprises.map(([nom, contenu]) => [nom.toUpperCase(), contenu])),
    };
    this.noterBrouillonRepris();
    this.refreshSiConnecte();
  }

  renderHand(): EscapedHtml {
    const plan = this.interne;
    if (plan === null) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    const verrouille = this.verrouille();
    return safeHtml`
      <section class="fp-carte fp-sheet__atelier">
        <p class="fp-sheet__consigne">${escapeHtml(this.texte('sheet-consigne'))}</p>
        ${this.consignes(plan)}
        ${this.barre()}
        ${this.tableau(true)}
        <div class="fp-sheet__actions">
          <button type="button" class="fp-sheet__recopier" data-testid="recopier">${escapeHtml(this.texte('sheet-recopier'))}</button>
          <button type="button" class="fp-sheet__valider" data-testid="valider">${escapeHtml(this.texte('valider'))}</button>
          ${this.boutonNeSaitPas(verrouille)}
        </div>
        ${this.bilanErreurs()}
        <p class="fp-sheet__retour" aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
        ${this.verdictDeProduction(this.interneVerdict, 'sheet-verdict', this.justes(), this.interneVerdict?.details.length ?? 0)}
        ${this.annonces()}
      </section>
    `;
  }

  renderStage(): EscapedHtml {
    if (this.interne === null) {
      return safeHtml``;
    }
    return safeHtml`<section class="fp-scene fp-sheet__atelier">${this.tableau(false)}</section>`;
  }

  renderBoard(): EscapedHtml {
    const plan = this.interne;
    if (plan === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    return safeHtml`
      <section class="fp-carte fp-sheet__atelier">
        <p class="fp-enonce">${escapeHtml(plan.intitule)}</p>
        ${this.consignes(plan)}
        <div class="fp-sheet__reperes">${this.reperes(plan.metadonnees)}</div>
        ${this.roleActuel() === 'presentateur' ? this.attendusFormateur() : VIDE}
      </section>
    `;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.interne?.id ?? null);
    if (this.mode() !== 'hand') {
      return;
    }
    for (const champ of racine.querySelectorAll<HTMLInputElement>('[data-role="cellule"]')) {
      this.brancherCellule(champ);
    }
    this.brancherBarre(racine.querySelector<HTMLInputElement>('[data-testid="barre"]'));
    this.brancherBouton(racine, 'recopier', () => this.recopier());
    this.brancherBouton(racine, 'valider', () => this.valider());
    this.brancherBouton(racine, 'je-ne-sais-pas', () => this.neSaitPas());
  }

  private verrouille(): boolean {
    return this.verrouilleApresEnvoi(this.soumis, this.interneVerdict !== null);
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

  private consignes(plan: SheetPlanPublic): EscapedHtml {
    const consignes = plan.consignes ?? [];
    if (consignes.length === 0) {
      return VIDE;
    }
    return safeHtml`<ol class="fp-sheet__consignes" data-testid="consignes">${consignes.map(ligneDeConsigne)}</ol>`;
  }

  private brancherBouton(racine: ShadowRoot, nom: string, action: () => void): void {
    const bouton = racine.querySelector<HTMLButtonElement>(`[data-testid="${nom}"]`);
    if (bouton !== null) {
      bouton.disabled = this.verrouille();
      bouton.addEventListener('click', action);
    }
  }

  private brancherBarre(barre: HTMLInputElement | null): void {
    if (barre === null) {
      return;
    }
    barre.disabled = this.verrouille();
    barre.addEventListener('input', () => this.ecrire(this.selection, barre.value, 'barre'));
    if (this.foyer === 'barre' && !this.verrouille()) {
      barre.focus();
      barre.setSelectionRange(barre.value.length, barre.value.length);
    }
  }

  private brancherCellule(champ: HTMLInputElement): void {
    const nom = champ.dataset['nom'] ?? CELLULE_INITIALE;
    champ.addEventListener('input', () => this.ecrire(nom, champ.value, 'cellule'));
    champ.addEventListener('focus', () => this.selectionner(nom));
    champ.addEventListener('keydown', (evenement) => this.auClavier(evenement, nom));
    if (nom === this.selection && this.foyer === 'cellule' && !this.verrouille()) {
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
    if (nom !== this.selection && !this.verrouille()) {
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
    if (this.verrouille() || this.verrouillee(nom)) {
      return;
    }
    this.contenus = { ...this.contenus, [nom]: contenu.slice(0, LONGUEUR_MAX_CELLULE) };
    this.selection = nom;
    this.foyer = source;
    this.message = '';
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

  private detailDe(nom: string): DetailDeVerdict | null {
    return this.interneVerdict?.details.find((detail) => detail.cle === nom) ?? null;
  }

  private justes(): number {
    return this.interneVerdict?.details.filter((detail) => detail.juste).length ?? 0;
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
    const detail = interactif ? this.detailDe(nom) : null;
    const etat =
      detail === null ? VIDE : safeHtml`${this.etatDuDetail(detail)} data-testid="cellule-verdict"`;
    return safeHtml`<td class="${escapeHtml(STYLE_CELLULE)}" headers="${escapeHtml(portes)}" ${etat}>${contenu}</td>`;
  }

  private lecture(nom: string): EscapedHtml {
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
    const bloquee = this.verrouillee(nom) || this.verrouille();
    return safeHtml`<input class="fp-sheet__champ fp-montant" data-testid="cellule" data-role="cellule" data-nom="${escapeHtml(nom)}" type="text" autocomplete="off" spellcheck="false" maxlength="${LONGUEUR_MAX_CELLULE}" aria-label="${escapeHtml(enonce)}" value="${escapeHtml(this.affichage(nom, true))}" ${marque} ${bloquee ? LECTURE_SEULE : VIDE}>`;
  }

  private bilanErreurs(): EscapedHtml {
    const fautives = this.cellulesEnErreur();
    if (fautives.length === 0) {
      return safeHtml`<p class="fp-sheet__bilan" aria-live="polite" data-testid="erreurs"></p>`;
    }
    return safeHtml`<p class="fp-sheet__bilan fp-sheet__bilan--fautif" aria-live="polite" data-testid="erreurs">${escapeHtml(SIGNE_ERREUR)} ${escapeHtml(this.texte('sheet-erreurs'))} ${escapeHtml(fautives.join(', '))}</p>`;
  }

  private attendusFormateur(): EscapedHtml {
    if (this.attendus.length === 0) {
      return VIDE;
    }
    const lignes = this.attendus.map(
      (attendu) =>
        safeHtml`<li class="fp-sheet__attendu" data-testid="attendu" data-nom="${escapeHtml(attendu.reference)}"><strong>${escapeHtml(attendu.reference)}</strong> <code>${escapeHtml(attendu.formuleReference)}</code> <span class="fp-montant">${escapeHtml(formaterResultat({ valeur: attendu.valeur, erreur: null }))}</span></li>`,
    );
    return safeHtml`<ul class="fp-sheet__attendus" data-testid="attendus">${lignes}</ul>`;
  }

  private conclure(detail: Readonly<Record<string, unknown>>): void {
    this.soumis = true;
    this.foyer = null;
    this.message = this.messageApresEnvoi();
    this.emit('fp-sheet-submit', { ...detail, dureeMs: this.depuisAffichage() });
    this.refresh();
  }

  private valider(): void {
    const plan = this.interne;
    if (plan === null || this.verrouille()) {
      return;
    }
    const cellules = this.saisiesDeLEtudiant();
    if (Object.keys(cellules).length === 0) {
      this.message = this.texte('production-vide');
      this.refresh();
      return;
    }
    this.conclure({ planId: plan.id, cellules });
  }

  private neSaitPas(): void {
    const plan = this.interne;
    if (plan !== null && !this.verrouille()) {
      this.conclure({ planId: plan.id, neSaitPas: true });
    }
  }
}
