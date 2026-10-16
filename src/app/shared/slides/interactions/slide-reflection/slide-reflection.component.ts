import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  computed,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { suivreLaSaisie } from '../../../../../cours/runtime/core/zone-de-saisie';
import { PRESENTATION_PORT } from '../../../../core/ports/presentation.port';
import { readInputValue } from '../../../utils/dom-event.utils';
import type { EtatEnvoiLibre } from '../../session/reponses-libres.service';
import { cleDeReponseLibre, ReponsesLibresService } from '../../session/reponses-libres.service';
import { chargerInteraction } from '../interactions.util';
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

export interface DebriefDeReflexion {
  readonly attendu: string;
  readonly suite: string | null;
}

type EtatEnvoi = 'repos' | 'envoi' | Exclude<EtatEnvoiLibre, 'vide'>;

const ETATS_GARDES_EN_FILE: readonly EtatEnvoi[] = [
  'attente_reseau',
  'attente_limite',
  'ecran_non_servi',
];

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
  readonly debrief = input<DebriefDeReflexion | null>(null);

  protected readonly reflection = signal<ReflectionInteraction | null>(null);
  protected readonly activeReflection = computed(() => this.promptData() ?? this.reflection());
  protected readonly error = signal<boolean>(false);
  protected readonly value = signal<string>('');
  protected readonly saveState = signal<EtatEnvoi>('repos');
  protected readonly garde = computed(() => {
    const sessionId = this.seanceCourante();
    return sessionId === null
      ? null
      : this.reponsesLibres.texteGarde(sessionId, this.activiteCourante());
  });
  protected readonly etatVisible = computed<EtatEnvoi>(() =>
    this.saveState() === 'repos' && this.garde() !== null ? 'enregistre' : this.saveState(),
  );

  private readonly port = inject(PRESENTATION_PORT, { optional: true });
  private readonly reponsesLibres = inject(ReponsesLibresService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly startedAt = Date.now();
  private readonly zone = viewChild<ElementRef<HTMLTextAreaElement>>('zone');

  constructor() {
    afterRenderEffect((onCleanup) => {
      this.garde();
      const zone = this.zone()?.nativeElement;
      if (zone !== undefined) {
        onCleanup(suivreLaSaisie(zone));
      }
    });
    effect(() => {
      const sessionId = this.seanceCourante();
      if (sessionId !== null) {
        this.afficherLEtat(this.reponsesLibres.etatsDesEnvois().get(this.cleCourante(sessionId)));
      }
    });
  }

  ngOnInit(): void {
    this.load();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.reprendre);
      this.destroyRef.onDestroy(() => window.removeEventListener('online', this.reprendre));
    }
    void this.reprendre();
  }

  protected async save(): Promise<void> {
    const sessionId = this.seanceCourante();
    const response = this.value().trim();
    if (response === '' || sessionId === null) {
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
    const sessionId = this.seanceCourante();
    if (sessionId === null) return;
    const cle = this.cleCourante(sessionId);
    this.afficherLEtat((await this.reponsesLibres.reprendre(sessionId, this.jeton())).get(cle));
  };

  private seanceCourante(): string | null {
    return this.mode() === 'seance' ? this.sessionId() : null;
  }

  private activiteCourante(): string {
    return this.activeReflection()?.id ?? this.interactionId();
  }

  private cleCourante(sessionId: string): string {
    return cleDeReponseLibre(sessionId, this.screenId(), this.activiteCourante());
  }

  private afficherLEtat(etat: EtatEnvoiLibre | undefined): void {
    if (etat !== undefined) {
      this.saveState.set(etatAffiche(etat));
    }
  }

  protected onInput(evenement: Event): void {
    this.value.set(readInputValue(evenement));
    if (!ETATS_GARDES_EN_FILE.includes(this.saveState())) {
      this.saveState.set('repos');
    }
  }

  protected promptText(): string {
    const r = this.activeReflection();
    if (r === null) return '';
    return r.question ?? r.prompt ?? '';
  }

  private load(): void {
    chargerInteraction<ReflectionInteraction>({
      enLigne: this.promptData(),
      port: this.port,
      slug: this.slug(),
      type: 'reflection',
      interactionId: this.interactionId(),
      cible: this.reflection,
      erreur: this.error,
      destroyRef: this.destroyRef,
    });
  }
}
