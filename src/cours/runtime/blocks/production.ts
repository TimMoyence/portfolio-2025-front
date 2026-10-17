import type { Decompte } from '../../content/types';
import { DESACTIVE, type EscapedHtml, escapeHtml, safeHtml, VIDE } from '../core/html';
import { FpEnvoiJuge } from './contenu';
import { estObjet } from '../core/valeurs';
import { type DetailDeVerdict, estVerdictDeProduction, type VerdictDeProduction } from './retours';
import { type ContenuDeBrique, copierLeSocle } from './projection';

type TypeDeChamp = 'string' | 'number' | 'valeur';

type Saisies = Readonly<Record<string, string>>;

const GENRES_DE_VALEUR: ReadonlySet<string> = new Set(['number', 'string', 'boolean']);

let rangDeLaDerniereDemande = 0;

function rangDeDemandeSuivant(): number {
  rangDeLaDerniereDemande += 1;
  return rangDeLaDerniereDemande;
}

export function memesSaisies(gauche: Saisies, droite: Saisies): boolean {
  const noms = new Set([...Object.keys(gauche), ...Object.keys(droite)]);
  return [...noms].every((nom) => (gauche[nom] ?? '') === (droite[nom] ?? ''));
}

function estDuType(champ: unknown, genre: TypeDeChamp): boolean {
  return genre === 'valeur' ? GENRES_DE_VALEUR.has(typeof champ) : typeof champ === genre;
}

export interface LectureDuCorrige<Attendu> {
  readonly type: string;
  readonly champs: Readonly<Record<keyof Attendu & string, TypeDeChamp>>;
}

function lireAttendusDuCorrige<Attendu>(
  valeur: unknown,
  { type, champs }: LectureDuCorrige<Attendu>,
): readonly Attendu[] {
  if (!estObjet(valeur) || valeur['type'] !== type || !Array.isArray(valeur['attendus'])) {
    return [];
  }
  const attendus: readonly unknown[] = valeur['attendus'];
  const exigences: readonly [string, TypeDeChamp][] = Object.entries(champs);
  return attendus.filter(
    (attendu): attendu is Attendu =>
      estObjet(attendu) && exigences.every(([champ, genre]) => estDuType(attendu[champ], genre)),
  );
}

export abstract class FpProduction<
  Plan extends { readonly id: string },
  Attendu,
> extends FpEnvoiJuge<Plan, VerdictDeProduction> {
  protected attendus: readonly Attendu[] = [];
  protected corrigeServi: unknown = null;

  protected abstract readonly evenementDeSoumission: string;

  protected abstract readonly lectureDuCorrige: LectureDuCorrige<Attendu>;

  protected abstract relacherLaSaisie(): void;

  protected poserLePlan(valeur: Plan | null, copier: (plan: Plan) => Plan): void {
    this.poserLeContenu(valeur, copier);
    this.refreshSiConnecte();
  }

  protected estVerdict(valeur: unknown): valeur is VerdictDeProduction {
    return estVerdictDeProduction(valeur);
  }

  set corrige(valeur: unknown) {
    this.corrigeServi = valeur;
    this.attendus = lireAttendusDuCorrige(valeur, this.lectureDuCorrige);
    this.refreshSiConnecte();
  }

  protected detailDe(cle: string): DetailDeVerdict | null {
    return this.interneVerdict?.details.find((detail) => detail.cle === cle) ?? null;
  }

  protected justes(): number {
    return this.interneVerdict?.details.filter((detail) => detail.juste).length ?? 0;
  }

  protected conclure(detail: Readonly<Record<string, unknown>>): void {
    this.relacherLaSaisie();
    this.conclureLEnvoi(this.evenementDeSoumission, detail);
  }

  protected neSaitPas(): void {
    const plan = this.interne;
    if (plan !== null && !this.verrouille()) {
      this.conclure({ planId: plan.id, neSaitPas: true });
    }
  }
}

export interface PlanEtaye extends ContenuDeBrique {
  readonly intitule: string;
  readonly consignes?: readonly string[];
}

export function copierLEnonce(source: PlanEtaye): PlanEtaye {
  return {
    ...copierLeSocle(source),
    intitule: source.intitule,
    consignes: (source.consignes ?? []).filter((consigne) => typeof consigne === 'string'),
  };
}

abstract class FpProductionEtayee<Plan extends PlanEtaye, Attendu> extends FpProduction<
  Plan,
  Attendu
