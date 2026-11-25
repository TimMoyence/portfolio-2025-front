import { DOCUMENT, isPlatformServer } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  type OnInit,
  PLATFORM_ID,
  inject,
  input,
} from '@angular/core';
import { variantesDeLargeur } from '../../../images/variantes-de-largeur';
import { LARGEUR_DU_VISUEL } from '../illustration-du-heros/illustration-du-heros.component';

const DOSSIER = '/assets/images/portrait';

const LARGEUR_NATURELLE = 1000;

@Component({
  selector: 'app-portrait',
  standalone: true,
  template: `<img
    [src]="source"
    [attr.srcset]="variantes"
    [attr.sizes]="largeurAffichee"
    [alt]="description"
    width="1000"
    height="1145"
    [attr.fetchpriority]="priorite() ? 'high' : null"
    [attr.loading]="priorite() ? null : 'lazy'"
    decoding="async"
  />`,
  styles: `
    :host {
      display: block;
      aspect-ratio: 4 / 5;
      border-radius: var(--r-xl);
      overflow: hidden;
      border: 1px solid var(--line);
    }

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortraitComponent implements OnInit {
  readonly priorite = input(false);

  private readonly document = inject(DOCUMENT);

  private readonly servi = isPlatformServer(inject(PLATFORM_ID));

  protected readonly source = `${DOSSIER}/${LARGEUR_NATURELLE}.webp`;

  protected readonly variantes = variantesDeLargeur(DOSSIER, LARGEUR_NATURELLE);

  protected readonly largeurAffichee = LARGEUR_DU_VISUEL;

  protected readonly description = $localize`:@@presentationPortraitAlt:Tim Moyence, fondateur d'Asili Design`;

  ngOnInit(): void {
    if (!this.priorite() || !this.servi) return;
    const prechargement = this.document.createElement('link');
    prechargement.setAttribute('rel', 'preload');
    prechargement.setAttribute('as', 'image');
    prechargement.setAttribute('href', this.source);
    prechargement.setAttribute('imagesrcset', this.variantes);
    prechargement.setAttribute('imagesizes', this.largeurAffichee);
    prechargement.setAttribute('fetchpriority', 'high');
    this.document.head.appendChild(prechargement);
  }
}
