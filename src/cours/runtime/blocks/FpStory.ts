import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, escapeUrl, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { projeterMetadonnees } from './projection';

export interface StoryRecit {
  readonly id: string;
  readonly titre: string;
  readonly paragraphes: readonly string[];
  readonly visuel?: {
    readonly src: string;
    readonly alt: string;
    readonly legende?: string;
  };
  readonly metadonnees: MetadonneesBrique;
}

export class FpStory extends FpBlock {
  private interne: StoryRecit | null = null;

  set recit(valeur: StoryRecit | null) {
    this.interne =
      valeur === null
        ? null
        : {
            id: valeur.id,
            titre: valeur.titre,
            paragraphes: [...valeur.paragraphes],
            visuel: valeur.visuel === undefined ? undefined : { ...valeur.visuel },
            metadonnees: projeterMetadonnees(valeur.metadonnees),
          };
    this.refreshSiConnecte();
  }

  get recit(): StoryRecit | null {
    return this.interne;
  }

  renderHand(): EscapedHtml {
    if (this.recit === null) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    return this.aparte('fp-carte', 'fp-story__titre', safeHtml``);
  }

  renderStage(): EscapedHtml {
    if (this.recit === null) {
      return safeHtml``;
    }
    return this.aparte('fp-scene', 'fp-enonce fp-story__titre', safeHtml``);
  }

  renderBoard(): EscapedHtml {
    const recit = this.recit;
    if (recit === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    const metadonnees = recit.metadonnees;
    const reperes = safeHtml`
      <div class="fp-story__reperes">
        <span class="fp-badge" data-testid="modalite">${escapeHtml(metadonnees.modalite)}</span>
        <span class="fp-badge" data-testid="duree">${metadonnees.dureeMinutes} min</span>
      </div>
    `;
    return this.aparte('fp-carte', 'fp-story__titre', reperes);
  }

  bind(): void {
    return;
  }

  private aparte(cadre: string, styleTitre: string, reperes: EscapedHtml): EscapedHtml {
    const recit = this.recit;
    if (recit === null) {
      return safeHtml``;
    }
    return safeHtml`
      <aside class="${escapeHtml(cadre)} fp-story__recit">
        <h2 class="${escapeHtml(styleTitre)}" data-testid="titre">${escapeHtml(recit.titre)}</h2>
        ${this.visuel(recit)}
        <div class="fp-prose fp-story__corps">${recit.paragraphes.map((texte) => this.paragraphe(texte))}</div>
        ${reperes}
      </aside>
    `;
  }

  private paragraphe(texte: string): EscapedHtml {
    return safeHtml`<p class="fp-story__paragraphe" data-testid="paragraphe">${escapeHtml(texte)}</p>`;
  }

  private visuel(recit: StoryRecit): EscapedHtml {
    if (recit.visuel === undefined) {
      return safeHtml``;
    }
    return safeHtml`
      <figure class="fp-story__visuel" data-testid="visuel">
        <img src="${escapeUrl(recit.visuel.src)}" alt="${escapeHtml(recit.visuel.alt)}" loading="eager" />
        ${recit.visuel.legende === undefined ? safeHtml`` : safeHtml`<figcaption>${escapeHtml(recit.visuel.legende)}</figcaption>`}
      </figure>
    `;
  }
}
