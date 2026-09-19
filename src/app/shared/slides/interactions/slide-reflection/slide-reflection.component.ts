import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  computed,
  OnInit,
  signal,
  output,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FORMATIONS_PORT } from '../../../../core/ports/formations.port';
import { PRESENTATION_PORT } from '../../../../core/ports/presentation.port';
import {
  enqueueFreeResponse,
  pendingFreeResponses,
  removeFreeResponse,
} from './free-response.queue';
import { loadInteraction } from '../interactions.util';

export interface ReflectionInteraction {
  id?: string;
  slideId?: string;
  type: 'reflection';
  question?: string;
  prompt?: string;
  placeholder?: string;
  context?: string;
  competency?: string;
  expected?: string;
  nextAction?: string;
}

@Component({
  selector: 'app-slide-reflection',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-reflection.component.html',
  styleUrl: './slide-reflection.component.scss',
})
export class SlideReflectionComponent implements OnInit {
  readonly slug = input<string>('');
  readonly interactionId = input<string>('');
  readonly promptData = input<ReflectionInteraction | null>(null);
  readonly showCompetency = input<boolean>(false);
  readonly screenId = input<string>('');
  readonly sessionId = input<string | null>(null);
  readonly jeton = input<string>('');
  readonly selection = output<{
    questionId: string;
    valeur: string;
    dureeMs: number;
    type: 'libre';
  }>();

  protected readonly reflection = signal<ReflectionInteraction | null>(null);
  protected readonly activeReflection = computed(() => this.promptData() ?? this.reflection());
  protected readonly error = signal<boolean>(false);
  protected readonly value = signal<string>('');
  protected readonly saved = signal<boolean>(false);
  protected readonly saveState = signal<'idle' | 'en_attente' | 'enregistre' | 'echec'>('idle');

  private readonly port = inject(PRESENTATION_PORT, { optional: true });
  private readonly formations = inject(FORMATIONS_PORT, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly startedAt = Date.now();

  ngOnInit(): void {
    this.load();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.retryPending);
      this.destroyRef.onDestroy(() => window.removeEventListener('online', this.retryPending));
    }
    void this.retryPending();
  }

  protected async save(): Promise<void> {
    if (this.value().trim().length === 0) {
      return;
    }
    this.saved.set(true);
    const reflection = this.activeReflection();
    const questionId = reflection?.id ?? this.interactionId();
    const dureeMs = Math.max(0, Date.now() - this.startedAt);
    this.selection.emit({
      questionId,
      valeur: this.value().trim(),
      dureeMs,
      type: 'libre',
    });
    if (
      this.formations === null ||
      this.sessionId() === null ||
      this.jeton() === '' ||
      this.screenId() === ''
    ) {
      void enqueueFreeResponse({
        key: this.pendingKey(questionId),
        sessionId: this.sessionId() ?? 'catalogue',
        screenId: this.screenId(),
        activityId: questionId,
        response: this.value().trim(),
        dureeMs,
      });
      this.saveState.set('en_attente');
      return;
    }
    this.saveState.set('en_attente');
    try {
      await firstValueFrom(
        this.formations.enregistrerReponseLibre(this.sessionId()!, this.jeton(), {
          screenId: this.screenId(),
          activityId: questionId,
          response: this.value().trim(),
          dureeMs,
        }),
      );
      this.saveState.set('enregistre');
    } catch {
      await enqueueFreeResponse({
        key: this.pendingKey(questionId),
        sessionId: this.sessionId()!,
        screenId: this.screenId(),
        activityId: questionId,
        response: this.value().trim(),
        dureeMs,
      });
      this.saveState.set('echec');
    }
  }

  private readonly retryPending = async (): Promise<void> => {
    const sessionId = this.sessionId();
    if (sessionId === null || this.jeton() === '' || this.formations === null) return;
    for (const pending of await pendingFreeResponses(sessionId)) {
      try {
        await firstValueFrom(
          this.formations.enregistrerReponseLibre(sessionId, this.jeton(), {
            screenId: pending.screenId,
            activityId: pending.activityId,
            response: pending.response,
            dureeMs: pending.dureeMs,
          }),
        );
        await removeFreeResponse(pending.key);
        if (pending.key === this.pendingKey(this.activeReflection()?.id ?? this.interactionId())) {
          this.saveState.set('enregistre');
        }
      } catch {
        this.saveState.set('echec');
      }
    }
  };

  private pendingKey(activityId: string): string {
    return `${this.sessionId() ?? 'catalogue'}:${this.screenId()}:${activityId}`;
  }

  protected onInput(text: string): void {
    this.value.set(text);
    if (this.saved()) {
      this.saved.set(false);
    }
  }

  protected promptText(): string {
    const r = this.activeReflection();
    if (r === null) return '';
    return r.question ?? r.prompt ?? '';
  }

  private load(): void {
    const inline = this.promptData();
    if (inline !== null) {
      this.reflection.set(inline);
      return;
    }
    if (this.port === null) {
      this.error.set(true);
      return;
    }
    loadInteraction<ReflectionInteraction>(
      this.port.getInteractions(this.slug()),
      'reflection',
      this.interactionId(),
      () => this.error.set(true),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((found) => found && this.reflection.set(found));
  }
}
