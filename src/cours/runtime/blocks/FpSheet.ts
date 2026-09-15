import type { MetadonneesBrique } from '../../content/types';
import {
  type Feuille,
  type ResultatFormule,
  decalerFormule,
  evaluerCellule,
  formaterResultat,
  lettreColonne,
  nomCellule,
} from '../core/formula';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { projeterMetadonnees } from './projection';

export interface SheetPlanPublic {
  readonly id: string;
  readonly intitule: string;
  readonly lignes: number;
  readonly colonnes: number;
  readonly cellules: Readonly<Record<string, string>>;
  readonly verrouillees: readonly string[];
  readonly metadonnees: MetadonneesBrique;
}

export interface CelluleAttendue {
  readonly reference: string;
  readonly valeur: number;
}

export interface SheetPlan extends SheetPlanPublic {
  readonly attendus: readonly CelluleAttendue[];
}

type Foyer = 'cellule' | 'barre' | null;

const CELLULE_INITIALE = 'A1';
const STYLE_CELLULE = 'fp-sheet__cellule';
const STYLE_ENTETE = 'fp-sheet__entete';
const PREFIXE_COLONNE = 'fp-sheet-col-';
const PREFIXE_LIGNE = 'fp-sheet-ligne-';
const VIDE = escapeHtml('');
const LECTURE_SEULE = safeHtml`readonly`;
const SIGNE_ERREUR = '⚠';
const LIMITE_GRILLE = 40;

function borner(brut: number): number {
  return Number.isFinite(brut) ? Math.min(LIMITE_GRILLE, Math.max(0, Math.trunc(brut))) : 0;
}

function copierCellules(source: Readonly<Record<string, string>>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(source).map(([nom, contenu]) => [nom.toUpperCase(), String(contenu)]),
  );
}

function copierPlan(source: SheetPlanPublic): SheetPlanPublic {
  return {
    id: source.id,
    intitule: source.intitule,
    lignes: borner(source.lignes),
    colonnes: borner(source.colonnes),
    cellules: copierCellules(source.cellules),
    verrouillees: source.verrouillees.map((nom) => nom.toUpperCase()),
    metadonnees: projeterMetadonnees(source.metadonnees),
  };
}

export class FpSheet extends FpBlock {
  private interne: SheetPlanPublic | null = null;
  private contenus: Record<string, string> = {};
  private selection = CELLULE_INITIALE;
  private foyer: Foyer = null;
  private message = '';
  private soumis = false;

  set plan(valeur: SheetPlanPublic | null) {
    this.interne = valeur === null ? null : copierPlan(valeur);
    this.contenus = { ...(this.interne?.cellules ?? {}) };
    this.selection = CELLULE_INITIALE;
    this.foyer = null;
    this.message = '';
    this.soumis = false;
    this.refreshSiConnecte();
  }

  get plan(): SheetPlanPublic | null {
    return this.interne;
  }

  get saisies(): Readonly<Record<string, string>> {
    return { ...this.contenus };
  }

