import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { type ContenuDeBrique, copierLeSocle } from './projection';

export interface QuoteCitation extends ContenuDeBrique {
  readonly texte: string;
  readonly auteur: string | null;
  readonly source: string | null;
}

function renseigne(valeur: string | null): valeur is string {
  return valeur !== null && valeur.trim().length > 0;
}

export class FpQuote extends FpBlock {
  private interne: QuoteCitation | null = null;

  set citation(valeur: QuoteCitation | null) {
    this.interne =
      valeur === null
        ? null
        : {
            ...copierLeSocle(valeur),
            texte: valeur.texte,
            auteur: valeur.auteur,
            source: valeur.source,
          };
    this.refreshSiConnecte();
  }

  get citation(): QuoteCitation | null {
    return this.interne;
  }

  render(): EscapedHtml {
    const citation = this.citation;
    if (citation === null) {
      return this.attente();
    }
    return safeHtml`
      <figure class="fp-scene fp-quote__figure">
        <blockquote class="fp-enonce fp-quote__texte" data-testid="texte">${escapeHtml(citation.texte)}</blockquote>
        ${this.attribution(citation)}
      </figure>
    `;
  }

  bind(): void {
    return;
  }

  private attribution(citation: QuoteCitation): EscapedHtml {
    const parts = [citation.auteur, citation.source].filter(renseigne);
    if (parts.length === 0) {
      return safeHtml``;
    }
    return safeHtml`<figcaption class="fp-quote__attribution" data-testid="attribution">${escapeHtml(parts.join(', '))}</figcaption>`;
  }
}
