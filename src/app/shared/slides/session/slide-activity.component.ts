import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  InjectionToken,
  input,
  output,
  Renderer2,
  signal,
  viewChild,
} from '@angular/core';
import type {
  EcranContent,
  RenderMode,
  ResultatsSeance,
  Role,
} from '../../../../cours/content/types';

export interface ReponseSlide {
  readonly questionId: string;
  readonly valeur: number | string;
  readonly dureeMs: number;
}

type Donnees = Readonly<Record<string, unknown>>;

interface Montage {
  readonly brique: string;
  readonly donnees: Donnees;
}

const PROPRIETES_PAR_BRIQUE: Readonly<Record<string, readonly string[]>> = {
  'fp-quote': ['citation'],
  'fp-story': ['recit'],
  'fp-pro': ['cas'],
  'fp-worked': ['exemple', 'etayage'],
  'fp-concept4': ['definition'],
  'fp-plot': ['definition'],
  'fp-challenge': ['probleme'],
  'fp-cardsort': ['plan'],
  'fp-numeric': ['question'],
  'fp-vote': ['question'],
  'fp-recall': ['question'],
  'fp-exit': ['billet'],
  'fp-quiz': ['question'],
};

const PORTEUR_DE_REPONSE: Readonly<Record<string, string>> = {
  'fp-numeric': 'question',
  'fp-vote': 'question',
  'fp-recall': 'question',
  'fp-exit': 'billet',
  'fp-quiz': 'question',
};

const QUESTIONNAIRE = 'questionnaire';

