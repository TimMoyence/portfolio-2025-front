import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { estObjet, estVerdictDeProduction, type VerdictDeProduction } from './retours';

type TypeDeChamp = 'string' | 'number';

export function lireAttendusDuCorrige<Attendu>(
  valeur: unknown,
  type: string,
  champs: Readonly<Record<keyof Attendu & string, TypeDeChamp>>,
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

export abstract class FpProduction<Plan extends { readonly id: string }, Attendu> extends FpBlock {
  protected interne: Plan | null = null;
  protected interneVerdict: VerdictDeProduction | null = null;
  protected attendus: readonly Attendu[] = [];
  protected message = '';
  protected soumis = false;

  protected abstract readonly evenementDeSoumission: string;

  protected abstract lireLesAttendus(valeur: unknown): readonly Attendu[];

  protected abstract relacherLaSaisie(): void;

  protected abstract reinitialiserLaSaisie(): void;

  protected poserLePlan(valeur: Plan | null, copier: (plan: Plan) => Plan): void {
    const change = (valeur?.id ?? null) !== (this.interne?.id ?? null);
    this.interne = valeur === null ? null : copier(valeur);
    if (change) {
      this.repartirDeZero();
    }
    this.refreshSiConnecte();
  }

  protected repartirDeZero(): void {
    this.reinitialiserLaSaisie();
    this.message = '';
    this.soumis = false;
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
    this.attendus = this.lireLesAttendus(valeur);
    this.refreshSiConnecte();
  }

  protected verrouille(): boolean {
    return this.verrouilleApresEnvoi(this.soumis, this.interneVerdict !== null);
  }

  protected conclure(detail: Readonly<Record<string, unknown>>): void {
    this.soumis = true;
    this.relacherLaSaisie();
    this.message = this.messageApresEnvoi();
    this.emit(this.evenementDeSoumission, { ...detail, dureeMs: this.depuisAffichage() });
    this.refresh();
  }

  protected refuserLEnvoi(cleDuMotif: string): void {
    this.message = this.texte(cleDuMotif);
    this.refresh();
  }

  protected neSaitPas(): void {
    const plan = this.interne;
    if (plan !== null && !this.verrouille()) {
      this.conclure({ planId: plan.id, neSaitPas: true });
    }
  }
}

export abstract class FpProductionEtayee<
  Plan extends { readonly id: string },
  Attendu,
> extends FpProduction<Plan, Attendu> {
  protected correction = 0;
  protected reprises: ReadonlySet<string> = new Set();

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

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.interne?.id ?? null);
    if (!this.presentateur()) {
      this.brancherLAtelier(racine);
    }
  }

  protected consignesNumerotees(consignes: readonly string[], classe: string): EscapedHtml {
    if (consignes.length === 0) {
      return escapeHtml('');
    }
    const lignes = consignes.map((consigne) => safeHtml`<li>${escapeHtml(consigne)}</li>`);
    return safeHtml`<ol class="${escapeHtml(classe)}" data-testid="consignes">${lignes}</ol>`;
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
