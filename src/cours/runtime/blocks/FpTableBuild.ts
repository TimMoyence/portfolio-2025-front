import type { AttenduTableauPresentateurResponseDto } from '../../../../contrat/types.gen';
import type { TableauEvalue, ValeurAffichee } from '../../content/types';
import { dansUnDefileur } from '../core/defileur';
import { type EscapedHtml, escapeHtml, LECTURE_SEULE, safeHtml, VIDE } from '../core/html';
import { entierBorne, estMembre, estObjet, estTexteNonVide } from '../core/valeurs';
import { FpProductionEvaluee, type PlanEtaye, copierLEnonce, memesSaisies } from './production';
import { type DetailDeVerdict, type EvaluationDeTableau, marqueDeCorrection } from './retours';

export type RoleColonne = 'donnee' | 'saisie' | 'deduite';

type RenduDuTableau = 'saisie' | 'lecture' | 'correction';

type Saisies = Readonly<Record<string, string>>;

export interface TableColonne {
  readonly cle: string;
  readonly intitule: string;
  readonly role: RoleColonne;
  readonly format?: 'nombre' | 'booleen';
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

export interface TableBuildPlanPublic extends PlanEtaye {
  readonly consignes: readonly string[];
  readonly echeances: number;
  readonly intituleDesLignes?: string;
  readonly libellesLignes: readonly string[];
  readonly parametres: Readonly<Record<string, number>>;
  readonly colonnes: readonly TableColonne[];
  readonly synthese: readonly TableSynthese[];
  readonly tableauInitial: TableauEvalue;
}

type SaisieDeTableau = AttenduTableauPresentateurResponseDto;

const TIRET = '—';
const ABSENTE: ValeurAffichee = { valeur: null, affichage: TIRET };
const PREFIXE_COLONNE = 'fp-table-build-col-';
const PREFIXE_LIGNE = 'fp-table-build-ligne-';
const STYLE_CELLULE = 'fp-table-build__cellule fp-montant';
const STYLE_RANG = 'fp-table-build__rang';
const SELECTIONNEE = safeHtml`selected`;
const DECIMALES_MAX = 6;
const ROLES: readonly RoleColonne[] = ['donnee', 'saisie', 'deduite'];
const MENTIONS_DE_ROLE: Readonly<Record<Exclude<RoleColonne, 'donnee'>, string>> = {
  saisie: 'table-build-a-saisir',
  deduite: 'table-build-deduite',
};

function bornerDecimales(decimales: number): number {
  return entierBorne(decimales, 0, DECIMALES_MAX, 2);
}

export function cleDeCellule(rang: number | string, cle: string): string {
  return `${rang}:${cle}`;
}

export function saisiesDuPlan(
  plan: Pick<TableBuildPlanPublic, 'echeances' | 'colonnes'>,
): readonly { readonly rang: number; readonly colonne: TableColonne }[] {
  const aSaisir = plan.colonnes.filter((colonne) => colonne.role === 'saisie');
  return Array.from({ length: plan.echeances }, (_, rang) =>
    aSaisir.map((colonne) => ({ rang, colonne })),
  ).flat();
}

export function colonnesACorriger(
  plan: Pick<TableBuildPlanPublic, 'colonnes'>,
): readonly TableColonne[] {
  return plan.colonnes.filter((colonne) => colonne.role !== 'donnee');
}

export function libelleDeLigne(libellesLignes: readonly string[], rang: number): string {
  return libellesLignes[rang] ?? String(rang + 1);
}

export function enonceDeCellule(
  libellesLignes: readonly string[],
  rang: number,
  intitule: string,
): string {
  return `${intitule} — ${libelleDeLigne(libellesLignes, rang)}`;
}

function nombresFinis(source: Readonly<Record<string, number>>): Record<string, number> {
  return Object.fromEntries(Object.entries(source).filter(([, valeur]) => Number.isFinite(valeur)));
}

function estBooleenne(colonne: TableColonne): boolean {
  return colonne.format === 'booleen';
}

function valeurServie(tableau: TableauEvalue, rang: number, cle: string): ValeurAffichee {
  const valeurs = tableau.lignes.find((ligne) => ligne.rang === rang)?.valeurs;
  return valeurs !== undefined && Object.hasOwn(valeurs, cle) ? valeurs[cle] : ABSENTE;
}

function tableauCorrigeDe(corrige: unknown): TableauEvalue | null {
  if (!estObjet(corrige) || corrige['type'] !== 'tableau') {
    return null;
  }
  const tableau = corrige['tableauCorrige'];
  return estObjet(tableau) && Array.isArray(tableau['lignes'])
    ? (tableau as unknown as TableauEvalue)
    : null;
}

function copierColonne(colonne: TableColonne): TableColonne {
  return {
    cle: colonne.cle,
    intitule: colonne.intitule,
    role: estMembre(ROLES, colonne.role) ? colonne.role : 'deduite',
    ...(estBooleenne(colonne) ? { format: 'booleen' } : {}),
    decimales: bornerDecimales(colonne.decimales),
    ...(colonne.valeurs === undefined ? {} : { valeurs: [...colonne.valeurs] }),
    ...(colonne.formule === undefined ? {} : { formule: colonne.formule }),
    ...(colonne.formuleInitiale === undefined ? {} : { formuleInitiale: colonne.formuleInitiale }),
    ...(colonne.soldeDe === undefined ? {} : { soldeDe: colonne.soldeDe }),
    totalise: colonne.totalise === true && !estBooleenne(colonne),
  };
}

function copierPlan(source: TableBuildPlanPublic): TableBuildPlanPublic {
  return {
    ...copierLEnonce(source),
    consignes: [...source.consignes],
    echeances: entierBorne(source.echeances, 0, Number.POSITIVE_INFINITY, 0),
    ...(typeof source.intituleDesLignes === 'string'
      ? { intituleDesLignes: source.intituleDesLignes }
      : {}),
    libellesLignes: [...source.libellesLignes],
    parametres: nombresFinis(source.parametres),
    colonnes: source.colonnes.map(copierColonne),
    synthese: source.synthese.map((element) => ({
      ...element,
      decimales: bornerDecimales(element.decimales),
    })),
    tableauInitial: source.tableauInitial,
  };
}

export class FpTableBuild extends FpProductionEvaluee<
  TableBuildPlanPublic,
  SaisieDeTableau,
  EvaluationDeTableau,
  null
> {
  protected readonly evenementDeSoumission = 'fp-table-build-submit';
  protected readonly evenementDEvaluation = 'fp-table-build-evaluation';
  protected readonly bloc = 'table-build';
  protected readonly lectureDuCorrige = {
    type: 'tableau',
    champs: { rang: 'number', cle: 'string', valeur: 'number' },
  } as const;
  private tapees: Saisies = {};
  private suivie: string | null = null;
  private evalue: TableauEvalue | null = null;

  set plan(valeur: TableBuildPlanPublic | null) {
    this.poserLePlan(valeur, copierPlan);
  }

  get plan(): TableBuildPlanPublic | null {
    return this.interne;
  }

  protected recevoirLEvaluation(valeur: EvaluationDeTableau): void {
    this.evalue = valeur.evalue;
  }

  protected validerApresEvaluation(): void {
    this.valider();
  }

  protected reprendreLeBrouillon(brouillon: Readonly<Record<string, unknown>>): boolean {
    const saisies = new Set(this.cellulesASaisir());
    this.tapees = Object.fromEntries(
      Object.entries(brouillon).filter(
        (entree): entree is [string, string] =>
          saisies.has(entree[0]) && typeof entree[1] === 'string',
      ),
    );
    this.demanderSiNouvelles();
    return true;
  }

  protected scene(plan: TableBuildPlanPublic): EscapedHtml {
    const corrige = this.corrigeVisible();
    const tableau = corrige ?? this.tableauCourant(plan);
    return safeHtml`
      <section class="fp-carte fp-scene fp-table-build__atelier">
        ${this.consignes(plan)}
        ${this.tableau(tableau, corrige === null ? 'lecture' : 'correction')}
        ${corrige !== null && !this.toutCorrige() ? VIDE : this.soldeFinal(tableau)}
      </section>
    `;
  }

  protected atelier(plan: TableBuildPlanPublic): EscapedHtml {
    const tableau = this.tableauCourant(plan);
    const corrige = this.corrigeVisible();
    return safeHtml`
      <section class="fp-carte fp-scene fp-table-build__atelier">
        <p class="fp-table-build__consigne">${escapeHtml(this.texte(this.consigne()))}</p>
        ${this.consignes(plan)}
        ${this.tableau(tableau, 'saisie')}
        ${this.soldeFinal(tableau)}
        ${this.synthese(tableau)}
        ${this.actionsDeProduction()}
        ${this.suiviDeProduction(
          { justes: this.lignesJustes(), total: this.lignesVerifiees() },
          corrige === null ? VIDE : this.tableau(corrige, 'correction'),
        )}
      </section>
    `;
  }

  protected brancherLAtelier(racine: ShadowRoot): void {
    for (const champ of racine.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      '[data-role]',
    )) {
      this.brancher(champ);
    }
  }