> {
  protected correction = 0;
  protected reprises: ReadonlySet<string> = new Set();

  protected abstract readonly bloc: string;

  set etayage(valeur: number) {
    this.correction = valeur;
    this.refreshSiConnecte();
  }

  protected abstract scene(plan: Plan): EscapedHtml;

  protected abstract atelier(plan: Plan): EscapedHtml;

  protected abstract brancherLAtelier(racine: ShadowRoot): void;

  render(): EscapedHtml {
    const plan = this.interne;
    if (plan === null) {
      return this.attente();
    }
    return this.presentateur() || this.surPapier() ? this.scene(plan) : this.atelier(plan);
  }

  protected abstract valider(): void;

  bind(racine: ShadowRoot): void {
    if (!this.suivreEtSaisir(this.interne?.id ?? null)) {
      return;
    }
    this.brancherLAtelier(racine);
    racine
      .querySelector<HTMLButtonElement>('[data-testid="valider"]')
      ?.addEventListener('click', () => this.valider());
    racine
      .querySelector<HTMLButtonElement>('[data-testid="je-ne-sais-pas"]')
      ?.addEventListener('click', () => this.neSaitPas());
  }

  protected actionsDeProduction(avant: EscapedHtml = VIDE): EscapedHtml {
    const bloque = this.verrouille() && !this.enReprise();
    const bloc = escapeHtml(this.bloc);
    return safeHtml`
      <div class="fp-${bloc}__actions">
        ${avant}
        <button type="button" class="fp-${bloc}__valider" data-testid="valider" ${bloque ? DESACTIVE : VIDE}>${escapeHtml(this.texte(this.enReprise() ? 'production-renvoyer' : 'valider'))}</button>
        ${this.boutonNeSaitPas(this.verrouille())}
      </div>
    `;
  }

  protected suiviDeProduction(decompte: Decompte, correctionServie: EscapedHtml): EscapedHtml {
    const cleDuDecompte = `${this.bloc}-verdict`;
    return safeHtml`
      <p class="fp-${escapeHtml(this.bloc)}__retour" aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
      ${this.verdictDeProduction(this.interneVerdict, cleDuDecompte, decompte.justes, decompte.total)}
      ${correctionServie}
      ${this.annonces()}
    `;
  }

  protected consignes(plan: Plan): EscapedHtml {
    const consignes = plan.consignes ?? [];
    if (consignes.length === 0) {
      return VIDE;
    }
    const lignes = consignes.map((consigne) => safeHtml`<li>${escapeHtml(consigne)}</li>`);
    return safeHtml`<ol class="fp-${escapeHtml(this.bloc)}__consignes" data-testid="consignes">${lignes}</ol>`;
  }

  protected override verrouille(): boolean {
    return super.verrouille() || (this.correction > 0 && !this.enApercu());
  }

  protected override repartirDeZero(): void {
    super.repartirDeZero();
    this.reprises = new Set();
  }

  protected enReprise(): boolean {
    return this.correction === 0 && this.interneVerdict !== null && this.reprises.size > 0;
  }

  protected celluleAccessible(cle: string): boolean {
    return !this.verrouille() || (this.correction === 0 && this.detailDe(cle)?.juste === false);
  }

  protected noterLaSaisie(cle: string, brouillon: unknown): void {
    this.message = '';
    if (this.verrouille()) {
      this.reprises = new Set([...this.reprises, cle]);
    }
    this.signalerLeBrouillon(brouillon);
    this.refresh();
  }

  protected validable(): boolean {
    return this.interne !== null && (!this.verrouille() || this.enReprise());
  }

  protected planAValider(): Plan | null {
    const plan = this.interne;
    if (plan === null || !this.validable()) {
      return null;
    }
    this.reprises = new Set();
    return plan;
  }
}

export interface DemandeEnAttente<Complement> {
  readonly rang: number;
  readonly saisies: Saisies;
  readonly complement: Complement;
}

export abstract class FpProductionEvaluee<
  Plan extends PlanEtaye,
  Attendu,
  Evaluation extends { readonly rang: number },
  Complement,
> extends FpProductionEtayee<Plan, Attendu> {
  protected saisiesEvaluees: Saisies = {};
  protected saisiesDemandees: Saisies = {};
  protected enAttente: DemandeEnAttente<Complement> | null = null;
  protected validationDifferee = false;

  protected abstract readonly evenementDEvaluation: string;

  protected abstract recevoirLEvaluation(
    evaluation: Evaluation,
    attente: DemandeEnAttente<Complement>,
  ): void;

  protected abstract validerApresEvaluation(): void;

  set evaluation(valeur: Evaluation | null) {
    const attente = this.enAttente;
    if (valeur === null || attente === null || valeur.rang !== attente.rang) {
      return;
    }
    this.enAttente = null;
    this.saisiesEvaluees = attente.saisies;
    this.recevoirLEvaluation(valeur, attente);
    this.refreshSiConnecte();
    if (this.validationDifferee) {
      this.validationDifferee = false;
      this.validerApresEvaluation();
    }
  }

  protected override appliquerErreur(valeur: string | null): void {
    if (valeur !== null) {
      this.enAttente = null;
      this.validationDifferee = false;
      this.saisiesDemandees = this.saisiesEvaluees;
    }
    super.appliquerErreur(valeur);
  }

  protected evalueAuPoste(): boolean {
    return !this.presentateur() && !this.enApercu() && !this.surPapier();
  }

  protected repartirDe(saisies: Saisies): void {
    this.saisiesEvaluees = saisies;
    this.saisiesDemandees = saisies;
    this.enAttente = null;
    this.validationDifferee = false;
  }

  protected demanderLEvaluation(
    saisies: Saisies,
    complement: Complement,
    detail: Readonly<Record<string, unknown>>,
  ): void {
    const plan = this.interne;
    if (plan === null || !this.evalueAuPoste()) {
      return;
    }
    const rang = rangDeDemandeSuivant();
    this.enAttente = { rang, saisies, complement };
    this.saisiesDemandees = saisies;
    this.emit(this.evenementDEvaluation, { planId: plan.id, rang, ...detail });
  }
}
