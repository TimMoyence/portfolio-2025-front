import { evaluerExpression } from '../core/formula';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpProductionEtayee, type PlanEtaye, copierLEnonce } from './production';
import { type DetailDeVerdict } from './retours';
import { lireNombreSaisi } from './saisie-numerique';

export type RoleColonne = 'donnee' | 'saisie' | 'deduite';

type RenduDuTableau = 'saisie' | 'lecture' | 'correction';

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

export interface TableBuildPlanPublic extends PlanEtaye {
  readonly consignes: readonly string[];
  readonly echeances: number;
  readonly libellesLignes: readonly string[];
  readonly parametres: Readonly<Record<string, number>>;
  readonly colonnes: readonly TableColonne[];
  readonly synthese: readonly TableSynthese[];
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
const DECIMALES_MAX = 6;
const COLONNE_DES_COEFFICIENTS = 'coef';
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
    ...copierLEnonce(source),
    consignes: [...source.consignes],
    echeances: Number.isFinite(source.echeances) ? Math.max(0, Math.trunc(source.echeances)) : 0,
    libellesLignes: [...source.libellesLignes],
    parametres: nombresFinis(source.parametres),
    colonnes: source.colonnes.map(copierColonne),
    synthese: source.synthese.map((element) => ({ ...element })),
  };
}

export class FpTableBuild extends FpProductionEtayee<TableBuildPlanPublic, SaisieDeTableau> {
  protected readonly evenementDeSoumission = 'fp-table-build-submit';
  protected readonly bloc = 'table-build';
  protected readonly lectureDuCorrige = {
    type: 'tableau',
    champs: { rang: 'number', cle: 'string', valeur: 'number' },
  } as const;
  private tapees: Record<string, string> = {};
  private suivie: string | null = null;

  set plan(valeur: TableBuildPlanPublic | null) {
    this.poserLePlan(valeur, copierPlan);
  }

  get plan(): TableBuildPlanPublic | null {
    return this.interne;
  }

  protected reprendreLeBrouillon(brouillon: Readonly<Record<string, unknown>>): boolean {
    const saisies = new Set(this.cellulesASaisir());
    this.tapees = Object.fromEntries(
      Object.entries(brouillon).filter(
        (entree): entree is [string, string] =>
          saisies.has(entree[0]) && typeof entree[1] === 'string',
      ),
    );
    return true;
  }

  protected scene(plan: TableBuildPlanPublic): EscapedHtml {
    const lignes = this.corrigeVisible()
      ? this.batir((rang, cle) => this.attenduDe(rang, cle))
      : this.batir();
    return safeHtml`
      <section class="fp-carte fp-scene fp-table-build__atelier">
        ${this.consignes(plan)}
        ${this.tableau(lignes, this.corrigeVisible() ? 'correction' : 'lecture')}
        ${this.corrigeVisible() && this.correction < 2 ? VIDE : this.soldeFinal(lignes)}
      </section>
    `;
  }

  protected atelier(plan: TableBuildPlanPublic): EscapedHtml {
    const lignes = this.batir();
    return safeHtml`
      <section class="fp-carte fp-scene fp-table-build__atelier">
        <p class="fp-table-build__consigne">${escapeHtml(this.texte('table-build-consigne'))}</p>
        ${this.consignes(plan)}
        ${this.tableau(lignes, 'saisie')}
        ${this.soldeFinal(lignes)}
        ${this.synthese(lignes)}
        ${this.actionsDeProduction()}
        ${this.suiviDeProduction(
          { justes: this.lignesJustes(), total: this.lignesVerifiees() },
          this.corrigeVisible()
            ? this.tableau(
                this.batir((rang, cle) => this.attenduDe(rang, cle)),
                'correction',
              )
            : VIDE,
        )}
      </section>
    `;
  }

  protected brancherLAtelier(racine: ShadowRoot): void {
    for (const champ of racine.querySelectorAll<HTMLInputElement>('[data-role="saisie"]')) {
      this.brancher(champ);
    }
  }

  protected relacherLaSaisie(): void {
    this.suivie = null;
  }

  protected effacerLaSaisie(): void {
    this.relacherLaSaisie();
    this.tapees = {};
  }

  private corrigeVisible(): boolean {
    return this.correction >= 1 && this.attendus.length > 0;
  }

  private attenduDe(rang: number, cle: string): number {
    return (
      this.attendus.find((attendu) => attendu.rang === rang && attendu.cle === cle)?.valeur ??
      Number.NaN
    );
  }

  private accessible(cle: string): boolean {
    if (!this.verrouille()) {
      return true;
    }
    const [rang, colonne] = cle.split(':');
    return this.correction === 0 && this.detailDeLaCellule(Number(rang), colonne)?.juste === false;
  }

  private brancher(champ: HTMLInputElement): void {
    const cle = `${champ.dataset['rang']}:${champ.dataset['cle']}`;
    champ.disabled = !this.accessible(cle);
    champ.addEventListener('input', () => this.noter(cle, champ.value));
    if (cle === this.suivie && this.accessible(cle)) {
      champ.focus();
      champ.setSelectionRange(champ.value.length, champ.value.length);
    }
  }

