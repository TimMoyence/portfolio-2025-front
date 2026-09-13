import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import type { Tolerance } from './FpNumeric';
import { projeterMetadonnees } from './projection';

export type RoleCellule = 'saisie' | 'deduite';

export interface ContexteCellule {
  readonly rang: number;
  readonly dernier: boolean;
  readonly parametres: Readonly<Record<string, number>>;
  readonly ligne: Readonly<Record<string, number>>;
  readonly precedente: Readonly<Record<string, number>> | null;
}

export type CalculCellule = (contexte: ContexteCellule) => number;

export interface TableColonne {
  readonly cle: string;
  readonly intitule: string;
  readonly role: RoleCellule;
  readonly calcul: CalculCellule | null;
  readonly soldeDe: string | null;
  readonly totalise: boolean;
}

export interface TableBuildPlanPublic {
  readonly id: string;
  readonly intitule: string;
  readonly echeances: number;
  readonly parametres: Readonly<Record<string, number>>;
  readonly colonnes: readonly TableColonne[];
  readonly metadonnees: MetadonneesBrique;
}

export interface CelluleAttendue {
  readonly rang: number;
  readonly cle: string;
  readonly valeur: number;
}

export interface TableBuildPlan extends TableBuildPlanPublic {
  readonly attendus: readonly CelluleAttendue[];
  readonly tolerance: Tolerance;
}

interface LigneBatie {
  readonly rang: number;
  readonly valeurs: Readonly<Record<string, number>>;
}

const TIRET = '—';
const PREFIXE_COLONNE = 'fp-table-build-col-';
const PREFIXE_LIGNE = 'fp-table-build-ligne-';
const STYLE_CELLULE = 'fp-table-build__cellule fp-montant';
const STYLE_RANG = 'fp-table-build__rang';
const VIDE = escapeHtml('');
const LECTURE_SEULE = safeHtml`readonly`;
const BLANCS = /\s/g;
const MOTIF_MONTANT = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;

function lireMontant(brut: string): number {
  const compact = brut.replace(BLANCS, '').replaceAll(',', '.');
  return MOTIF_MONTANT.test(compact) ? Number(compact) : Number.NaN;
}

function arrondirCentime(valeur: number): number {
  return Math.round(valeur * 100) / 100;
}

function formater(valeur: number): string {
  return Number.isFinite(valeur) ? valeur.toFixed(2).replace('.', ',') : TIRET;
}

function copierColonne(colonne: TableColonne): TableColonne {
  return {
    cle: colonne.cle,
    intitule: colonne.intitule,
    role: colonne.role === 'saisie' ? 'saisie' : 'deduite',
    calcul: colonne.calcul,
    soldeDe: colonne.soldeDe,
    totalise: colonne.totalise === true,
  };
}

function copierParametres(source: Readonly<Record<string, number>>): Record<string, number> {
  return Object.fromEntries(Object.entries(source).filter(([, valeur]) => Number.isFinite(valeur)));
}

function copierPlan(source: TableBuildPlanPublic): TableBuildPlanPublic {
  return {
    id: source.id,
    intitule: source.intitule,
    echeances: source.echeances,
    parametres: copierParametres(source.parametres),
    colonnes: source.colonnes.map(copierColonne),
    metadonnees: projeterMetadonnees(source.metadonnees),
  };
}

export class FpTableBuild extends FpBlock {
  private interne: TableBuildPlanPublic | null = null;
  private tapees: Record<string, string> = {};
  private suivie: string | null = null;
  private message = '';
  private soumis = false;

  set plan(valeur: TableBuildPlanPublic | null) {
    this.interne = valeur === null ? null : copierPlan(valeur);
    this.tapees = {};
    this.suivie = null;
    this.message = '';
    this.soumis = false;
    this.refreshSiConnecte();
  }

  get plan(): TableBuildPlanPublic | null {
    return this.interne;
  }

  get saisies(): Readonly<Record<string, string>> {
    return { ...this.tapees };
  }

  renderHand(): EscapedHtml {
    if (this.interne === null) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    return safeHtml`
      <section class="fp-carte fp-table-build__atelier">
        <p class="fp-table-build__consigne">${escapeHtml(this.texte('table-build-consigne'))}</p>
        ${this.tableau(true)}
        ${this.soldeFinal()}
        <button type="button" class="fp-table-build__valider" data-testid="valider">${escapeHtml(this.texte('valider'))}</button>
        <p class="fp-table-build__retour" aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
      </section>
    `;
  }

  renderStage(): EscapedHtml {
    if (this.interne === null) {
      return safeHtml``;
    }
    return safeHtml`<section class="fp-scene fp-table-build__atelier">${this.tableau(false)}${this.soldeFinal()}</section>`;
  }