  protected relacherLaSaisie(): void {
    this.suivie = null;
  }

  protected effacerLaSaisie(): void {
    this.relacherLaSaisie();
    this.tapees = {};
    this.evalue = null;
    this.repartirDe(this.tapees);
  }

  private tableauCourant(plan: TableBuildPlanPublic): TableauEvalue {
    return this.evalue ?? plan.tableauInitial;
  }

  private corrigeVisible(): TableauEvalue | null {
    return this.correction >= 1 ? tableauCorrigeDe(this.corrigeServi) : null;
  }

  private colonneCorrigee(colonne: TableColonne): boolean {
    const rang = colonnesACorriger({ colonnes: this.colonnes() }).findIndex(
      (candidate) => candidate.cle === colonne.cle,
    );
    return rang < this.correction;
  }

  private toutCorrige(): boolean {
    return this.correction >= colonnesACorriger({ colonnes: this.colonnes() }).length;
  }

  private brancher(champ: HTMLInputElement | HTMLSelectElement): void {
    const cle = cleDeCellule(champ.dataset['rang'] ?? '', champ.dataset['cle'] ?? '');
    champ.addEventListener('focus', () => this.rejoindre(cle));
    if (champ.dataset['role'] === 'saisie') {
      champ.disabled = !this.celluleAccessible(cle);
      champ.addEventListener('input', () =>
        this.noter(cle, champ.value, champ instanceof HTMLSelectElement),
      );
      champ.addEventListener('keydown', (evenement) => this.auClavier(evenement));
    }
    if (cle === this.suivie && !champ.disabled) {
      champ.focus();
      if (champ instanceof HTMLInputElement) {
        champ.setSelectionRange(champ.value.length, champ.value.length);
      }
    }
  }

