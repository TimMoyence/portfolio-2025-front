import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpEnvoi } from './contenu';
import {
  type DetailDeVerdict,
  estObjet,
  estVerdictDeProduction,
  type VerdictDeProduction,
} from './retours';
import { type ContenuDeBrique, copierLeSocle } from './projection';

type TypeDeChamp = 'string' | 'number';

const VIDE = escapeHtml('');
const DESACTIVE = safeHtml`disabled`;

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
      estObjet(attendu) && exigences.every(([champ, genre]) => typeof attendu[champ] === genre),
  );
}

export abstract class FpProduction<
  Plan extends { readonly id: string },
  Attendu,
> extends FpEnvoi<Plan> {
  protected interneVerdict: VerdictDeProduction | null = null;
  protected attendus: readonly Attendu[] = [];

  protected abstract readonly evenementDeSoumission: string;

  protected abstract readonly lectureDuCorrige: LectureDuCorrige<Attendu>;

  protected abstract relacherLaSaisie(): void;

  protected poserLePlan(valeur: Plan | null, copier: (plan: Plan) => Plan): void {
    this.poserLeContenu(valeur, copier);
    this.refreshSiConnecte();
  }

  protected override repartirDeZero(): void {
    super.repartirDeZero();
    this.interneVerdict = null;
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
    this.attendus = lireAttendusDuCorrige(valeur, this.lectureDuCorrige);
    this.refreshSiConnecte();
  }

  protected override verdictRecu(): boolean {
    return this.interneVerdict !== null;
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

export abstract class FpProductionEtayee<Plan extends PlanEtaye, Attendu> extends FpProduction<
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
    return this.presentateur() ? this.scene(plan) : this.atelier(plan);
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

  protected suiviDeProduction(
    decompte: { readonly justes: number; readonly total: number },
    correctionServie: EscapedHtml,
  ): EscapedHtml {
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

  protected planAValider(): Plan | null {
    const plan = this.interne;
    if (plan === null || (this.verrouille() && !this.enReprise())) {
      return null;
    }
    this.reprises = new Set();
    return plan;
  }
}