function estObjet(value: unknown): value is Donnees {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function lireMontage(brique: unknown, donnees: unknown): Montage | null {
  if (typeof brique !== 'string' || !Object.hasOwn(PROPRIETES_PAR_BRIQUE, brique)) {
    return null;
  }
  return { brique, donnees: estObjet(donnees) ? donnees : {} };
}

function planDeMontage(ecran: EcranContent): readonly Montage[] | null {
  if (ecran.type !== QUESTIONNAIRE) {
    const montage = lireMontage(ecran.type, ecran.donnees);
    return montage === null ? null : [montage];
  }
  const questions = ecran.donnees?.['questions'];
  if (!Array.isArray(questions) || questions.length === 0) {
    return null;
  }
  const montages = questions.map((question) => {
    if (!estObjet(question)) {
      return null;
    }
    return lireMontage(question['brique'], question['donnees']);
  });
  return montages.every((montage): montage is Montage => montage !== null) ? montages : null;
}

function estValeur(value: unknown): value is number | string {
  return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
}

function lireReponse(detail: unknown): ReponseSlide | null {
  if (!estObjet(detail)) {
    return null;
  }
  const questionId = detail['questionId'] ?? detail['billetId'];
  const valeur = detail['valeur'];
  const dureeMs = detail['dureeMs'];
  if (
    typeof questionId !== 'string' ||
    questionId === '' ||
    !estValeur(valeur) ||
    typeof dureeMs !== 'number' ||
    !Number.isInteger(dureeMs) ||
    dureeMs < 0
  ) {
    return null;
  }
  return { questionId, valeur, dureeMs };
}

export interface QuestionDeLEcran {
  readonly id: string;
  readonly enonce: string;
}

function questionsDuMontage(montage: Montage): readonly QuestionDeLEcran[] {
  const propriete = PORTEUR_DE_REPONSE[montage.brique] ?? '';
  if (propriete === '') {
    return [];
  }
  const question = montage.donnees[propriete];
  if (!estObjet(question) || typeof question['id'] !== 'string') {
    return [];
  }
  const enonce = question['enonce'];
  return [{ id: question['id'], enonce: typeof enonce === 'string' ? enonce : '' }];
}

export function questionsDeLEcran(ecran: EcranContent): readonly QuestionDeLEcran[] {
  return (planDeMontage(ecran) ?? []).flatMap(questionsDuMontage);
}

export function identifiantsDesQuestions(ecran: EcranContent): readonly string[] {
  return questionsDeLEcran(ecran).map((question) => question.id);
}

@Component({
  selector: 'app-slide-activity',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #host
      class="slide-activity__blocks"
      data-testid="slide-activity-host"
      (fp-numeric-submit)="relay($event)"
      (fp-vote-submit)="relay($event)"
      (fp-recall-submit)="relay($event)"
      (fp-exit-submit)="relay($event)"
      (fp-quiz-submit)="relay($event)"
      (fp-block-error)="showError()"
    ></div>
    @if (unknown()) {
      <p class="slide-activity__message" role="alert" data-testid="slide-activity-unknown">
        Cet écran ne peut pas être affiché : son contenu n’est pas reconnu.
      </p>
    }
    @if (error()) {
      <p class="slide-activity__message" role="alert" data-testid="slide-activity-error">
        Les activités de cet écran n’ont pas pu être chargées.
      </p>
    }
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }

    .slide-activity__blocks {
      display: grid;
      gap: 1rem;
      width: 100%;
    }

    .slide-activity__message {
      max-width: 60ch;
      margin: 2rem auto;
      color: var(--text-muted, #6d665b);
      text-align: center;
    }
  `,
})
export class SlideActivityComponent {
  readonly slide = input.required<EcranContent>();
  readonly render = input<RenderMode>('hand');
  readonly role = input<Role>('etudiant');
  readonly resultats = input<ResultatsSeance | null>(null);
  readonly reponse = output<ReponseSlide>();

  protected readonly unknown = signal(false);
  protected readonly error = signal(false);

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private readonly renderer = inject(Renderer2);
  private readonly registerBlocks = inject(REGISTER_SLIDE_BLOCKS);
  private readonly registered = this.registerAfterRender();
  private destroyed = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
    });
    effect(() => this.scheduleMount(this.slide(), this.render(), this.role()));
  }

  protected relay(event: Event): void {
    const response = lireReponse(event instanceof CustomEvent ? event.detail : null);
    if (response !== null) {
      this.reponse.emit(response);
    }
  }

  protected showError(): void {
    this.error.set(true);
    this.unknown.set(false);
    this.clearHost();
  }

  private registerAfterRender(): Promise<boolean> {
    return new Promise<void>((resolve) => afterNextRender(resolve)).then(this.registerBlocks).then(
      () => true,
      () => false,
    );
  }

  private scheduleMount(slide: EcranContent, render: RenderMode, role: Role): void {
    void this.registered.then((registered) => {
      if (this.destroyed) {
        return;
      }
      if (!registered) {
        this.error.set(true);
        return;
      }
      this.mount(slide, render, role);
    });
  }

  private mount(slide: EcranContent, render: RenderMode, role: Role): void {
    this.clearHost();
    const plan = planDeMontage(slide);
    if (plan === null) {
      this.unknown.set(true);
      this.error.set(false);
      return;
    }
    try {
      for (const montage of plan) {
        const element = this.renderer.createElement(montage.brique);
        this.renderer.setAttribute(element, 'render', render);
        this.renderer.setAttribute(element, 'data-slide-role', role);
        for (const property of PROPRIETES_PAR_BRIQUE[montage.brique]) {
          if (Object.hasOwn(montage.donnees, property)) {
            this.renderer.setProperty(element, property, montage.donnees[property]);
          }
        }
        this.renderer.appendChild(this.host().nativeElement, element);
      }
      this.unknown.set(false);
      this.error.set(false);
    } catch {
      this.showError();
    }
  }

  private clearHost(): void {
    const host = this.host().nativeElement;
    for (const child of Array.from(host.childNodes)) {
      this.renderer.removeChild(host, child);
    }
  }
}

export const REGISTER_SLIDE_BLOCKS = new InjectionToken<() => Promise<void>>(
  'REGISTER_SLIDE_BLOCKS',
  {
    providedIn: 'root',
    factory: () => async () => {
      const { registerCoursBlocks } = await import('../../../../cours/runtime/core/register');
      await registerCoursBlocks();
    },
  },
);
