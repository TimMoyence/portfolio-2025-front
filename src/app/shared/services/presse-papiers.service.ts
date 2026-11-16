import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export interface LibellesDeCopie {
  readonly repos: string;
  readonly copie: string;
}

const DUREE_DE_LA_COPIE_MS = 2000;
const DUREE_DE_L_ECHEC_MS = 2500;

@Injectable()
export class PressePapiersService {
  private readonly platformId = inject(PLATFORM_ID);
  private minuterie: ReturnType<typeof setTimeout> | undefined;

  readonly texteCopie = signal<string | null>(null);
  readonly texteEnEchec = signal<string | null>(null);

  readonly libelleDEchec = $localize`:@@formations.toolkitPrivate.copyError:Échec — copiez à la main`;

  libelle(texte: string, { repos, copie }: LibellesDeCopie): string {
    if (this.texteEnEchec() === texte) return this.libelleDEchec;
    if (this.texteCopie() === texte) return copie;
    return repos;
  }

  copier(texte: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const pressePapiers = navigator.clipboard;
    if (!pressePapiers) {
      this.signalerLEchec(texte, new Error('Clipboard API indisponible'));
      return;
    }

    pressePapiers
      .writeText(texte)
      .then(() => this.annoncer(texte, null, DUREE_DE_LA_COPIE_MS))
      .catch((erreur: unknown) => this.signalerLEchec(texte, erreur));
  }

  private signalerLEchec(texte: string, erreur: unknown): void {
    console.error('Echec de copie dans le presse-papier', erreur);
    this.annoncer(null, texte, DUREE_DE_L_ECHEC_MS);
  }

  private annoncer(copie: string | null, echec: string | null, duree: number): void {
    clearTimeout(this.minuterie);
    this.texteCopie.set(copie);
    this.texteEnEchec.set(echec);
    this.minuterie = setTimeout(() => {
      this.texteCopie.set(null);
      this.texteEnEchec.set(null);
    }, duree);
  }
}
