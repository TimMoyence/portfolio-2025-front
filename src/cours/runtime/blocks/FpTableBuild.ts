import type { MetadonneesBrique } from '../../content/types';
import { evaluerExpression } from '../core/formula';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { projeterMetadonnees } from './projection';
import {
  estObjet,
  estVerdictDeProduction,
  type DetailDeVerdict,
  type VerdictDeProduction,
} from './retours';
import { lireNombreSaisi } from './saisie-numerique';

export type RoleColonne = 'donnee' | 'saisie' | 'deduite';

export interface TableColonne {
  readonly cle: string;
  readonly intitule: string;
  readonly role: RoleColonne;
  readonly decimales: number;
  readonly valeurs?: readonly number[];
  readonly formule?: string;
  readonly formuleInitiale?: string;
  readonly soldeDe?: string;
  readonly totalise: boolean;
}

export interface TableSynthese {
  readonly libelle: string;
  readonly formule: string;
  readonly unite: string | null;
  readonly decimales: number;
}

export interface TableBuildPlanPublic {
  readonly id: string;
  readonly intitule: string;
  readonly consignes: readonly string[];
  readonly echeances: number;
  readonly libellesLignes: readonly string[];
  readonly parametres: Readonly<Record<string, number>>;
  readonly colonnes: readonly TableColonne[];
  readonly synthese: readonly TableSynthese[];
  readonly metadonnees: MetadonneesBrique;
}

interface SaisieDeTableau {
  readonly rang: number;
  readonly cle: string;
  readonly valeur: number;
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
const DESACTIVE = safeHtml`disabled`;
const DECIMALES_MAX = 6;
const ROLES: readonly RoleColonne[] = ['donnee', 'saisie', 'deduite'];
const MENTIONS_DE_ROLE: Readonly<Record<Exclude<RoleColonne, 'donnee'>, string>> = {
  saisie: 'table-build-a-saisir',
  deduite: 'table-build-deduite',
};

function lireMontant(brut: string): number {
  return lireNombreSaisi(brut) ?? Number.NaN;
}

function bornerDecimales(decimales: number): number {
  return Number.isFinite(decimales)
    ? Math.min(Math.max(Math.trunc(decimales), 0), DECIMALES_MAX)
    : 2;
}

function formater(valeur: number, decimales: number): string {
  return Number.isFinite(valeur)
    ? valeur.toFixed(bornerDecimales(decimales)).replace('.', ',')
    : TIRET;
}

function capitaliser(cle: string): string {
  return cle.charAt(0).toUpperCase() + cle.slice(1);
}

function nombresFinis(source: Readonly<Record<string, number>>): Record<string, number> {
  return Object.fromEntries(Object.entries(source).filter(([, valeur]) => Number.isFinite(valeur)));
}

function ligneDeConsigne(consigne: string): EscapedHtml {
  return safeHtml`<li>${escapeHtml(consigne)}</li>`;
}

function copierColonne(colonne: TableColonne): TableColonne {
  return {
    cle: colonne.cle,
    intitule: colonne.intitule,
    role: ROLES.find((role) => role === colonne.role) ?? 'deduite',
    decimales: bornerDecimales(colonne.decimales),
    ...(colonne.valeurs === undefined ? {} : { valeurs: [...colonne.valeurs] }),
    ...(colonne.formule === undefined ? {} : { formule: colonne.formule }),
    ...(colonne.formuleInitiale === undefined ? {} : { formuleInitiale: colonne.formuleInitiale }),
    ...(colonne.soldeDe === undefined ? {} : { soldeDe: colonne.soldeDe }),
    totalise: colonne.totalise === true,
  };
}

function copierPlan(source: TableBuildPlanPublic): TableBuildPlanPublic {
  return {
    id: source.id,
    intitule: source.intitule,
    consignes: [...source.consignes],
    echeances: Number.isFinite(source.echeances) ? Math.max(0, Math.trunc(source.echeances)) : 0,
    libellesLignes: [...source.libellesLignes],
    parametres: nombresFinis(source.parametres),
    colonnes: source.colonnes.map(copierColonne),
    synthese: source.synthese.map((element) => ({ ...element })),
    metadonnees: projeterMetadonnees(source.metadonnees),
  };
}

function lireAttendus(valeur: unknown): readonly SaisieDeTableau[] {
  if (!estObjet(valeur) || valeur['type'] !== 'tableau' || !Array.isArray(valeur['attendus'])) {
    return [];
  }
  return valeur['attendus'].filter(
    (attendu): attendu is SaisieDeTableau =>
      estObjet(attendu) &&
      typeof attendu['rang'] === 'number' &&
      typeof attendu['cle'] === 'string' &&
      typeof attendu['valeur'] === 'number',
  );
}

export class FpTableBuild extends FpBlock {
  private interne: TableBuildPlanPublic | null = null;
  private tapees: Record<string, string> = {};
  private suivie: string | null = null;
  private message = '';
  private soumis = false;
  private interneVerdict: VerdictDeProduction | null = null;
  private attendus: readonly SaisieDeTableau[] = [];

