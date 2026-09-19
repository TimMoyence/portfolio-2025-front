import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { projeterMetadonnees } from './projection';

export interface ProCas {
  readonly id: string;
  readonly metier: string;
  readonly situation: string;
  readonly geste: string;
  readonly consequence: string | null;
  readonly metadonnees: MetadonneesBrique;
}

export class FpPro extends FpBlock {
  private interne: ProCas | null = null;

  set cas(valeur: ProCas | null) {
    this.interne =
      valeur === null
        ? null
        : {
            id: valeur.id,
            metier: valeur.metier,
            situation: valeur.situation,
            geste: valeur.geste,
            consequence: valeur.consequence,
            metadonnees: projeterMetadonnees(valeur.metadonnees),
          };
    this.refreshSiConnecte();
  }

  get cas(): ProCas | null {
    return this.interne;
  }

  renderHand(): EscapedHtml {
    if (this.cas === null) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    return this.dossier('fp-carte', 'fp-pro__geste-texte', safeHtml``);
  }

  renderStage(): EscapedHtml {
    if (this.cas === null) {
      return safeHtml``;
    }
    return this.dossier('fp-scene', 'fp-enonce fp-pro__geste-texte', safeHtml``);
  }

  renderBoard(): EscapedHtml {
    const cas = this.cas;
    if (cas === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    const reperes = safeHtml`<div class="fp-pro__reperes">${this.reperes(cas.metadonnees)}</div>`;
    return this.dossier('fp-carte', 'fp-pro__geste-texte', reperes);
  }

  bind(): void {
    return;
  }

  private dossier(cadre: string, styleGeste: string, reperes: EscapedHtml): EscapedHtml {
    const cas = this.cas;
    if (cas === null) {
      return safeHtml``;
    }
    return safeHtml`
      <aside class="${escapeHtml(cadre)} fp-pro__cas">
        <p class="fp-badge fp-pro__metier" data-testid="metier">${escapeHtml(cas.metier)}</p>
        <div class="fp-prose fp-pro__corps">
          <p class="fp-pro__situation" data-testid="situation">${escapeHtml(cas.situation)}</p>
          <div class="fp-encadre fp-pro__geste">
            <h3 class="fp-pro__intitule">${escapeHtml(this.texte('pro-geste'))}</h3>
            <p class="${escapeHtml(styleGeste)}" data-testid="geste">${escapeHtml(cas.geste)}</p>
          </div>
          ${this.consequence(cas)}
        </div>
        ${reperes}
      </aside>
    `;
  }

  private consequence(cas: ProCas): EscapedHtml {
    const retombee = cas.consequence;
    if (retombee === null || retombee.trim().length === 0) {
      return safeHtml``;
    }
    return safeHtml`<p class="fp-pro__consequence" data-testid="consequence">${escapeHtml(this.texte('pro-consequence'))} ${escapeHtml(retombee)}</p>`;
  }
}
