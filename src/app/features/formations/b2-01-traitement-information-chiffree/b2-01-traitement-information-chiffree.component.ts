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
import type { EcranContent } from '../../../../cours/content/types';
import { FORMATION_CATALOGUE_PORT } from '../../../core/ports/formation-catalogue.port';
import { SlideComponent, SlideDeckComponent } from '../../../shared/slides';
import { SlideVisualComponent } from '../../../shared/slides/visual/slide-visual.component';

const SLUG = 'b2-01-traitement-information-chiffree';

@Component({
  selector: 'app-b2-01-traitement-information-chiffree',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SlideComponent, SlideDeckComponent, SlideVisualComponent],
  templateUrl: './b2-01-traitement-information-chiffree.component.html',
  styleUrl: './b2-01-traitement-information-chiffree.component.scss',
})
export class B2TraitementInformationChiffreeComponent implements OnInit {
  protected readonly etat = signal<'chargement' | 'pret' | 'vide' | 'erreur'>('chargement');
  protected readonly ecrans = signal<readonly EcranContent[]>([]);

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
          this.etat.set(cours.ecrans.length > 0 ? 'pret' : 'vide');
        },
        error: () => this.etat.set('erreur'),
      });
  }
}
