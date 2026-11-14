import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { PresentationServie } from '../../../../../../../contrat';
import { enFrancaisAuMillionieme } from '../../../../../../cours/runtime/core/texte/typographie';
import { generateurDIdentifiants } from '../../identifiant-de-description';

type ProprietesDeLArbre = Extract<PresentationServie, { renderer: 'arbre' }>['props'];
type ProbabiliteServie = ProprietesDeLArbre['branches'][number]['probabilite'];

const prochainIdentifiantDeDescription = generateurDIdentifiants('slide-arbre');

@Component({
  selector: 'app-slide-arbre',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-arbre.component.html',
  styleUrl: './slide-arbre.component.scss',
})
export class SlideArbreComponent {
  readonly title = input.required<ProprietesDeLArbre['title']>();
  readonly subtitle = input<ProprietesDeLArbre['subtitle']>();
  readonly branches = input.required<ProprietesDeLArbre['branches']>();
  readonly reading = input<ProprietesDeLArbre['reading']>();
  readonly description = input.required<ProprietesDeLArbre['description']>();

  protected readonly idDescription = prochainIdentifiantDeDescription();

  protected ecrire(probabilite: ProbabiliteServie): string {
    return probabilite === '?' ? probabilite : enFrancaisAuMillionieme(probabilite);
  }
}