  set plan(valeur: TableBuildPlanPublic | null) {
    const change = (valeur?.id ?? null) !== (this.interne?.id ?? null);
    this.interne = valeur === null ? null : copierPlan(valeur);
    if (change) {
      this.tapees = {};
      this.suivie = null;
      this.message = '';
      this.soumis = false;
      this.interneVerdict = null;
    }
    this.refreshSiConnecte();
  }

  get plan(): TableBuildPlanPublic | null {
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
    if (!estObjet(valeur) || this.soumis) {
      return;
    }
    const saisies = new Set(this.cellulesASaisir());
    this.tapees = Object.fromEntries(
      Object.entries(valeur).filter(
        (entree): entree is [string, string] =>
          saisies.has(entree[0]) && typeof entree[1] === 'string',
      ),
    );
    this.noterBrouillonRepris();
    this.refreshSiConnecte();
  }

  renderHand(): EscapedHtml {
    const plan = this.interne;
    if (plan === null) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    const lignes = this.batir();
    const verrouille = this.verrouille();
    return safeHtml`
      <section class="fp-carte fp-table-build__atelier">
        <p class="fp-table-build__consigne">${escapeHtml(this.texte('table-build-consigne'))}</p>
        ${this.consignes(plan)}
        ${this.tableau(lignes, true)}
        ${this.soldeFinal(lignes)}
        ${this.synthese(lignes)}
        <div class="fp-table-build__actions">
          <button type="button" class="fp-table-build__valider" data-testid="valider" ${verrouille ? DESACTIVE : VIDE}>${escapeHtml(this.texte('valider'))}</button>
          ${this.boutonNeSaitPas(verrouille)}
        </div>
        <p class="fp-table-build__retour" aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
        ${this.verdictDeProduction(this.interneVerdict, 'table-build-verdict', this.lignesJustes(), this.lignesVerifiees())}
        ${this.annonces()}
      </section>
    `;
  }

  renderStage(): EscapedHtml {
    if (this.interne === null) {
      return safeHtml``;
    }
    const lignes = this.batir();
    return safeHtml`<section class="fp-scene fp-table-build__atelier">${this.tableau(lignes, false)}${this.soldeFinal(lignes)}</section>`;
  }

