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

  renderHand(): EscapedHtml {
    if (this.citation === null) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    return this.figure('fp-carte', 'fp-quote__texte', safeHtml``);
  }

  renderStage(): EscapedHtml {
    if (this.citation === null) {
      return safeHtml``;
    }
    return this.figure('fp-scene', 'fp-enonce fp-quote__texte', safeHtml``);
  }

  renderBoard(): EscapedHtml {
    const citation = this.citation;
    if (citation === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    const reperes = safeHtml`<p class="fp-reperes">${this.reperes(citation.metadonnees)}</p>`;
    return this.figure('fp-carte', 'fp-quote__texte', reperes);
  }

  bind(): void {
    return;
  }

  private figure(cadre: string, styleTexte: string, reperes: EscapedHtml): EscapedHtml {
    const citation = this.citation;
    if (citation === null) {
      return safeHtml``;
    }
    return safeHtml`
      <figure class="${escapeHtml(cadre)} fp-quote__figure">
        <blockquote class="${escapeHtml(styleTexte)}" data-testid="texte">${escapeHtml(citation.texte)}</blockquote>
        ${this.attribution(citation)}
        ${reperes}
      </figure>
    `;
  }

  private attribution(citation: QuoteCitation): EscapedHtml {
    const parts = [citation.auteur, citation.source].filter(renseigne);
    if (parts.length === 0) {
      return safeHtml``;
    }
    return safeHtml`<figcaption class="fp-quote__attribution" data-testid="attribution">${escapeHtml(parts.join(', '))}</figcaption>`;
  }
}
