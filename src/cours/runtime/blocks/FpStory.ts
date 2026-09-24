import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, escapeUrl, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { projeterMetadonnees } from './projection';

export interface StoryVideo {
  readonly src: string;
  readonly srcPoste?: string;
  readonly type: 'video/webm' | 'video/mp4';
  readonly titre: string;
  readonly poster?: string;
  readonly transcript: string;
  readonly source: string;
  readonly licence: string;
  readonly sousTitres?: {
    readonly src: string;
    readonly srclang: string;
    readonly libelle: string;
  };
  readonly preload?: 'none' | 'metadata';
}

export interface StoryRecit {
  readonly id: string;
  readonly titre: string;
  readonly paragraphes: readonly string[];
  readonly visuel?: {
    readonly src: string;
    readonly alt: string;
    readonly legende?: string;
    readonly source?: string;
  };
  readonly video?: StoryVideo;
  readonly metadonnees: MetadonneesBrique;
}

const VIDE = safeHtml``;

function copierVideo(video: StoryVideo): StoryVideo {
  return {
    ...video,
    ...(video.sousTitres === undefined ? {} : { sousTitres: { ...video.sousTitres } }),
  };
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
            video: valeur.video === undefined ? undefined : copierVideo(valeur.video),
            metadonnees: projeterMetadonnees(valeur.metadonnees),
          };
    this.refreshSiConnecte();
  }

  get recit(): StoryRecit | null {
    return this.interne;
  }

  render(): EscapedHtml {
    const recit = this.recit;
    if (recit === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('chargement'))}</p>`;
    }
    return safeHtml`
      <aside class="fp-scene fp-story__recit">
        <h2 class="fp-enonce fp-story__titre" data-testid="titre">${escapeHtml(recit.titre)}</h2>
        ${this.visuel(recit)}
        ${this.video(recit)}
        <div class="fp-prose fp-story__corps">${recit.paragraphes.map((texte) => this.paragraphe(texte))}</div>
      </aside>
    `;
  }

  bind(): void {
    return;
  }

  private paragraphe(texte: string): EscapedHtml {
    return safeHtml`<p class="fp-story__paragraphe" data-testid="paragraphe">${escapeHtml(texte)}</p>`;
  }

  private visuel(recit: StoryRecit): EscapedHtml {
    if (recit.visuel === undefined) {
      return VIDE;
    }
    return safeHtml`
        <figure class="fp-story__visuel" data-testid="visuel">
        <img src="${escapeUrl(recit.visuel.src)}" alt="${escapeHtml(recit.visuel.alt)}" loading="eager" />
        ${this.attribution(recit.visuel)}
      </figure>
    `;
  }

  private attribution(visuel: NonNullable<StoryRecit['visuel']>): EscapedHtml {
    if (visuel.legende === undefined && visuel.source === undefined) {
      return VIDE;
    }
    const legende =
      visuel.legende === undefined ? VIDE : safeHtml`<span>${escapeHtml(visuel.legende)}</span>`;
    const source =
      visuel.source === undefined
        ? VIDE
        : safeHtml`<a data-testid="source-visuel" href="${escapeUrl(visuel.source)}" target="_blank" rel="noreferrer">${escapeHtml(this.texte('story-source-visuel'))}</a>`;
    return safeHtml`<figcaption>${legende}${source}</figcaption>`;
  }

  private sourceDeLaVideo(video: StoryVideo): string {
    return !this.presentateur() && video.srcPoste !== undefined ? video.srcPoste : video.src;
  }

  private piste(video: StoryVideo): EscapedHtml {
    const sousTitres = video.sousTitres;
    if (sousTitres === undefined) {
      return VIDE;
    }
    const libelle =
      sousTitres.libelle.trim().length > 0 ? sousTitres.libelle : this.texte('video-sous-titres');
    return safeHtml`<track data-testid="sous-titres" kind="captions" srclang="${escapeHtml(sousTitres.srclang)}" label="${escapeHtml(libelle)}" src="${escapeUrl(sousTitres.src)}" default />`;
  }

  private video(recit: StoryRecit): EscapedHtml {
    const video = recit.video;
    if (video === undefined) {
      return VIDE;
    }
    const affiche =
      video.poster === undefined ? VIDE : safeHtml` poster="${escapeUrl(video.poster)}"`;
    return safeHtml`
      <figure class="fp-story__video" data-testid="video">
        <figcaption class="fp-story__video-titre">${escapeHtml(video.titre)}</figcaption>
        <video controls preload="${escapeHtml(video.preload ?? 'none')}" playsinline${affiche}>
          <source src="${escapeUrl(this.sourceDeLaVideo(video))}" type="${escapeHtml(video.type)}" />
          ${this.piste(video)}
        </video>
        <details class="fp-story__transcription">
          <summary>${escapeHtml(this.texte('video-transcription'))}</summary>
          <p data-testid="transcription">${escapeHtml(video.transcript)}</p>
        </details>
        <p class="fp-story__licence"><a href="${escapeUrl(video.source)}" target="_blank" rel="noreferrer">${escapeHtml(this.texte('story-source-media'))}</a> · ${escapeHtml(video.licence)}</p>
      </figure>
    `;
  }
}
