import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { PresentationServie } from '../../../../../../../contrat';
import { FigureDeCourbeComponent } from '../../donnees/figure-de-courbe/figure-de-courbe.component';

type Lecon = Extract<PresentationServie, { renderer: 'lesson' }>['props'];
type NatureDeBloc = Lecon['blocks'][number]['kind'];

const NATURES: Readonly<Record<NatureDeBloc, string>> = {
  definition: $localize`:@@slideLessonDefinition:Définition`,
  property: $localize`:@@slideLessonPropriete:Propriété`,
  method: $localize`:@@slideLessonMethode:Méthode`,
  example: $localize`:@@slideLessonExemple:Exemple`,
  piege: $localize`:@@slideLessonPieges:Les pièges`,
};

@Component({
  selector: 'app-slide-lesson',
  standalone: true,
  imports: [FigureDeCourbeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-lesson.component.html',
  styleUrl: './slide-lesson.component.scss',
})
export class SlideLessonComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly blocks = input.required<Lecon['blocks']>();
  readonly figure = input<Lecon['figure']>();

  protected readonly natures = NATURES;
}
