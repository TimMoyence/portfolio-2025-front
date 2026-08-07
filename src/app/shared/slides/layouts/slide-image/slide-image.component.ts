import { ChangeDetectionStrategy, Component, ElementRef, inject, input } from '@angular/core';

/**
 * Item enrichi pour les layouts image / grid.
 *
 * `title` : nom de l'outil ou intitule (rendu en gras).
 * `description` : phrase descriptive (texte courant).
 * `meta` : optionnel — chip discret (prix, tagline courte).
 * `logo` : URL d'image optionnel ; sinon une puce DS s'affiche avec
 *          l'initiale du `title`.
 */
export interface RichListItem {
  title: string;
  description: string;
  meta?: string;
  logo?: string;
}

/**
 * Slide image + contenu, fusion des anciens `slide-image-left` /
 * `slide-image-right`.
 *
 * Le selector multiple `app-slide-image-left, app-slide-image-right` capte les
 * deux balises historiques sans changer le markup consommateur. La position du
 * media est derivee du `tagName` de l'hote via `isReverse` :
 * - `app-slide-image-left`  -> media AVANT contenu (image a gauche)
 * - `app-slide-image-right` -> contenu AVANT media (image a droite)
 *
 * L'ordre gauche/droite est pilote par l'ordre DOM (bloc `.media` avant ou
 * apres `.content`) combine a la grille `1fr 1fr` en auto-placement — aucune
 * regle CSS de reordonnancement. Comportement strictement identique aux deux
 * composants d'origine, ordre de lecture lecteur d'ecran inclus.
 *
 * SSR-safe : `isReverse` lit `inject(ElementRef).nativeElement.tagName`, une
 * lecture sur l'element hote injecte (peuple par Angular sur serveur comme sur
 * navigateur, prerequis de l'hydratation) — aucun acces `window`/`document`.
 * Fallback (si le `tagName` serveur etait vide, contre toute attente) : ajouter
 * `@Input() imagePosition: 'left' | 'right'` et le passer sur chaque balise.
 *
 * Inputs structures :
 * - `subtitle` : intro courte au-dessus de la liste
 * - `paragraphs` : `<p>` separes
 * - `items` : `<ul><li>` simples
 * - `richItems` : liste enrichie avec logo + titre gras + description + meta
 *
 * `<ng-content>` reste disponible pour insertions ad-hoc apres les listes.
 */
@Component({
  selector: 'app-slide-image-left, app-slide-image-right',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-image.component.html',
  styleUrl: './slide-image.component.scss',
})
export class SlideImageComponent {
  readonly image = input.required<string>();
  readonly imageAlt = input.required<string>();
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly paragraphs = input<string[]>([]);
  readonly items = input<string[]>([]);
  readonly richItems = input<RichListItem[]>([]);
  readonly accent = input<string>('default');

  /**
   * `true` quand l'hote est `<app-slide-image-right>` (image a droite,
   * media rendu apres le contenu). Immuable, lu une fois — compatible OnPush.
   */
  protected readonly isReverse =
    inject(ElementRef).nativeElement.tagName.toLowerCase() === 'app-slide-image-right';

  /** Renvoie l'initiale majuscule d'un libelle, pour la puce de logo. */
  protected initial(label: string): string {
    return label.trim().charAt(0).toUpperCase();
  }
}
