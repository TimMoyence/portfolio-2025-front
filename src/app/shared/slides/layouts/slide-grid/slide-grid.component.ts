import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

export interface SlideGridItem {
  title: string;
  description: string;
  icon?: string;
  href?: string;
  external?: boolean;
  back?: string;
}

@Component({
  selector: 'app-slide-grid',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-grid.component.html',
  styleUrl: './slide-grid.component.scss',
})
export class SlideGridComponent {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly items = input.required<SlideGridItem[]>();

  protected readonly flipped = signal<ReadonlySet<string>>(new Set());

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
}
