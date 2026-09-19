import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  computed,
  OnInit,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type {
  FormationsPort,
  MotifRefusReponseLibre,
} from '../../../../core/ports/formations.port';
import { FORMATIONS_PORT, ReponseLibreRefusee } from '../../../../core/ports/formations.port';
import { PRESENTATION_PORT } from '../../../../core/ports/presentation.port';
import type { PendingFreeResponse } from './free-response.queue';
import {
  enqueueFreeResponse,
  pendingFreeResponses,
  removeFreeResponse,
} from './free-response.queue';
import { loadInteraction } from '../interactions.util';
import type { ModeInteraction } from '../mode-interaction';

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

type EtatEnvoi =
  | 'repos'
  | 'envoi'
  | 'enregistre'
  | 'attente_reseau'
  | 'seance_non_demarree'
  | 'seance_terminee'
  | 'echec';

const ETAT_APRES_REFUS: Readonly<Record<Exclude<MotifRefusReponseLibre, 'reseau'>, EtatEnvoi>> = {
  'seance-non-demarree': 'seance_non_demarree',
  'seance-terminee': 'seance_terminee',
  refusee: 'echec',
};

function cleDeFile(sessionId: string, screenId: string, activityId: string): string {
  return `${sessionId}:${screenId}:${activityId}`;
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
  readonly mode = input<ModeInteraction>('apercu');

  protected readonly reflection = signal<ReflectionInteraction | null>(null);
  protected readonly activeReflection = computed(() => this.promptData() ?? this.reflection());
  protected readonly error = signal<boolean>(false);
  protected readonly value = signal<string>('');
  protected readonly saveState = signal<EtatEnvoi>('repos');

  private readonly port = inject(PRESENTATION_PORT, { optional: true });
  private readonly formations = inject(FORMATIONS_PORT, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly startedAt = Date.now();

  ngOnInit(): void {
    this.load();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.reprendre);
      this.destroyRef.onDestroy(() => window.removeEventListener('online', this.reprendre));
    }
    void this.reprendre();
  }

  protected async save(): Promise<void> {
    const sessionId = this.sessionId();
    const formations = this.formations;
    const response = this.value().trim();
    if (response === '' || this.mode() !== 'seance' || sessionId === null || formations === null) {
      return;
    }
    const activityId = this.activiteCourante();
    this.saveState.set('envoi');
    this.saveState.set(
      await this.transmettre(formations, {
        key: cleDeFile(sessionId, this.screenId(), activityId),
        sessionId,
        screenId: this.screenId(),
        activityId,
        response,
        dureeMs: Math.max(0, Date.now() - this.startedAt),
      }),
    );
  }

  private readonly reprendre = async (): Promise<void> => {
    const sessionId = this.sessionId();
    const formations = this.formations;
    if (this.mode() !== 'seance' || sessionId === null || formations === null) return;
    const cleCourante = cleDeFile(sessionId, this.screenId(), this.activiteCourante());
    for (const envoi of await pendingFreeResponses(sessionId)) {
      const etat = await this.transmettre(formations, envoi);
      if (envoi.key === cleCourante) {
        this.saveState.set(etat);
      }
    }
  };

  private async transmettre(
    formations: FormationsPort,
    envoi: PendingFreeResponse,
  ): Promise<EtatEnvoi> {
    try {
      await firstValueFrom(
        formations.enregistrerReponseLibre(envoi.sessionId, this.jeton(), {
          screenId: envoi.screenId,
          activityId: envoi.activityId,
          response: envoi.response,
          dureeMs: envoi.dureeMs,
        }),
      );
    } catch (erreur) {
      return this.traiterLeRefus(envoi, erreur);
    }
    await removeFreeResponse(envoi.key);
    return 'enregistre';
  }

  private async traiterLeRefus(envoi: PendingFreeResponse, erreur: unknown): Promise<EtatEnvoi> {
    const motif = erreur instanceof ReponseLibreRefusee ? erreur.motif : 'reseau';
    if (motif !== 'reseau') {
      await removeFreeResponse(envoi.key);
      return ETAT_APRES_REFUS[motif];
    }
    try {
      await enqueueFreeResponse(envoi);
      return 'attente_reseau';
    } catch {
      return 'echec';
    }
  }

  private activiteCourante(): string {
    return this.activeReflection()?.id ?? this.interactionId();
  }

  protected onInput(text: string): void {
    this.value.set(text);
    if (this.saveState() !== 'attente_reseau') {
      this.saveState.set('repos');
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