  private rejoindre(cle: string): void {
    if (cle === this.suivie) {
      return;
    }
    this.suivie = cle;
    this.demanderSiNouvelles();
  }

  private auClavier(evenement: Event): void {
    if (!(evenement instanceof KeyboardEvent) || evenement.key !== 'Enter') {
      return;
    }
    evenement.preventDefault();
    this.demanderSiNouvelles();
  }

  private noter(cle: string, valeur: string, aussitot: boolean): void {
    if (!this.celluleAccessible(cle)) {
      return;
    }
    this.tapees = { ...this.tapees, [cle]: valeur };
    this.suivie = cle;
    this.noterLaSaisie(cle, { ...this.tapees });
    if (aussitot) {
      this.demanderSiNouvelles();
    }
  }

  private demanderSiNouvelles(): void {
    if (!memesSaisies(this.tapees, this.saisiesDemandees)) {
      this.demanderLEvaluation(this.tapees, null, { saisies: this.saisiesTapees() });
    }
  }

  private saisiesTapees(): { rang: number; cle: string; saisie: string }[] {
    return this.cellules().flatMap(({ rang, colonne }) => {
      const saisie = this.tapees[cleDeCellule(rang, colonne.cle)] ?? '';
      return estTexteNonVide(saisie) ? [{ rang, cle: colonne.cle, saisie }] : [];
    });
  }

