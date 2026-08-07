import { ChangeDetectionStrategy, Component, ElementRef, inject, input } from '@angular/core';

export interface RichListItem {
  title: string;
  description: string;
  meta?: string;
  logo?: string;
}

/**
 * Le selector multiple capte `app-slide-image-left` et `app-slide-image-right`,
 * et `isReverse` derive la position du media du `tagName` de l'hote — lecture
 * SSR-safe, l'ElementRef injecte etant peuple aussi cote serveur.
 *
 * C'est l'ordre DOM qui place l'image, sans regle CSS de reordonnancement :
 * l'ordre de lecture des lecteurs d'ecran suit donc l'ordre visuel.
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

  protected initial(label: string): string {
    return label.trim().charAt(0).toUpperCase();
  }
}
