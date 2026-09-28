import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SlideLessonKind = 'definition' | 'property' | 'method' | 'example' | 'exam';

export interface SlideLessonBlock {
  readonly kind: SlideLessonKind;
  readonly title: string;
  readonly text: string;
  readonly formula?: string;
  readonly steps?: readonly string[];
}

const NATURES: Readonly<Record<SlideLessonKind, string>> = {
  definition: $localize`:@@slideLessonDefinition:Définition`,
  property: $localize`:@@slideLessonPropriete:Propriété`,
  method: $localize`:@@slideLessonMethode:Méthode`,
  example: $localize`:@@slideLessonExemple:Exemple`,
  exam: $localize`:@@slideLessonAuCcf:Au CCF`,
};

@Component({
  selector: 'app-slide-lesson',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-lesson.component.html',
  styleUrl: './slide-lesson.component.scss',
})
export class SlideLessonComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly blocks = input.required<readonly SlideLessonBlock[]>();

  protected readonly natures = NATURES;
}
