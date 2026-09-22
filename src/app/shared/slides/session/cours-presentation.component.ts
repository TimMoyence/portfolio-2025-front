import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type {
  EcranContent,
  RenderMode,
  ResultatsSeance,
  Role,
} from '../../../../cours/content/types';
import type { Brouillons } from '../../../../cours/runtime/core/storage';
import type { SyntheseConcept } from '../../../core/ports/formations.port';
import type { DirectEcran, EvenementBrique, RetourBrique } from './contrat-hote';
import { SlideActivityComponent } from './slide-activity.component';
import { SlideComponent } from '../deck/slide.component';
import { SlideDeckComponent } from '../deck/slide-deck.component';

export type CoursPresentationMode = 'etudiant' | 'formateur' | 'projection';

@Component({
  selector: 'app-cours-presentation',
  standalone: true,
  imports: [NgTemplateOutlet, SlideActivityComponent, SlideComponent, SlideDeckComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (slide(); as current) {
      @if (mode() === 'etudiant') {
        <app-slide-deck mode="scroll" [allowFullscreen]="true" [progressLabel]="progressLabel()">
          <app-slide [id]="current.id">
            <ng-container
              *ngTemplateOutlet="activity; context: { $implicit: current }"
            ></ng-container>
          </app-slide>
        </app-slide-deck>
      } @else {
        <app-slide [id]="current.id">
          <ng-container
            *ngTemplateOutlet="activity; context: { $implicit: current }"
          ></ng-container>
        </app-slide>
      }
    }

    <ng-template #activity let-current>
      <app-slide-activity
        [slide]="current"
        [render]="renderMode()"
        [role]="role()"
        [resultats]="resultats()"
        [sessionId]="sessionId()"
        [jeton]="jeton()"
        [retours]="retours()"
        [direct]="direct()"
        [donneesFormateur]="$any(donneesFormateur())"
        [maitrise]="maitrise()"
        [brouillons]="brouillons()"
        (evenement)="evenement.emit($event)"
      />
    </ng-template>
  `,
  styles: `
    :host {
      display: block;
      inline-size: 100%;
      min-inline-size: 0;
    }

    app-slide {
      display: block;
      min-inline-size: 0;
    }
  `,
})
export class CoursPresentationComponent {
  readonly mode = input<CoursPresentationMode>('etudiant');
  readonly slide = input<EcranContent | null>(null);
  readonly index = input<number | null>(null);
  readonly total = input<number | null>(null);
  readonly resultats = input<ResultatsSeance | null>(null);
  readonly sessionId = input<string | null>(null);
  readonly jeton = input('');
  readonly retours = input<ReadonlyMap<string, readonly RetourBrique[]>>(new Map());
  readonly direct = input<DirectEcran | null>(null);
  readonly donneesFormateur = input<unknown>(null);
  readonly maitrise = input<readonly SyntheseConcept[] | null>(null);
  readonly brouillons = input<Brouillons | null>(null);
  readonly evenement = output<EvenementBrique>();

  protected readonly role = computed<Role>(() =>
    this.mode() === 'etudiant' ? 'etudiant' : 'presentateur',
  );

  protected readonly renderMode = computed<RenderMode>(() => {
    const mode = this.mode();
    if (mode === 'projection') {
      return 'stage';
    }
    if (mode === 'formateur') {
      return this.slide()?.type === 'fp-plot' ? 'hand' : 'board';
    }
    return 'hand';
  });

  protected readonly progressLabel = computed(() => {
    const index = this.index();
    const total = this.total();
    return index === null || total === null ? null : `${index + 1} / ${total}`;
  });
}