  private colonnes(): readonly TableColonne[] {
    return this.interne?.colonnes ?? [];
  }

  private consigne(): string {
    return this.colonnes().some((colonne) => colonne.role === 'deduite')
      ? 'table-build-consigne'
      : 'table-build-consigne-saisie';
  }

  private cellules(): readonly { readonly rang: number; readonly colonne: TableColonne }[] {
    return saisiesDuPlan({ echeances: this.interne?.echeances ?? 0, colonnes: this.colonnes() });
  }

  private cellulesASaisir(): string[] {
    return this.cellules().map(({ rang, colonne }) => cleDeCellule(rang, colonne.cle));
  }

  private rangs(): number[] {
    return Array.from({ length: this.interne?.echeances ?? 0 }, (_, rang) => rang);
  }

  private tableau(tableau: TableauEvalue, rendu: RenduDuTableau): EscapedHtml {
    const intitule =
      rendu === 'correction'
        ? `${this.texte('worked-correction')} — ${this.interne?.intitule ?? ''}`
        : (this.interne?.intitule ?? '');
    const marque = marqueDeCorrection(rendu === 'correction' ? true : null);
    const rangs = this.rangs();
    return safeHtml`
      ${dansUnDefileur(safeHtml`
        <table class="fp-table-build__tableau" data-testid="${escapeHtml(rendu === 'correction' ? 'tableau-corrige' : 'tableau')}"${marque}>
          <caption class="fp-table-build__intitule">${escapeHtml(intitule)}</caption>
          <thead><tr>${this.enteteRang()}${this.colonnes().map((colonne) => this.entete(colonne))}</tr></thead>
          <tbody>${rangs.map((rang) => this.ligne(tableau, rang, rendu))}</tbody>
          <tfoot>${this.ligneDesTotaux(tableau, rendu)}</tfoot>
        </table>
      `)}
      ${rangs.length === 0 ? this.vide() : VIDE}
    `;
  }

  private vide(): EscapedHtml {
    return safeHtml`<p class="fp-table-build__vide" data-testid="vide">${escapeHtml(this.texte('table-build-vide'))}</p>`;
  }