  renderBoard(): EscapedHtml {
    const plan = this.interne;
    if (plan === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    return safeHtml`
      <section class="fp-carte fp-table-build__atelier">
        <p class="fp-enonce">${escapeHtml(plan.intitule)}</p>
        <p class="fp-table-build__progression" data-testid="progression">${escapeHtml(this.texte('table-build-progression'))} ${this.remplies()} / ${this.aRemplir()}</p>
        <div class="fp-table-build__reperes">
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
    for (const champ of racine.querySelectorAll<HTMLInputElement>('[data-role="saisie"]')) {
      this.brancher(champ);
    }
    const valider = racine.querySelector<HTMLButtonElement>('[data-testid="valider"]');
    if (valider !== null) {
      valider.disabled = this.soumis;
      valider.addEventListener('click', () => this.valider());
    }
  }

  private brancher(champ: HTMLInputElement): void {
    const cle = `${champ.dataset['rang']}:${champ.dataset['cle']}`;
    champ.disabled = this.soumis;
    champ.addEventListener('input', () => this.noter(cle, champ.value));
    if (cle === this.suivie && !this.soumis) {
      champ.focus();
      champ.setSelectionRange(champ.value.length, champ.value.length);
    }
  }

  private noter(cle: string, valeur: string): void {
    this.tapees = { ...this.tapees, [cle]: valeur };
    this.suivie = cle;
    this.message = '';
    this.refresh();
  }

  private echeances(): number {
    const brut = this.interne?.echeances ?? 0;
    return Number.isFinite(brut) ? Math.max(0, Math.trunc(brut)) : 0;
  }

  private colonnes(): readonly TableColonne[] {
    return this.interne?.colonnes ?? [];
  }

  private saisiesDe(rang: number, cle: string): number {
    return lireMontant(this.tapees[`${rang}:${cle}`] ?? '');
  }

  private resoudre(colonne: TableColonne, contexte: ContexteCellule): number {
    if (colonne.role === 'saisie') {
      return this.saisiesDe(contexte.rang, colonne.cle);
    }
    if (colonne.soldeDe !== null && contexte.dernier) {
      return arrondirCentime(contexte.ligne[colonne.soldeDe]);
    }
    return arrondirCentime(colonne.calcul === null ? Number.NaN : colonne.calcul(contexte));
  }

  private batir(): LigneBatie[] {
    const total = this.echeances();
    const parametres = this.interne?.parametres ?? {};
    const lignes: LigneBatie[] = [];
    let precedente: Record<string, number> | null = null;
    for (let rang = 0; rang < total; rang += 1) {
      const valeurs: Record<string, number> = {};
      const contexte = {
        rang,
        dernier: rang === total - 1,
        parametres,
        ligne: valeurs,
        precedente,
      };
      for (const colonne of this.colonnes()) {
        valeurs[colonne.cle] = this.resoudre(colonne, contexte);
      }
      lignes.push({ rang, valeurs });
      precedente = valeurs;
    }
    return lignes;
  }

  private aRemplir(): number {
    return this.echeances() * this.colonnes().filter((colonne) => colonne.role === 'saisie').length;
  }

  private remplies(): number {
    let comptees = 0;
    for (let rang = 0; rang < this.echeances(); rang += 1) {
      for (const colonne of this.colonnes()) {
        const lue = colonne.role === 'saisie' && Number.isFinite(this.saisiesDe(rang, colonne.cle));
        comptees += lue ? 1 : 0;
      }
    }
    return comptees;
  }

  private tableau(interactif: boolean): EscapedHtml {
    const lignes = this.batir();
    return safeHtml`
      <table class="fp-table-build__tableau" data-testid="tableau">
        <caption class="fp-table-build__intitule">${escapeHtml(this.interne?.intitule ?? '')}</caption>
        <thead><tr>${this.enteteRang()}${this.colonnes().map((colonne) => this.entete(colonne))}</tr></thead>
        <tbody>${lignes.map((ligne) => this.ligne(ligne, interactif))}</tbody>
        <tfoot>${this.totaux(lignes)}</tfoot>
      </table>
      ${lignes.length === 0 ? this.vide() : VIDE}
    `;
  }

  private vide(): EscapedHtml {
    return safeHtml`<p class="fp-table-build__vide" data-testid="vide">${escapeHtml(this.texte('table-build-vide'))}</p>`;
  }

  private enteteRang(): EscapedHtml {
    return safeHtml`<th class="fp-table-build__entete" scope="col">${escapeHtml(this.texte('table-build-echeance'))}</th>`;
  }

  private entete(colonne: TableColonne): EscapedHtml {
    const role = this.texte(
      colonne.role === 'saisie' ? 'table-build-a-saisir' : 'table-build-deduite',
    );
    return safeHtml`<th class="fp-table-build__entete" scope="col" id="${escapeHtml(PREFIXE_COLONNE + colonne.cle)}" data-testid="entete" data-cle="${escapeHtml(colonne.cle)}">${escapeHtml(colonne.intitule)} <span class="fp-table-build__role">${escapeHtml(role)}</span></th>`;
  }

  private ligne(ligne: LigneBatie, interactif: boolean): EscapedHtml {
    return safeHtml`
      <tr class="fp-table-build__ligne" data-testid="ligne" data-rang="${ligne.rang}">
        <th class="${escapeHtml(STYLE_RANG)}" scope="row" id="${escapeHtml(PREFIXE_LIGNE + ligne.rang)}">${ligne.rang + 1}</th>
        ${this.colonnes().map((colonne) => this.cellule(colonne, ligne, interactif))}
      </tr>
    `;
  }

  private cellule(colonne: TableColonne, ligne: LigneBatie, interactif: boolean): EscapedHtml {
    const portes = `${PREFIXE_COLONNE}${colonne.cle} ${PREFIXE_LIGNE}${ligne.rang}`;
    const contenu = interactif
      ? this.champ(colonne, ligne)
      : safeHtml`<span data-testid="cellule" data-rang="${ligne.rang}" data-cle="${escapeHtml(colonne.cle)}">${escapeHtml(formater(ligne.valeurs[colonne.cle]))}</span>`;
    return safeHtml`<td class="${escapeHtml(STYLE_CELLULE)}" headers="${escapeHtml(portes)}">${contenu}</td>`;
  }

  private champ(colonne: TableColonne, ligne: LigneBatie): EscapedHtml {
    const saisie = colonne.role === 'saisie';
    const affichee = saisie
      ? (this.tapees[`${ligne.rang}:${colonne.cle}`] ?? '')
      : formater(ligne.valeurs[colonne.cle]);
    const enonce = `${colonne.intitule} — ${this.texte('table-build-echeance')} ${ligne.rang + 1}`;
    return safeHtml`<input class="fp-table-build__champ fp-montant" data-testid="cellule" data-role="${escapeHtml(colonne.role)}" data-rang="${ligne.rang}" data-cle="${escapeHtml(colonne.cle)}" type="text" inputmode="decimal" autocomplete="off" aria-label="${escapeHtml(enonce)}" value="${escapeHtml(affichee)}" ${saisie ? VIDE : LECTURE_SEULE}>`;
  }

  private totaux(lignes: readonly LigneBatie[]): EscapedHtml {
    return safeHtml`
      <tr class="fp-table-build__totaux" data-testid="totaux">
        <th class="${escapeHtml(STYLE_RANG)}" scope="row">${escapeHtml(this.texte('table-build-totaux'))}</th>
        ${this.colonnes().map((colonne) => this.total(colonne, lignes))}
      </tr>
    `;
  }

  private total(colonne: TableColonne, lignes: readonly LigneBatie[]): EscapedHtml {
    const somme = colonne.totalise
      ? lignes.reduce((cumul, ligne) => arrondirCentime(cumul + ligne.valeurs[colonne.cle]), 0)
      : Number.NaN;
    const texte = colonne.totalise ? formater(somme) : '';
    return safeHtml`<td class="${escapeHtml(STYLE_CELLULE)}" data-testid="total" data-cle="${escapeHtml(colonne.cle)}">${escapeHtml(texte)}</td>`;
  }

  private soldeFinal(): EscapedHtml {
    const colonne = this.colonnes().find((candidate) => candidate.soldeDe !== null);
    const derniere = this.batir().at(-1);
    if (colonne === undefined || colonne.soldeDe === null || derniere === undefined) {
      return VIDE;
    }
    const reste = arrondirCentime(
      derniere.valeurs[colonne.soldeDe] - derniere.valeurs[colonne.cle],
    );
    return safeHtml`<p class="fp-table-build__solde fp-montant" data-testid="solde">${escapeHtml(this.texte('table-build-solde'))} ${escapeHtml(formater(reste))}</p>`;
  }

  private manquantes(): number {
    return this.aRemplir() - this.remplies();
  }

  private valider(): void {
    const plan = this.interne;
    if (plan === null || this.soumis) {
      return;
    }
    if (this.manquantes() > 0) {
      this.message = this.texte('table-build-cellule-vide');
      this.refresh();
      return;
    }
    this.soumis = true;
    this.suivie = null;
    this.message = this.texte('reponse-enregistree');
    this.emit('fp-table-build-submit', {
      planId: plan.id,
      saisies: this.relever(),
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }

  private relever(): CelluleAttendue[] {
    const relevees: CelluleAttendue[] = [];
    for (let rang = 0; rang < this.echeances(); rang += 1) {
      for (const colonne of this.colonnes().filter((candidate) => candidate.role === 'saisie')) {
        relevees.push({ rang, cle: colonne.cle, valeur: this.saisiesDe(rang, colonne.cle) });
      }
    }
    return relevees;
  }
}
