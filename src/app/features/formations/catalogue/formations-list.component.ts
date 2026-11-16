import {
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealOnScrollDirective } from '../../../shared/directives/reveal-on-scroll.directive';
import { readInputValue } from '../../../shared/utils/dom-event.utils';
import { FORMATIONS, PARCOURS, type FormationCard, type Parcours } from './formations-list.data';

const formeCherchable = (texte: string): string =>
  texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const texteVisible = ({ badge, title, description, meta, price }: FormationCard): string =>
  formeCherchable([badge, title, description, ...meta.map(({ value }) => value), price].join(' '));

const CHERCHABLES = FORMATIONS.map((carte) => ({ carte, texte: texteVisible(carte) }));

@Component({
  selector: 'app-formations-list',
  standalone: true,
  imports: [RouterLink, RevealOnScrollDirective],
  templateUrl: './formations-list.component.html',
  styleUrl: './formations-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormationsListComponent {
  protected readonly recherche = signal('');

  private readonly trouvees = computed(() => {
    const cherche = formeCherchable(this.recherche());
    return CHERCHABLES.filter(({ texte }) => texte.includes(cherche)).map(({ carte }) => carte);
  });

  protected readonly total = computed(() => this.trouvees().length);

  protected readonly parcours = computed(() =>
    PARCOURS.map((parcours) => ({
      ...parcours,
      cartes: this.trouvees().filter((carte) => carte.parcours === parcours.id),
    })),
  );

  protected readonly choisi = signal<Parcours | null>(null);

  protected readonly sections = computed(() =>
    this.parcours().filter(
      ({ id, cartes }) => cartes.length > 0 && [null, id].includes(this.choisi()),
    ),
  );

  protected readonly affichees = computed(() =>
    this.sections().reduce((somme, { cartes }) => somme + cartes.length, 0),
  );

  protected chercher(evenement: Event): void {
    this.choisi.set(null);
    this.recherche.set(readInputValue(evenement));
  }

  protected readonly texteCite = computed(() => this.recherche().trim());

  private readonly champ = viewChild.required<ElementRef<HTMLInputElement>>('champ');

  protected choisir(parcours: Parcours | null): void {
    this.choisi.set(parcours);
  }

  protected toutAfficher(): void {
    this.choisi.set(null);
    this.recherche.set('');
    this.champ().nativeElement.focus();
  }
}
