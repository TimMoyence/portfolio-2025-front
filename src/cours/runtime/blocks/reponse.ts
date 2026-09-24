import { FpBlock } from './FpBlock';
import { estVerdictDeReponse, type VerdictDeReponse } from './retours';

export abstract class FpReponse<Question extends { readonly id: string }> extends FpBlock {
  protected interne: Question | null = null;
  protected interneVerdict: VerdictDeReponse | null = null;
  protected message = '';
  protected envoye = false;

  protected abstract effacerLaReponse(): void;

  set verdict(valeur: VerdictDeReponse | null) {
    this.interneVerdict =
      estVerdictDeReponse(valeur) && valeur.questionId === this.interne?.id ? valeur : null;
    this.refreshSiConnecte();
  }

  get verdict(): VerdictDeReponse | null {
    return this.interneVerdict;
  }

  protected poserLaQuestion(
    valeur: Question | null,
    projeter: (source: Question) => Question,
  ): void {
    const change = (valeur?.id ?? null) !== (this.interne?.id ?? null);
    this.interne = valeur === null ? null : projeter(valeur);
    if (change) {
      this.effacerLaReponse();
      this.message = '';
      this.envoye = false;
      this.interneVerdict = null;
    }
  }

  protected verrouille(): boolean {
    return this.verrouilleApresEnvoi(this.envoye, this.interneVerdict !== null);
  }
}