  private noter(cle: string, valeur: string): void {
    if (!this.accessible(cle)) {
      return;
    }
    this.tapees = { ...this.tapees, [cle]: valeur };
    this.suivie = cle;
    this.message = '';
    if (this.verrouille()) {
      this.reprises = new Set([...this.reprises, cle]);
    }
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

  private batir(
    lire: (rang: number, cle: string) => number = (rang, cle) => this.saisieDe(rang, cle),
  ): LigneBatie[] {
    const lignes: LigneBatie[] = [];
    let precedente: Record<string, number> | null = null;
    for (let rang = 0; rang < (this.interne?.echeances ?? 0); rang += 1) {
      const valeurs: Record<string, number> = {};
      for (const colonne of this.colonnes()) {
        if (colonne.role === 'donnee') {
          valeurs[colonne.cle] = colonne.valeurs?.[rang] ?? Number.NaN;
        } else if (colonne.role === 'saisie') {
          valeurs[colonne.cle] = lire(rang, colonne.cle);
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

  private tableau(lignes: readonly LigneBatie[], rendu: RenduDuTableau): EscapedHtml {
    const intitule =
      rendu === 'correction'
        ? `${this.texte('worked-correction')} — ${this.interne?.intitule ?? ''}`
        : (this.interne?.intitule ?? '');
    const marque = rendu === 'correction' ? safeHtml`data-correction="juste"` : VIDE;
    return safeHtml`
      <table class="fp-table-build__tableau" data-testid="${escapeHtml(rendu === 'correction' ? 'tableau-corrige' : 'tableau')}" ${marque}>
        <caption class="fp-table-build__intitule">${escapeHtml(intitule)}</caption>
        <thead><tr>${this.enteteRang()}${this.colonnes().map((colonne) => this.entete(colonne))}</tr></thead>
        <tbody>${lignes.map((ligne) => this.ligne(ligne, rendu))}</tbody>
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

  private ligne(ligne: LigneBatie, rendu: RenduDuTableau): EscapedHtml {
    return safeHtml`
      <tr class="fp-table-build__ligne" data-testid="ligne" data-rang="${ligne.rang}">
        <th class="${escapeHtml(STYLE_RANG)}" scope="row" id="${escapeHtml(PREFIXE_LIGNE + ligne.rang)}">${escapeHtml(this.libelleDeLigne(ligne.rang))}</th>
        ${this.colonnes().map((colonne) => this.cellule(colonne, ligne, rendu))}
      </tr>
    `;
  }

  private detailDeLaCellule(rang: number, cle: string): DetailDeVerdict | null {
    return this.detailDe(`${rang}:${cle}`);
  }

  private cellule(colonne: TableColonne, ligne: LigneBatie, rendu: RenduDuTableau): EscapedHtml {
    const portes = `${PREFIXE_COLONNE}${colonne.cle} ${PREFIXE_LIGNE}${ligne.rang}`;
    const saisie = rendu === 'saisie';
    const contenu = saisie ? this.champ(colonne, ligne) : this.lecture(colonne, ligne, rendu);
    const detail = saisie ? this.detailDeLaCellule(ligne.rang, colonne.cle) : null;
    const etat = detail === null ? VIDE : this.etatDuDetail(detail);
    return safeHtml`<td class="${escapeHtml(STYLE_CELLULE)}" headers="${escapeHtml(portes)}" ${etat}>${contenu}</td>`;
  }

  private lecture(colonne: TableColonne, ligne: LigneBatie, rendu: RenduDuTableau): EscapedHtml {
    const masquee =
      rendu === 'correction' &&
      this.correction < 2 &&
      colonne.role !== 'donnee' &&
      colonne.cle !== COLONNE_DES_COEFFICIENTS;
    const affichee = masquee ? TIRET : this.valeurAffichee(colonne, ligne);
    return safeHtml`<span data-testid="cellule" data-rang="${ligne.rang}" data-cle="${escapeHtml(colonne.cle)}">${escapeHtml(affichee)}</span>`;
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
    if (
      (this.interne?.synthese.length ?? 0) > 0 ||
      !this.colonnes().some((colonne) => colonne.totalise)
    ) {
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

  private relever(): SaisieDeTableau[] {
    return this.cellulesASaisir()
      .map((cle) => {
        const [rang, colonne] = cle.split(':');
        return { rang: Number(rang), cle: colonne, valeur: this.saisieDe(Number(rang), colonne) };
      })
      .filter((saisie) => Number.isFinite(saisie.valeur));
  }

  protected valider(): void {
    const plan = this.planAValider();
    if (plan === null) {
      return;
    }
    const saisies = this.relever();
    if (saisies.length === 0) {
      this.refuserLEnvoi(this.texte('production-vide'));
      return;
    }
    if (saisies.length < this.cellulesASaisir().length) {
      this.refuserLEnvoi(this.texte('table-build-cellule-vide'));
      return;
    }
    this.conclure({ planId: plan.id, saisies });
  }
}
