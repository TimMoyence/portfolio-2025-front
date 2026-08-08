import { ChangeDetectionStrategy, Component, ElementRef, inject, input } from '@angular/core';

export interface RichListItem {
  title: string;
  description: string;
  meta?: string;
  logo?: string;
}

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

  protected readonly isReverse =
    inject(ElementRef).nativeElement.tagName.toLowerCase() === 'app-slide-image-right';

  protected initial(label: string): string {
    return label.trim().charAt(0).toUpperCase();
  }
}
