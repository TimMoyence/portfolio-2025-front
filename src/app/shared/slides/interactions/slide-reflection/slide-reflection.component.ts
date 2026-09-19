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
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PRESENTATION_PORT } from '../../../../core/ports/presentation.port';
import type { EtatEnvoiLibre } from '../../session/reponses-libres.service';
import { cleDeReponseLibre, ReponsesLibresService } from '../../session/reponses-libres.service';
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

type EtatEnvoi = 'repos' | 'envoi' | Exclude<EtatEnvoiLibre, 'vide'>;

function etatAffiche(etat: EtatEnvoiLibre): EtatEnvoi {
  return etat === 'vide' ? 'repos' : etat;
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
  private readonly reponsesLibres = inject(ReponsesLibresService);
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
    const response = this.value().trim();
    if (response === '' || this.mode() !== 'seance' || sessionId === null) {
      return;
    }
    this.saveState.set('envoi');
    const etat = await this.reponsesLibres.envoyer(sessionId, this.jeton(), {
      screenId: this.screenId(),
      activityId: this.activiteCourante(),
      response,
      dureeMs: Math.max(0, Date.now() - this.startedAt),
    });
    this.saveState.set(etatAffiche(etat));
  }

  private readonly reprendre = async (): Promise<void> => {
    const sessionId = this.sessionId();
    if (this.mode() !== 'seance' || sessionId === null) return;
    const cleCourante = cleDeReponseLibre(sessionId, this.screenId(), this.activiteCourante());
    const etat = (await this.reponsesLibres.reprendre(sessionId, this.jeton())).get(cleCourante);
    if (etat !== undefined) {
      this.saveState.set(etatAffiche(etat));
    }
  };

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