  renderBoard(): EscapedHtml {
    const plan = this.interne;
    if (plan === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    return safeHtml`
      <section class="fp-carte fp-table-build__atelier">
        <p class="fp-enonce">${escapeHtml(plan.intitule)}</p>
        ${this.consignes(plan)}
        <div class="fp-table-build__reperes">${this.reperes(plan.metadonnees)}</div>
        ${this.roleActuel() === 'presentateur' ? this.attendusFormateur(plan) : VIDE}
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
    racine
      .querySelector<HTMLButtonElement>('[data-testid="valider"]')
      ?.addEventListener('click', () => this.valider());
    racine
      .querySelector<HTMLButtonElement>('[data-testid="je-ne-sais-pas"]')
      ?.addEventListener('click', () => this.neSaitPas());
  }

  private verrouille(): boolean {
    return this.verrouilleApresEnvoi(this.soumis, this.interneVerdict !== null);
  }

  private brancher(champ: HTMLInputElement): void {
    const cle = `${champ.dataset['rang']}:${champ.dataset['cle']}`;
    champ.disabled = this.verrouille();
    champ.addEventListener('input', () => this.noter(cle, champ.value));
    if (cle === this.suivie && !this.verrouille()) {
      champ.focus();
      champ.setSelectionRange(champ.value.length, champ.value.length);
    }
  }

  private noter(cle: string, valeur: string): void {
    this.tapees = { ...this.tapees, [cle]: valeur };
    this.suivie = cle;
    this.message = '';
    this.signalerBrouillon(this.interne?.id ?? '', { ...this.tapees });
    this.refresh();
  }

  private colonnes(): readonly TableColonne[] {
    return this.interne?.colonnes ?? [];
  }

  private cellulesASaisir(): string[] {
    const cles: string[] = [];
    for (let rang = 0; rang < (this.interne?.echeances ?? 0); rang += 1) {
      for (const colonne of this.colonnes().filter((candidate) => candidate.role === 'saisie')) {
        cles.push(`${rang}:${colonne.cle}`);
      }
    }
    return cles;
  }

  private saisieDe(rang: number, cle: string): number {
    return lireMontant(this.tapees[`${rang}:${cle}`] ?? '');
  }

  private variablesDeLaLigne(
    valeurs: Readonly<Record<string, number>>,
    precedente: Readonly<Record<string, number>> | null,
  ): Record<string, number> {
    const avant = Object.fromEntries(
      Object.entries(precedente ?? {}).map(([cle, valeur]) => [`avant${capitaliser(cle)}`, valeur]),
    );
    return nombresFinis({ ...(this.interne?.parametres ?? {}), ...avant, ...valeurs });
  }

  private evaluer(formule: string | undefined, variables: Record<string, number>): number {
    if (formule === undefined) {
      return Number.NaN;
    }
    return evaluerExpression(formule, variables).valeur ?? Number.NaN;
  }

  private batir(): LigneBatie[] {
    const lignes: LigneBatie[] = [];
    let precedente: Record<string, number> | null = null;
    for (let rang = 0; rang < (this.interne?.echeances ?? 0); rang += 1) {
      const valeurs: Record<string, number> = {};
      for (const colonne of this.colonnes()) {
        if (colonne.role === 'donnee') {
          valeurs[colonne.cle] = colonne.valeurs?.[rang] ?? Number.NaN;
        } else if (colonne.role === 'saisie') {
          valeurs[colonne.cle] = this.saisieDe(rang, colonne.cle);
        }
      }
      for (const colonne of this.colonnes().filter((candidate) => candidate.role === 'deduite')) {
        const formule =
          rang === 0 && colonne.formuleInitiale !== undefined
            ? colonne.formuleInitiale
            : colonne.formule;
        valeurs[colonne.cle] = this.evaluer(formule, this.variablesDeLaLigne(valeurs, precedente));
      }
      lignes.push({ rang, valeurs });
      precedente = valeurs;
    }
    return lignes;
  }

  private totaux(lignes: readonly LigneBatie[]): Record<string, number> {
    return Object.fromEntries(
      this.colonnes()
        .filter((colonne) => colonne.totalise)
        .map((colonne) => [
          colonne.cle,
          lignes.reduce((cumul, ligne) => cumul + (ligne.valeurs[colonne.cle] ?? Number.NaN), 0),
        ]),
    );
  }

  private variablesDeSynthese(lignes: readonly LigneBatie[]): Record<string, number> {
    const derniere = lignes.at(-1)?.valeurs ?? {};
    const dernier = Object.fromEntries(
      Object.entries(derniere).map(([cle, valeur]) => [`dernier${capitaliser(cle)}`, valeur]),
    );
    const totaux = Object.fromEntries(
      Object.entries(this.totaux(lignes)).map(([cle, valeur]) => [
        `total${capitaliser(cle)}`,
        valeur,
      ]),
    );
    return nombresFinis({ ...(this.interne?.parametres ?? {}), ...dernier, ...totaux });
  }

  private consignes(plan: TableBuildPlanPublic): EscapedHtml {
    if (plan.consignes.length === 0) {
      return VIDE;
    }
    return safeHtml`<ol class="fp-table-build__consignes" data-testid="consignes">${plan.consignes.map(ligneDeConsigne)}</ol>`;
  }

  private tableau(lignes: readonly LigneBatie[], interactif: boolean): EscapedHtml {
    return safeHtml`
      <table class="fp-table-build__tableau" data-testid="tableau">
        <caption class="fp-table-build__intitule">${escapeHtml(this.interne?.intitule ?? '')}</caption>
        <thead><tr>${this.enteteRang()}${this.colonnes().map((colonne) => this.entete(colonne))}</tr></thead>
        <tbody>${lignes.map((ligne) => this.ligne(ligne, interactif))}</tbody>
        <tfoot>${this.ligneDesTotaux(lignes)}</tfoot>
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

  private mentionDeRole(colonne: TableColonne): EscapedHtml {
    if (colonne.role === 'donnee') {
      return VIDE;
    }
    return safeHtml` <span class="fp-table-build__role">${escapeHtml(this.texte(MENTIONS_DE_ROLE[colonne.role]))}</span>`;
  }

  private entete(colonne: TableColonne): EscapedHtml {
    return safeHtml`<th class="fp-table-build__entete" scope="col" id="${escapeHtml(PREFIXE_COLONNE + colonne.cle)}" data-testid="entete" data-cle="${escapeHtml(colonne.cle)}">${escapeHtml(colonne.intitule)}${this.mentionDeRole(colonne)}</th>`;
  }

  private libelleDeLigne(rang: number): string {
    return this.interne?.libellesLignes[rang] ?? String(rang + 1);
  }

  private ligne(ligne: LigneBatie, interactif: boolean): EscapedHtml {
    return safeHtml`
      <tr class="fp-table-build__ligne" data-testid="ligne" data-rang="${ligne.rang}">
        <th class="${escapeHtml(STYLE_RANG)}" scope="row" id="${escapeHtml(PREFIXE_LIGNE + ligne.rang)}">${escapeHtml(this.libelleDeLigne(ligne.rang))}</th>
        ${this.colonnes().map((colonne) => this.cellule(colonne, ligne, interactif))}
      </tr>
    `;
  }

  private detailDe(rang: number, cle: string): DetailDeVerdict | null {
    return this.interneVerdict?.details.find((detail) => detail.cle === `${rang}:${cle}`) ?? null;
  }

  private cellule(colonne: TableColonne, ligne: LigneBatie, interactif: boolean): EscapedHtml {
    const portes = `${PREFIXE_COLONNE}${colonne.cle} ${PREFIXE_LIGNE}${ligne.rang}`;
    const contenu = interactif ? this.champ(colonne, ligne) : this.lecture(colonne, ligne);
    const detail = interactif ? this.detailDe(ligne.rang, colonne.cle) : null;
    const etat = detail === null ? VIDE : this.etatDuDetail(detail);
    return safeHtml`<td class="${escapeHtml(STYLE_CELLULE)}" headers="${escapeHtml(portes)}" ${etat}>${contenu}</td>`;
  }

  private lecture(colonne: TableColonne, ligne: LigneBatie): EscapedHtml {
    return safeHtml`<span data-testid="cellule" data-rang="${ligne.rang}" data-cle="${escapeHtml(colonne.cle)}">${escapeHtml(this.valeurAffichee(colonne, ligne))}</span>`;
  }

  private valeurAffichee(colonne: TableColonne, ligne: LigneBatie): string {
    return formater(ligne.valeurs[colonne.cle] ?? Number.NaN, colonne.decimales);
  }

  private champ(colonne: TableColonne, ligne: LigneBatie): EscapedHtml {
    const saisie = colonne.role === 'saisie';
    const affichee = saisie
      ? (this.tapees[`${ligne.rang}:${colonne.cle}`] ?? '')
      : this.valeurAffichee(colonne, ligne);
    const enonce = `${colonne.intitule} — ${this.libelleDeLigne(ligne.rang)}`;
    return safeHtml`<input class="fp-table-build__champ fp-montant" data-testid="cellule" data-role="${escapeHtml(colonne.role)}" data-rang="${ligne.rang}" data-cle="${escapeHtml(colonne.cle)}" type="text" inputmode="decimal" autocomplete="off" aria-label="${escapeHtml(enonce)}" value="${escapeHtml(affichee)}" ${saisie ? VIDE : LECTURE_SEULE}>`;
  }

  private ligneDesTotaux(lignes: readonly LigneBatie[]): EscapedHtml {
    if (!this.colonnes().some((colonne) => colonne.totalise)) {
      return VIDE;
    }
    const totaux = this.totaux(lignes);
    return safeHtml`
      <tr class="fp-table-build__totaux" data-testid="totaux">
        <th class="${escapeHtml(STYLE_RANG)}" scope="row">${escapeHtml(this.texte('table-build-totaux'))}</th>
        ${this.colonnes().map((colonne) => this.celluleDeTotal(colonne, totaux))}
      </tr>
    `;
  }

  private celluleDeTotal(
    colonne: TableColonne,
    totaux: Readonly<Record<string, number>>,
  ): EscapedHtml {
    const total = colonne.totalise
      ? formater(totaux[colonne.cle] ?? Number.NaN, colonne.decimales)
      : '';
    return safeHtml`<td class="${escapeHtml(STYLE_CELLULE)}" data-testid="total" data-cle="${escapeHtml(colonne.cle)}">${escapeHtml(total)}</td>`;
  }

  private soldeFinal(lignes: readonly LigneBatie[]): EscapedHtml {
    const colonne = this.colonnes().find((candidate) => candidate.soldeDe !== undefined);
    const derniere = lignes.at(-1);
    if (colonne?.soldeDe === undefined || derniere === undefined) {
      return VIDE;
    }
    const reste =
      (derniere.valeurs[colonne.soldeDe] ?? Number.NaN) -
      (derniere.valeurs[colonne.cle] ?? Number.NaN);
    return safeHtml`<p class="fp-table-build__solde fp-montant" data-testid="solde">${escapeHtml(this.texte('table-build-solde'))} ${escapeHtml(formater(reste, colonne.decimales))}</p>`;
  }

  private synthese(lignes: readonly LigneBatie[]): EscapedHtml {
    const elements = this.interne?.synthese ?? [];
    if (elements.length === 0) {
      return VIDE;
    }
    const variables = this.variablesDeSynthese(lignes);
    const lignesDeSynthese = elements.map((element) => this.resultatDeSynthese(element, variables));
    return safeHtml`<section class="fp-table-build__synthese" data-testid="synthese"><h3 class="fp-table-build__titre">${escapeHtml(this.texte('table-build-synthese'))}</h3><dl>${lignesDeSynthese}</dl></section>`;
  }

  private resultatDeSynthese(
    element: TableSynthese,
    variables: Record<string, number>,
  ): EscapedHtml {
    const valeur = this.evaluer(element.formule, variables);
    const formatee = formater(valeur, element.decimales);
    const affichee =
      Number.isFinite(valeur) && element.unite !== null ? `${formatee} ${element.unite}` : formatee;
    return safeHtml`<div class="fp-table-build__resultat" data-testid="synthese-ligne"><dt>${escapeHtml(element.libelle)}</dt><dd class="fp-montant">${escapeHtml(affichee)}</dd></div>`;
  }

  private lignesVerifiees(): number {
    const rangs = new Set(
      (this.interneVerdict?.details ?? []).map((detail) => detail.cle.split(':')[0]),
    );
    return rangs.size;
  }

  private lignesJustes(): number {
    const parRang = new Map<string, boolean>();
    for (const detail of this.interneVerdict?.details ?? []) {
      const rang = detail.cle.split(':')[0];
      parRang.set(rang, (parRang.get(rang) ?? true) && detail.juste);
    }
    return [...parRang.values()].filter(Boolean).length;
  }

  private attendusFormateur(plan: TableBuildPlanPublic): EscapedHtml {
    if (this.attendus.length === 0) {
      return VIDE;
    }
    const intitule = (cle: string): string =>
      plan.colonnes.find((colonne) => colonne.cle === cle)?.intitule ?? cle;
    const lignes = this.attendus.map(
      (attendu) =>
        safeHtml`<li class="fp-table-build__attendu" data-testid="attendu" data-rang="${attendu.rang}" data-cle="${escapeHtml(attendu.cle)}">${escapeHtml(this.libelleDeLigne(attendu.rang))} — ${escapeHtml(intitule(attendu.cle))} : <span class="fp-montant">${escapeHtml(formater(attendu.valeur, 2))}</span></li>`,
    );
    return safeHtml`<ul class="fp-table-build__attendus" data-testid="attendus">${lignes}</ul>`;
  }

  private relever(): SaisieDeTableau[] {
    return this.cellulesASaisir()
      .map((cle) => {
        const [rang, colonne] = cle.split(':');
        return { rang: Number(rang), cle: colonne, valeur: this.saisieDe(Number(rang), colonne) };
      })
      .filter((saisie) => Number.isFinite(saisie.valeur));
  }

  private conclure(detail: Readonly<Record<string, unknown>>): void {
    this.soumis = true;
    this.suivie = null;
    this.message = this.messageApresEnvoi();
    this.emit('fp-table-build-submit', { ...detail, dureeMs: this.depuisAffichage() });
    this.refresh();
  }

  private valider(): void {
    const plan = this.interne;
    if (plan === null || this.verrouille()) {
      return;
    }
    const saisies = this.relever();
    if (saisies.length === 0) {
      this.message = this.texte('production-vide');
      this.refresh();
      return;
    }
    if (saisies.length < this.cellulesASaisir().length) {
      this.message = this.texte('table-build-cellule-vide');
      this.refresh();
      return;
    }
    this.conclure({ planId: plan.id, saisies });
  }

  private neSaitPas(): void {
    const plan = this.interne;
    if (plan !== null && !this.verrouille()) {
      this.conclure({ planId: plan.id, neSaitPas: true });
    }
  }
}
