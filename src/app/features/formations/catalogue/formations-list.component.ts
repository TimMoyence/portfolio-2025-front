import {
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { readInputValue } from '../../../shared/utils/dom-event.utils';
import {
  type FamilleDeFormation,
  LIENS_DE_LA_FAMILLE,
} from '../../../core/config/familles-de-formation';
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

const TETES: Readonly<
  Record<FamilleDeFormation | 'toutes', { readonly titre: string; readonly phrase: string }>
> = {
  toutes: {
    titre: $localize`:@@formations.titre:Formations`,
    phrase: $localize`:@@formations.phrase:Les cours interactifs du BTS CG et du Bachelor, à suivre en séance, et des formations IA et web gratuites.`,
  },
  digitale: {
    titre: $localize`:@@formations.digitale.titre:Formation digitale`,
    phrase: $localize`:@@formations.digitale.phrase:Des formations IA et web gratuites, pour les pros qui veulent gagner du temps et être trouvés.`,
  },
  cours: {
    titre: $localize`:@@formations.cours.titre:Formation cours`,
    phrase: $localize`:@@formations.cours.phrase:Les cours interactifs du BTS CG et du Bachelor, à suivre en séance avec votre formateur.`,
  },
};

@Component({
  selector: 'app-formations-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './formations-list.component.html',
  styleUrl: './formations-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormationsListComponent {
  readonly famille = input<FamilleDeFormation>();

  protected readonly tete = computed(() => TETES[this.famille() ?? 'toutes']);

  private readonly cherchables = computed(() => {
    const famille = this.famille();
    return famille
      ? CHERCHABLES.filter(({ carte }) => LIENS_DE_LA_FAMILLE[famille].includes(carte.link))
      : CHERCHABLES;
  });

  private readonly parcoursServis = computed(() =>
    PARCOURS.filter(({ id }) => this.cherchables().some(({ carte }) => carte.parcours === id)),
  );

  protected readonly avecPuces = computed(() => this.parcoursServis().length > 1);

  protected readonly recherche = signal('');

  private readonly trouvees = computed(() => {
    const cherche = formeCherchable(this.recherche());
    return this.cherchables()
      .filter(({ texte }) => texte.includes(cherche))
      .map(({ carte }) => carte);
  });

  protected readonly total = computed(() => this.trouvees().length);

  protected readonly parcours = computed(() =>
    this.parcoursServis().map((parcours) => ({
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
