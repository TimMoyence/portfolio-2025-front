import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, type Type } from '@angular/core';
import type {
  DecomptesParCle,
  EcranContent,
  ReflexionServie,
  ResultatsSeance,
  Role,
} from '../../../../cours/content/types';
import {
  SlideArbreComponent,
  SlideBoxplotComponent,
  SlideChartComponent,
  SlideComparisonComponent,
  SlideGridComponent,
  SlideHeroComponent,
  SlideIllustrationComponent,
  SlideImageComponent,
  SlideLessonComponent,
  SlideMethodPathComponent,
  SlidePageComponent,
  SlideReflectionComponent,
  SlideScatterComponent,
  SlideSortReviewComponent,
  SlideStatsComponent,
  SlideTableComponent,
} from '..';
import type { ModeInteraction } from '../interactions/mode-interaction';
import type { RetourBrique } from '../../../core/ports/formations.port';
import { chaineDe, objet } from '../../../../cours/runtime/core/texte/valeurs';
import type { RenduServi } from './presentation-v2';
import { ecranSourceDe, presentationDe, RENDUS_DE_REVELATION } from './presentation-v2';

const layouts: Readonly<Record<RenduServi, Type<unknown>>> = {
  hero: SlideHeroComponent,
  'method-path': SlideMethodPathComponent,
  chart: SlideChartComponent,
  boxplot: SlideBoxplotComponent,
  scatter: SlideScatterComponent,
  arbre: SlideArbreComponent,
  lesson: SlideLessonComponent,
  grid: SlideGridComponent,
  comparison: SlideComparisonComponent,
  stats: SlideStatsComponent,
  reflection: SlideReflectionComponent,
  table: SlideTableComponent,
  'image-left': SlideImageComponent,
  'image-right': SlideImageComponent,
  illustration: SlideIllustrationComponent,
  page: SlidePageComponent,
  'sort-review': SlideSortReviewComponent,
};

const RENDUS_A_IMAGE_PRIORISABLE: ReadonlySet<string> = new Set([
  'hero',
  'image-left',
  'image-right',
  'illustration',
]);

function cartesDuTri(
  source: Readonly<Record<string, unknown>> | null,
  retours: ReadonlyMap<string, readonly RetourBrique[]>,
  juste: boolean,
): readonly string[] {
  const screenId = ecranSourceDe(source);
  const sortId = chaineDe(source, 'sortId');
  if (screenId === null || sortId === null) {
    return [];
  }
  return (retours.get(screenId) ?? []).flatMap((retour) =>
    retour.kind === 'verdict-production' && retour.questionId === sortId
      ? retour.details.filter((detail) => detail.juste === juste).map((detail) => detail.cle)
      : [],
  );
}

function comptesDuTri(
  source: Readonly<Record<string, unknown>> | null,
  resultats: ResultatsSeance | null,
): DecomptesParCle {
  const ecranSource = ecranSourceDe(source);
  const question = (resultats?.questions ?? []).find(
    (candidate) => candidate.ecranId === ecranSource && candidate.questionId === source?.['sortId'],
  );
  return question?.parCle ?? {};
}

@Component({
  selector: 'app-slide-visual',
  standalone: true,
  imports: [NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (layout(); as component) {
      <ng-container *ngComponentOutlet="component; inputs: layoutInputs()" />
      @if (sourceLink(); as link) {
        <p class="slide-visual__source">
          <a [href]="link.href" target="_blank" rel="noreferrer">{{ link.label }}</a>
        </p>
      }
    } @else {
      <p role="alert" i18n="@@slideVisualEcranInconnu">
        Cet écran ne peut pas être affiché : son contenu n’est pas reconnu.
      </p>
    }
  `,
  styles: `
    .slide-visual__source {
      margin: 1rem auto;
      max-width: 72rem;
      font-size: 0.8rem;
      color: var(--text-muted, #6d665b);
    }
    .slide-visual__source a {
      color: inherit;
      text-decoration: underline;
    }
    @container (min-height: 0px) {
      :host {
        display: block;
        position: relative;
      }
      .slide-visual__source {
        position: absolute;
        inset-inline: 3rem;
        inset-block-end: 0.5rem;
        margin: 0;
        max-width: none;
      }
    }
  `,
})
export class SlideVisualComponent {
  readonly slide = input.required<EcranContent>();
  readonly sessionId = input<string | null>(null);
  readonly jeton = input<string>('');
  readonly role = input<Role>('etudiant');
  readonly resultats = input<ResultatsSeance | null>(null);
  readonly prioritaire = input(false);
  readonly retours = input<ReadonlyMap<string, readonly RetourBrique[]>>(new Map());
  readonly debrief = input<ReflexionServie | null>(null);

  private readonly presentation = computed(() => presentationDe(this.slide()));
  protected readonly mode = computed<ModeInteraction>(() => {
    if (this.role() === 'presentateur') {
      return 'projection';
    }
    return this.sessionId() === null ? 'apercu' : 'seance';
  });
  protected readonly layout = computed(() => {
    const renderer = this.presentation()?.renderer;
    return renderer === undefined ? null : layouts[renderer];
  });
  protected readonly layoutInputs = computed(() => {
    const renderer = this.presentation()?.renderer;
    const props = this.presentation()?.props ?? {};
    const inputs = Object.fromEntries(
      Object.entries(props).filter(
        ([key]) =>
          key !== 'sourceLink' && !(RENDUS_DE_REVELATION.has(renderer ?? '') && key === 'source'),
      ),
    );
    const reflectionInputs =
      renderer === 'reflection'
        ? {
            screenId: this.slide().id,
            sessionId: this.sessionId(),
            jeton: this.jeton(),
            mode: this.mode(),
            debrief: this.debrief(),
          }
        : {};
    const reviewInputs =
      renderer === 'sort-review'
        ? {
            misplaced: cartesDuTri(objet(props['source']), this.retours(), false),
            wellPlaced: cartesDuTri(objet(props['source']), this.retours(), true),
            comptes:
              this.role() === 'presentateur'
                ? comptesDuTri(objet(props['source']), this.resultats())
                : {},
          }
        : {};
    return {
      ...inputs,
      ...reflectionInputs,
      ...reviewInputs,
      ...(renderer === 'image-right' ? { reverse: true } : {}),
      ...(RENDUS_A_IMAGE_PRIORISABLE.has(renderer ?? '') && this.prioritaire()
        ? { priority: true }
        : {}),
    };
  });
  protected readonly sourceLink = computed(() => {
    const link = this.presentation()?.props['sourceLink'];
    const href = chaineDe(link, 'href');
    const label = chaineDe(link, 'label');
    return href !== null && label !== null ? { href, label } : null;
  });
}
