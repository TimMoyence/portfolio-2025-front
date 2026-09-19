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
  computed,
} from '@angular/core';
import type {
  EcranContent,
  RenderMode,
  ResultatsSeance,
  Role,
} from '../../../../cours/content/types';
import { aUnePresentation, objet } from '../visual/presentation-v2';
import { SlideVisualComponent } from '../visual/slide-visual.component';
import { planDeMontage, PROPRIETES_PAR_BRIQUE } from './lecture-ecran';

export interface ReponseSlide {
  readonly questionId: string;
  readonly valeur: number | string;
  readonly dureeMs: number;
  readonly type?: 'libre' | 'qcm';
}

function estValeur(value: unknown): value is number | string {
  return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
}

function lireReponse(detail: unknown): ReponseSlide | null {
  const donnees = objet(detail);
  if (donnees === null) {
    return null;
  }
  const questionId = donnees['questionId'] ?? donnees['billetId'];
  const valeur = donnees['valeur'];
  const dureeMs = donnees['dureeMs'];
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

@Component({
  selector: 'app-slide-activity',
  standalone: true,
  imports: [SlideVisualComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #host
      class="slide-activity__blocks"
      [hidden]="visual()"
      data-testid="slide-activity-host"
      (fp-numeric-submit)="relay($event)"
      (fp-vote-submit)="relay($event)"
      (fp-recall-submit)="relay($event)"
      (fp-exit-submit)="relay($event)"
      (fp-quiz-submit)="relay($event)"
      (fp-block-error)="showError()"
    ></div>
    @if (visual()) {
      <app-slide-visual
        [slide]="slide()"
        [sessionId]="sessionId()"
        [jeton]="jeton()"
        (reponse)="reponse.emit($event)"
      />
    }
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
  readonly sessionId = input<string | null>(null);
  readonly jeton = input<string>('');
  readonly reponse = output<ReponseSlide>();
  protected readonly visual = computed(() => aUnePresentation(this.slide()));

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
    if (aUnePresentation(slide)) {
      this.unknown.set(false);
      this.error.set(false);
      return;
    }
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

const REGISTER_SLIDE_BLOCKS = new InjectionToken<() => Promise<void>>('REGISTER_SLIDE_BLOCKS', {
  providedIn: 'root',
  factory: () => async () => {
    const { registerCoursBlocks } = await import('../../../../cours/runtime/core/register');
    await registerCoursBlocks();
  },
});