  private enteteRang(): EscapedHtml {
    const intitule = this.interne?.intituleDesLignes ?? this.texte('table-build-echeance');
    return safeHtml`<th class="fp-table-build__entete" scope="col" data-testid="entete-rang">${escapeHtml(intitule)}</th>`;
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

  private libellesLignes(): readonly string[] {
    return this.interne?.libellesLignes ?? [];
  }

  private ligne(tableau: TableauEvalue, rang: number, rendu: RenduDuTableau): EscapedHtml {
    return safeHtml`
      <tr class="fp-table-build__ligne" data-testid="ligne" data-rang="${rang}">
        <th class="${escapeHtml(STYLE_RANG)}" scope="row" id="${escapeHtml(PREFIXE_LIGNE + rang)}">${escapeHtml(libelleDeLigne(this.libellesLignes(), rang))}</th>
        ${this.colonnes().map((colonne) => this.cellule(colonne, rang, valeurServie(tableau, rang, colonne.cle), rendu))}
      </tr>
    `;
  }

  private detailDeLaCellule(rang: number, cle: string): DetailDeVerdict | null {
    return this.detailDe(cleDeCellule(rang, cle));
  }

  private cellule(
    colonne: TableColonne,
    rang: number,
    valeur: ValeurAffichee,
    rendu: RenduDuTableau,
  ): EscapedHtml {
    const portes = `${PREFIXE_COLONNE}${colonne.cle} ${PREFIXE_LIGNE}${rang}`;
    const saisie = rendu === 'saisie';
    const contenu = saisie
      ? this.champ(colonne, rang, valeur)
      : this.lecture(colonne, rang, valeur, rendu);
    const detail = saisie ? this.detailDeLaCellule(rang, colonne.cle) : null;
    const etat = detail === null ? VIDE : this.etatDuDetail(detail);
    return safeHtml`<td class="${escapeHtml(STYLE_CELLULE)}" headers="${escapeHtml(portes)}" ${etat}>${contenu}</td>`;
  }

  private masquee(colonne: TableColonne, rendu: RenduDuTableau): boolean {
    return rendu === 'correction' && !this.colonneCorrigee(colonne);
  }

  private lecture(
    colonne: TableColonne,
    rang: number,
    valeur: ValeurAffichee,
    rendu: RenduDuTableau,
  ): EscapedHtml {
    const affichee = this.masquee(colonne, rendu) ? TIRET : this.affichage(colonne, valeur);
    return safeHtml`<span data-testid="cellule" data-rang="${rang}" data-cle="${escapeHtml(colonne.cle)}">${escapeHtml(affichee)}</span>`;
  }

  private affichage(colonne: TableColonne, valeur: ValeurAffichee): string {
    return estBooleenne(colonne) ? this.valeurDeVerite(colonne, valeur.valeur) : valeur.affichage;
  }

  private valeurDeVerite(colonne: TableColonne, valeur: number | null): string {
    if (valeur === 1 || valeur === 0) {
      return this.texte(valeur === 1 ? 'table-build-vrai' : 'table-build-faux');
    }
    return this.surPapier() && colonne.role === 'saisie'
      ? this.texte('table-build-a-entourer')
      : TIRET;
  }

  private choixDeVerite(colonne: TableColonne, rang: number, enonce: string): EscapedHtml {
    const choisie = this.tapees[cleDeCellule(rang, colonne.cle)] ?? '';
    const option = (valeur: string, libelle: string): EscapedHtml =>
      safeHtml`<option value="${escapeHtml(valeur)}" ${valeur === choisie ? SELECTIONNEE : VIDE}>${escapeHtml(libelle)}</option>`;
    return safeHtml`<select class="fp-table-build__choix" data-testid="cellule" data-role="saisie" data-rang="${rang}" data-cle="${escapeHtml(colonne.cle)}" aria-label="${escapeHtml(enonce)}">${option('', TIRET)}${option('1', this.texte('table-build-vrai'))}${option('0', this.texte('table-build-faux'))}</select>`;
  }

  private champ(colonne: TableColonne, rang: number, valeur: ValeurAffichee): EscapedHtml {
    const saisie = colonne.role === 'saisie';
    const enonce = enonceDeCellule(this.libellesLignes(), rang, colonne.intitule);
    if (saisie && estBooleenne(colonne)) {
      return this.choixDeVerite(colonne, rang, enonce);
    }
    const affichee = saisie
      ? (this.tapees[cleDeCellule(rang, colonne.cle)] ?? '')
      : this.affichage(colonne, valeur);
    return safeHtml`<input class="fp-table-build__champ fp-montant" data-testid="cellule" data-role="${escapeHtml(colonne.role)}" data-rang="${rang}" data-cle="${escapeHtml(colonne.cle)}" type="text" inputmode="decimal" autocomplete="off" aria-label="${escapeHtml(enonce)}" value="${escapeHtml(affichee)}" ${saisie ? VIDE : LECTURE_SEULE}>`;
  }

  private ligneDesTotaux(tableau: TableauEvalue, rendu: RenduDuTableau): EscapedHtml {
    if (
      (this.interne?.synthese.length ?? 0) > 0 ||
      !this.colonnes().some((colonne) => colonne.totalise)
    ) {
      return VIDE;
    }
    return safeHtml`
      <tr class="fp-table-build__totaux" data-testid="totaux">
        <th class="${escapeHtml(STYLE_RANG)}" scope="row">${escapeHtml(this.texte('table-build-totaux'))}</th>
        ${this.colonnes().map((colonne) => this.celluleDeTotal(colonne, tableau, rendu))}
      </tr>
    `;
  }

  private celluleDeTotal(
    colonne: TableColonne,
    tableau: TableauEvalue,
    rendu: RenduDuTableau,
  ): EscapedHtml {
    const servi = Object.hasOwn(tableau.totaux, colonne.cle)
      ? tableau.totaux[colonne.cle].affichage
      : TIRET;
    const visible = this.masquee(colonne, rendu) ? TIRET : servi;
    const total = colonne.totalise ? visible : '';
    return safeHtml`<td class="${escapeHtml(STYLE_CELLULE)}" data-testid="total" data-cle="${escapeHtml(colonne.cle)}">${escapeHtml(total)}</td>`;
  }

  private soldeFinal(tableau: TableauEvalue): EscapedHtml {
    const avecSolde = this.colonnes().some((colonne) => colonne.soldeDe !== undefined);
    if (!avecSolde || tableau.soldeFinal === null || this.rangs().length === 0) {
      return VIDE;
    }
    return safeHtml`<p class="fp-table-build__solde fp-montant" data-testid="solde">${escapeHtml(this.texte('table-build-solde'))} ${escapeHtml(tableau.soldeFinal.affichage)}</p>`;
  }

  private synthese(tableau: TableauEvalue): EscapedHtml {
    const elements = this.interne?.synthese ?? [];
    if (elements.length === 0) {
      return VIDE;
    }
    const lignes = elements.map(
      (element, rang) =>
        safeHtml`<div class="fp-table-build__resultat" data-testid="synthese-ligne"><dt>${escapeHtml(element.libelle)}</dt><dd class="fp-montant">${escapeHtml((tableau.synthese[rang] ?? ABSENTE).affichage)}</dd></div>`,
    );
    return safeHtml`<section class="fp-table-build__synthese" data-testid="synthese"><h3 class="fp-table-build__titre">${escapeHtml(this.texte('table-build-synthese'))}</h3><dl>${lignes}</dl></section>`;
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

  private relever(tableau: TableauEvalue): SaisieDeTableau[] {
    return this.cellules().flatMap(({ rang, colonne }) => {
      const tapee = this.tapees[cleDeCellule(rang, colonne.cle)] ?? '';
      const { valeur } = valeurServie(tableau, rang, colonne.cle);
      return estTexteNonVide(tapee) && valeur !== null && Number.isFinite(valeur)
        ? [{ rang, cle: colonne.cle, valeur }]
        : [];
    });
  }

  protected valider(): void {
    if (!this.validable()) {
      return;
    }
    if (this.saisiesTapees().length === 0) {
      this.refuserLEnvoi(this.texte('production-vide'));
      return;
    }
    if (this.evalueAuPoste() && !memesSaisies(this.tapees, this.saisiesEvaluees)) {
      this.validationDifferee = true;
      this.demanderSiNouvelles();
      return;
    }
    const plan = this.planAValider();
    if (plan === null) {
      return;
    }
    if (!this.evalueAuPoste()) {
      this.conclure({ planId: plan.id, saisies: [] });
      return;
    }
    const saisies = this.relever(this.tableauCourant(plan));
    if (saisies.length < this.cellulesASaisir().length) {
      this.refuserLEnvoi(this.texte('table-build-cellule-vide'));
      return;
    }
    this.conclure({ planId: plan.id, saisies });
  }
}
