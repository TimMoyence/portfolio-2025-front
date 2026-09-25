import { DOCUMENT, isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { SlideEnTeteComponent } from '../slide-en-tete/slide-en-tete.component';

export interface SlideGridItem {
  title: string;
  description: string;
  icon?: string;
  href?: string;
  external?: boolean;
  back?: string;
}

const CLASSE_D_IMPRESSION = 'impression-fiche';
const ATTRIBUT_D_IMPRESSION = 'data-impression-fiche';
const COLONNES_AU_PLUS = 6;

@Component({
  selector: 'app-slide-grid',
  standalone: true,
  imports: [NgTemplateOutlet, SlideEnTeteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-grid.component.html',
  styleUrl: './slide-grid.component.scss',
})
export class SlideGridComponent {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly items = input.required<SlideGridItem[]>();
  readonly imprimable = input<boolean>(false);

  protected readonly flipped = signal<ReadonlySet<string>>(new Set());
  protected readonly colonnesEquilibrees = computed(() => {
    const cartes = Math.max(this.items().length, 1);
    return Math.ceil(cartes / Math.ceil(cartes / COLONNES_AU_PLUS));
  });

  private readonly document = inject(DOCUMENT);
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);

  protected isFlipped(title: string): boolean {
    return this.flipped().has(title);
  }

  protected libelleBascule(title: string): string {
    return this.isFlipped(title)
      ? $localize`:@@slideGridRevenir:Revenir à ${title}:titre:`
      : $localize`:@@slideGridAfficherDetail:Afficher le détail de ${title}:titre:`;
  }

  protected toggle(title: string): void {
    const next = new Set(this.flipped());
    if (next.has(title)) {
      next.delete(title);
    } else {
      next.add(title);
    }
    this.flipped.set(next);
  }

  protected imprimer(): void {
    const fenetre = this.document.defaultView;
    if (!this.navigateur || fenetre === null) {
      return;
    }
    const corps = this.document.body;
    const copie = this.document.createElement('div');
    copie.className = CLASSE_D_IMPRESSION;
    copie.appendChild(this.hote.nativeElement.cloneNode(true));
    corps.appendChild(copie);
    corps.setAttribute(ATTRIBUT_D_IMPRESSION, '');
    const nettoyer = (): void => {
      copie.remove();
      corps.removeAttribute(ATTRIBUT_D_IMPRESSION);
      fenetre.removeEventListener('afterprint', nettoyer);
    };
    fenetre.addEventListener('afterprint', nettoyer);
    fenetre.print();
  }
}
