import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpEnvoiJuge } from './contenu';
import { estVerdictDeReponse, type VerdictDeReponse } from './retours';

export abstract class FpReponse<Question extends { readonly id: string }> extends FpEnvoiJuge<
  Question,
  VerdictDeReponse
> {
  protected bonneReponse: string | null = null;

  protected abstract rendreLaQuestion(question: Question): EscapedHtml;

  protected estVerdict(valeur: unknown): valeur is VerdictDeReponse {
    return estVerdictDeReponse(valeur);
  }

  render(): EscapedHtml {
    return this.interne === null ? this.attente() : this.rendreLaQuestion(this.interne);
  }

  protected suiviDeLEnvoi(): EscapedHtml {
    return safeHtml`<p aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
        ${this.verdictDeReponse(this.interneVerdict)}
        ${this.annonces()}`;
  }
}
