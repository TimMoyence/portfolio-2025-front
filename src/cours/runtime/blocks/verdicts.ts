import { FpBlock } from './FpBlock';
import { type VerdictDeReponse, VerdictsParQuestion } from './retours';

export abstract class FpVerdicts extends FpBlock {
  protected recus = new VerdictsParQuestion();

  protected abstract verdictAttendu(questionId: string): boolean;

  set verdicts(valeur: readonly VerdictDeReponse[] | null) {
    this.recus = new VerdictsParQuestion(valeur, (questionId) => this.verdictAttendu(questionId));
    this.verdictsRecus();
  }

  get verdicts(): readonly VerdictDeReponse[] {
    return this.recus.liste();
  }

  protected verdictsRecus(): void {
    this.refreshSiConnecte();
  }
}
