import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { projeterMetadonnees } from './projection';

export interface QuoteCitation {
  readonly id: string;
  readonly texte: string;
  readonly auteur: string | null;
  readonly source: string | null;
  readonly metadonnees: MetadonneesBrique;
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
            id: valeur.id,
            texte: valeur.texte,
            auteur: valeur.auteur,
            source: valeur.source,
            metadonnees: projeterMetadonnees(valeur.metadonnees),
          };
    this.refreshSiConnecte();
  }

  get citation(): QuoteCitation | null {
    return this.interne;
  }

  render(): EscapedHtml {
    const citation = this.citation;
    if (citation === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('chargement'))}</p>`;
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
