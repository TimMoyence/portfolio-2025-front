import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpEnvoi } from './contenu';
import { estVerdictDeReponse, type VerdictDeReponse } from './retours';

export abstract class FpReponse<
  Question extends { readonly id: string },
> extends FpEnvoi<Question> {
  protected interneVerdict: VerdictDeReponse | null = null;
  protected bonneReponse: string | null = null;

  protected abstract rendreLaQuestion(question: Question): EscapedHtml;

  set verdict(valeur: VerdictDeReponse | null) {
    this.interneVerdict =
      estVerdictDeReponse(valeur) && valeur.questionId === this.interne?.id ? valeur : null;
    this.refreshSiConnecte();
  }

  get verdict(): VerdictDeReponse | null {
    return this.interneVerdict;
  }

  render(): EscapedHtml {
    return this.interne === null ? this.attente() : this.rendreLaQuestion(this.interne);
  }

  protected override repartirDeZero(): void {
    super.repartirDeZero();
    this.interneVerdict = null;
  }

  protected override verdictRecu(): boolean {
    return this.interneVerdict !== null;
  }

  protected suiviDeLEnvoi(): EscapedHtml {
    return safeHtml`<p aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
        ${this.verdictDeReponse(this.interneVerdict)}
        ${this.annonces()}`;
  }

  protected bonneReponseRevelee(formater: (bonne: string) => string): EscapedHtml {
    if (this.bonneReponse === null) {
      return escapeHtml('');
    }
    return safeHtml`<p class="fp-encadre" data-etat="confirme" data-testid="bonne-reponse">${escapeHtml(this.texte('bonne-reponse'))} ${escapeHtml(formater(this.bonneReponse))}</p>`;
  }
}
