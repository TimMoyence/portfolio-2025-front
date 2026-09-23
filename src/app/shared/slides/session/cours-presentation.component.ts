import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
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

const LARGEUR_DE_TOILE = 1280;
const HAUTEUR_DE_TOILE = 720;

interface Cadre {
  readonly largeur: number;
  readonly hauteur: number;
}

@Component({
  selector: 'app-cours-presentation',
  standalone: true,
  imports: [NgTemplateOutlet, SlideActivityComponent, SlideComponent, SlideDeckComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (slide(); as current) {
      @for (screen of [current]; track screen.id) {
        @if (mode() === 'etudiant') {
          <app-slide-deck mode="scroll" [allowFullscreen]="true" [progressLabel]="progressLabel()">
            <app-slide [id]="screen.id">
              <ng-container
                *ngTemplateOutlet="activity; context: { $implicit: screen }"
              ></ng-container>
            </app-slide>
          </app-slide-deck>
        } @else {
          <div class="cours-cadre" #cadre>
            <div class="cours-toile" data-testid="cours-toile" [style.transform]="transformation()">
              <app-slide [id]="screen.id">
                <ng-container
                  *ngTemplateOutlet="activity; context: { $implicit: screen }"
                ></ng-container>
              </app-slide>
            </div>
          </div>
        }
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

    :host(.cours-presentation--projection) {
      block-size: 100%;
    }

    app-slide {
      display: block;
      inline-size: 100%;
      block-size: 100%;
      min-inline-size: 0;
    }

    .cours-cadre {
      position: relative;
      inline-size: 100%;
      aspect-ratio: 16 / 9;
      overflow: hidden;
    }

    :host(.cours-presentation--projection) .cours-cadre {
      aspect-ratio: auto;
      block-size: 100%;
    }

    .cours-toile {
      position: absolute;
      inset-block-start: 0;
      inset-inline-start: 0;
      inline-size: ${LARGEUR_DE_TOILE}px;
      block-size: ${HAUTEUR_DE_TOILE}px;
      container-type: size;
      overflow: auto;
      transform-origin: 0 0;
    }
  `,
  host: {
    '[class.cours-presentation--projection]': "mode() === 'projection'",
  },
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

  private readonly cadreObserve = viewChild<ElementRef<HTMLElement>>('cadre');
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly cadre = signal<Cadre | null>(null);

  protected readonly transformation = computed(() => {
    const cadre = this.cadre();
    if (cadre === null) {
      return null;
    }
    const echelle = Math.min(cadre.largeur / LARGEUR_DE_TOILE, cadre.hauteur / HAUTEUR_DE_TOILE);
    const decalageX = (cadre.largeur - LARGEUR_DE_TOILE * echelle) / 2;
    const decalageY = (cadre.hauteur - HAUTEUR_DE_TOILE * echelle) / 2;
    return `translate(${decalageX}px, ${decalageY}px) scale(${echelle})`;
  });

  constructor() {
    effect((onCleanup) => {
      const cadre = this.cadreObserve()?.nativeElement;
      if (cadre === undefined || !this.navigateur || typeof ResizeObserver === 'undefined') {
        return;
      }
      const observateur = new ResizeObserver(([entree]) => {
        const { width, height } = entree.contentRect;
        this.cadre.set({ largeur: width, hauteur: height });
      });
      observateur.observe(cadre);
      onCleanup(() => observateur.disconnect());
    });
  }

  protected readonly role = computed<Role>(() =>
    this.mode() === 'etudiant' ? 'etudiant' : 'presentateur',
  );

  protected readonly renderMode = computed<RenderMode>(() =>
    this.mode() === 'etudiant' ? 'hand' : 'stage',
  );

  protected readonly progressLabel = computed(() => {
    const index = this.index();
    const total = this.total();
    return index === null || total === null ? null : `${index + 1} / ${total}`;
  });
}
