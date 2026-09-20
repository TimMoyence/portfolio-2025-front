import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import type { CoursCatalogue, EcranContent } from '../../../../cours/content/types';
import { FORMATION_CATALOGUE_PORT } from '../../../core/ports/formation-catalogue.port';
import { SlideComponent, SlideDeckComponent } from '../../../shared/slides';
import { ECRAN_VERROUILLE, titreDeLEcran } from '../../../shared/slides/session/lecture-ecran';
import { SlideActivityComponent } from '../../../shared/slides/session/slide-activity.component';
import { aUnePresentation } from '../../../shared/slides/visual/presentation-v2';

const SLUG = 'b2-01-traitement-information-chiffree';

interface ResumeDEcran {
  readonly titre: string;
  readonly masque: boolean;
}

interface PublicationDuCours {
  readonly version: number;
  readonly publieLe: string;
}

function publicationDe(cours: CoursCatalogue): PublicationDuCours | null {
  return Number.isFinite(cours.version) &&
    typeof cours.publieLe === 'string' &&
    cours.publieLe !== ''
    ? { version: cours.version, publieLe: cours.publieLe }
    : null;
}

@Component({
  selector: 'app-b2-01-traitement-information-chiffree',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, SlideComponent, SlideDeckComponent, SlideActivityComponent],
  templateUrl: './b2-01-traitement-information-chiffree.component.html',
  styleUrl: './b2-01-traitement-information-chiffree.component.scss',
})
export class B2TraitementInformationChiffreeComponent implements OnInit {
  protected readonly etat = signal<'chargement' | 'pret' | 'vide' | 'erreur'>('chargement');
  protected readonly ecrans = signal<readonly EcranContent[]>([]);
  protected readonly publication = signal<PublicationDuCours | null>(null);

  private readonly catalogue = inject(FORMATION_CATALOGUE_PORT);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.charger();
  }

  protected charger(): void {
    this.etat.set('chargement');
    this.catalogue
      .lire(SLUG)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cours) => {
          this.ecrans.set(cours.ecrans);
          this.publication.set(publicationDe(cours));
          this.etat.set(cours.ecrans.length > 0 ? 'pret' : 'vide');
        },
        error: () => this.etat.set('erreur'),
      });
  }

  protected resume(ecran: EcranContent): ResumeDEcran | null {
    const titre = ecran.titre ?? null;
    if (titre === null || titre === '' || ecran.type === ECRAN_VERROUILLE) {
      return null;
    }
    if (!aUnePresentation(ecran)) {
      return { titre, masque: false };
    }
    return titreDeLEcran({ ...ecran, titre: null }) === titre ? null : { titre, masque: true };
  }
}