  renderHand(): EscapedHtml {
    if (this.interne === null) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    return safeHtml`
      <section class="fp-carte fp-sheet__atelier">
        <p class="fp-sheet__consigne">${escapeHtml(this.texte('sheet-consigne'))}</p>
        ${this.barre()}
        ${this.tableau(true)}
        <div class="fp-sheet__actions">
          <button type="button" class="fp-sheet__recopier" data-testid="recopier">${escapeHtml(this.texte('sheet-recopier'))}</button>
          <button type="button" class="fp-sheet__valider" data-testid="valider">${escapeHtml(this.texte('valider'))}</button>
        </div>
        ${this.bilanErreurs()}
        <p class="fp-sheet__retour" aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
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
        <p class="fp-sheet__progression" data-testid="progression">${escapeHtml(this.texte('sheet-progression'))} ${this.ecrites()}</p>
        <div class="fp-sheet__reperes">
          <span class="fp-badge" data-testid="modalite">${escapeHtml(plan.metadonnees.modalite)}</span>
          <span class="fp-badge" data-testid="duree">${plan.metadonnees.dureeMinutes} min</span>
        </div>
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
  }

  private brancherBouton(racine: ShadowRoot, nom: string, action: () => void): void {
    const bouton = racine.querySelector<HTMLButtonElement>(`[data-testid="${nom}"]`);
    if (bouton !== null) {
      bouton.disabled = this.soumis;
      bouton.addEventListener('click', action);
    }
  }

  private brancherBarre(barre: HTMLInputElement | null): void {
    if (barre === null) {
      return;
    }
    barre.disabled = this.soumis;
    barre.addEventListener('input', () => this.ecrire(this.selection, barre.value, 'barre'));
    if (this.foyer === 'barre' && !this.soumis) {
      barre.focus();
      barre.setSelectionRange(barre.value.length, barre.value.length);
    }
  }

  private brancherCellule(champ: HTMLInputElement): void {
    const nom = champ.dataset['nom'] ?? CELLULE_INITIALE;
    champ.addEventListener('input', () => this.ecrire(nom, champ.value, 'cellule'));
    champ.addEventListener('focus', () => this.selectionner(nom));
    champ.addEventListener('keydown', (evenement) => this.auClavier(evenement, nom));
    if (nom === this.selection && this.foyer === 'cellule' && !this.soumis) {
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
    if (nom !== this.selection && !this.soumis) {
      this.selection = nom;
      this.foyer = 'cellule';
      this.refresh();
    }
  }

  private verrouillee(nom: string): boolean {
    return this.interne?.verrouillees.includes(nom) === true;
  }

  private ecrire(nom: string, contenu: string, source: Foyer): void {
    if (this.soumis || this.verrouillee(nom)) {
      return;
    }
    this.contenus = { ...this.contenus, [nom]: contenu };
    this.selection = nom;
    this.foyer = source;
    this.message = '';
    this.refresh();
  }

  private recopier(): void {
    const cible = this.dessous(this.selection);
    if (this.soumis || cible === this.selection || this.verrouillee(cible)) {
      this.message = this.texte('sheet-recopie-impossible');
      this.refresh();
      return;
    }
    const decalee = decalerFormule(this.contenus[this.selection] ?? '', 1, 0);
    this.contenus = { ...this.contenus, [cible]: decalee };
    this.selection = cible;
    this.foyer = 'cellule';
    this.message = '';
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
    return evaluerCellule(this.feuille(), nom);
  }

  private brut(nom: string): string {
    return this.contenus[nom] ?? '';
  }

  private affichage(nom: string, interactif: boolean): string {
    if (interactif && nom === this.selection) {
      return this.brut(nom);
    }
    return this.brut(nom).trim().length === 0 ? '' : formaterResultat(this.resultat(nom));
  }

  private cellulesEnErreur(): string[] {
    const fautives: string[] = [];
    for (let ligne = 0; ligne < (this.interne?.lignes ?? 0); ligne += 1) {
      for (let colonne = 0; colonne < (this.interne?.colonnes ?? 0); colonne += 1) {
        const nom = nomCellule(ligne, colonne);
        if (this.brut(nom).trim().length > 0 && this.resultat(nom).erreur !== null) {
          fautives.push(nom);
        }
      }
    }
    return fautives;
  }

  private ecrites(): number {
    return Object.entries(this.contenus).filter(
      ([nom, contenu]) =>
        contenu.trimStart().startsWith('=') && contenu !== (this.interne?.cellules[nom] ?? ''),
    ).length;
  }

  private barre(): EscapedHtml {
    return safeHtml`
      <p class="fp-sheet__barre">
        <label class="fp-sheet__reference" for="fp-sheet-barre" data-testid="reference">${escapeHtml(this.selection)}</label>
        <input class="fp-sheet__saisie" id="fp-sheet-barre" data-testid="barre" type="text" autocomplete="off" spellcheck="false" value="${escapeHtml(this.brut(this.selection))}">
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
    return safeHtml`<td class="${escapeHtml(STYLE_CELLULE)}" headers="${escapeHtml(portes)}">${contenu}</td>`;
  }

  private lecture(nom: string): EscapedHtml {
    return safeHtml`<span data-testid="cellule" data-nom="${escapeHtml(nom)}">${escapeHtml(this.affichage(nom, false))}</span>`;
  }

  private champ(nom: string): EscapedHtml {
    const code = this.brut(nom).trim().length === 0 ? null : this.resultat(nom).erreur;
    const alerte = `${SIGNE_ERREUR} ${this.texte('sheet-cellule-fautive')}`;
    const marque =
      code === null
        ? VIDE
        : safeHtml`aria-invalid="true" data-erreur="${escapeHtml(code)}" title="${escapeHtml(alerte)}"`;
    const enonce = `${this.texte('sheet-cellule')} ${nom}`;
    const bloquee = this.verrouillee(nom) || this.soumis;
    return safeHtml`<input class="fp-sheet__champ fp-montant" data-testid="cellule" data-role="cellule" data-nom="${escapeHtml(nom)}" type="text" autocomplete="off" spellcheck="false" aria-label="${escapeHtml(enonce)}" value="${escapeHtml(this.affichage(nom, true))}" ${marque} ${bloquee ? LECTURE_SEULE : VIDE}>`;
  }

  private bilanErreurs(): EscapedHtml {
    const fautives = this.cellulesEnErreur();
    if (fautives.length === 0) {
      return safeHtml`<p class="fp-sheet__bilan" aria-live="polite" data-testid="erreurs"></p>`;
    }
    return safeHtml`<p class="fp-sheet__bilan fp-sheet__bilan--fautif" aria-live="polite" data-testid="erreurs">${escapeHtml(SIGNE_ERREUR)} ${escapeHtml(this.texte('sheet-erreurs'))} ${escapeHtml(fautives.join(', '))}</p>`;
  }

  private valider(): void {
    const plan = this.interne;
    if (plan === null || this.soumis) {
      return;
    }
    if (this.ecrites() === 0) {
      this.message = this.texte('sheet-aucune-formule');
      this.refresh();
      return;
    }
    this.soumis = true;
    this.foyer = null;
    this.message = this.texte('reponse-enregistree');
    this.emit('fp-sheet-submit', {
      planId: plan.id,
      cellules: { ...this.contenus },
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }
}
