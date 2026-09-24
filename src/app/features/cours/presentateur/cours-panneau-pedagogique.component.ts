import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Observable } from 'rxjs';
import {
  catchError,
  debounceTime,
  firstValueFrom,
  forkJoin,
  map,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import type { EcranContent, EcranDeroule, ResultatQuestion } from '../../../../cours/content/types';
import type {
  AnnotationFormateur,
  ReponseLibreFormateur,
} from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import { enoncesDesActivites } from '../../../shared/slides/session/lecture-ecran';
import { telechargerFichier } from '../../../shared/utils/telechargement.utils';
import type {
  EtatSauvegarde,
  SaisieAnnotation,
} from './panneau-pedagogique/panneau-annotation.component';
import { PanneauAnnotationComponent } from './panneau-pedagogique/panneau-annotation.component';
import { PanneauLectureClasseComponent } from './panneau-pedagogique/panneau-lecture-classe.component';
import { PanneauReponsesLibresComponent } from './panneau-pedagogique/panneau-reponses-libres.component';

const DELAI_ENREGISTREMENT_MS = 600;

type Lecture<T> = { readonly lue: true; readonly valeur: T } | { readonly lue: false };

type EtatExport = 'repos' | 'en_cours' | 'echec';

interface SaisieDeLaSeance extends SaisieAnnotation {
  readonly sessionId: string;
}

function lire<T>(source: Observable<T>): Observable<Lecture<T>> {
  return source.pipe(
    map((valeur): Lecture<T> => ({ lue: true, valeur })),
    catchError(() => of<Lecture<T>>({ lue: false })),
  );
}

function cleDAnnotation(annotation: AnnotationFormateur): string {
  return annotation.screenId;
}

function fusionnerLesAnnotations(
  connues: readonly AnnotationFormateur[],
  recues: readonly AnnotationFormateur[],
): readonly AnnotationFormateur[] {
  const parCle = new Map(connues.map((annotation) => [cleDAnnotation(annotation), annotation]));
  for (const recue of recues) {
    const connue = parCle.get(cleDAnnotation(recue));
    if (connue === undefined || Date.parse(recue.updatedAt) >= Date.parse(connue.updatedAt)) {
      parCle.set(cleDAnnotation(recue), recue);
    }
  }
  return [...parCle.values()];
}

@Component({
  selector: 'app-cours-panneau-pedagogique',
  standalone: true,
  imports: [
    PanneauAnnotationComponent,
    PanneauLectureClasseComponent,
    PanneauReponsesLibresComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './cours-panneau-pedagogique.component.scss',
  template: `
    <section class="pedagogie-panel">
      <div class="pedagogie-panel__head">
        <p class="pedagogie-panel__ecran" i18n="@@panneauPedagogiqueEcran">
          Écran {{ ecran().id }}
        </p>
        <button
          type="button"
          class="pedagogie-panel__export"
          data-testid="panneau-exporter-bilan"
          [disabled]="export() === 'en_cours'"
          (click)="exporterLeBilan()"
          i18n="@@panneauPedagogiqueExporter"
        >
          Exporter le bilan
        </button>
      </div>
      @if (export() === 'echec') {
        <p
          class="pedagogie-panel__alerte"
          role="alert"
          data-testid="panneau-export-echec"
          i18n="@@panneauPedagogiqueExportEchec"
        >
          Le bilan n’a pas pu être exporté. Réessayez.
        </p>
      }
      @if (lectureEchouee()) {
        <p
          class="pedagogie-panel__alerte"
          role="alert"
          data-testid="panneau-lecture-echec"
          i18n="@@panneauPedagogiqueLectureEchec"
        >
          Les notes et réponses de la séance n’ont pas pu être relues : l’affichage peut être en
          retard.
        </p>
      }
      <app-panneau-lecture-classe
        [questionIds]="questionIds()"
        [resultats]="resultats()"
        [participants]="participants()"
      />
      <app-panneau-reponses-libres
        [reponses]="reponsesLibres()"
        [ecranId]="ecran().id"
        [renvoi]="ecran().renvoi"
        [enonces]="enonces()"
      />
      <app-panneau-annotation
        [ecranId]="ecran().id"
        [annotations]="annotations()"
        [etat]="sauvegarde()"
        (saisie)="enregistrer($event)"
      />
    </section>
  `,
})
export class CoursPanneauPedagogiqueComponent {
  readonly ecran = input.required<EcranDeroule>();
  readonly resultats = input.required<readonly ResultatQuestion[]>();
  readonly participants = input.required<number>();
  readonly sessionId = input.required<string | null>();
  readonly renvoi = input<EcranContent | null>(null);

  protected readonly annotations = signal<readonly AnnotationFormateur[]>([]);
  protected readonly reponsesLibres = signal<readonly ReponseLibreFormateur[]>([]);
  protected readonly lectureEchouee = signal(false);
  protected readonly sauvegarde = signal<EtatSauvegarde>('repos');
  protected readonly export = signal<EtatExport>('repos');

  protected readonly enonces = computed<ReadonlyMap<string, string>>(() => {
    const renvoi = this.renvoi();
    return new Map([
      ...enoncesDesActivites(this.ecran()),
      ...(renvoi === null ? [] : enoncesDesActivites(renvoi)),
    ]);
  });

  protected readonly questionIds = computed(() =>
    this.ecran().corriges.map((corrige) => corrige.questionId),
  );

  private readonly port = inject(FORMATIONS_PORT);
  private readonly document = inject(DOCUMENT);
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly relectures = new Subject<string>();
  private readonly saisies = new Subject<SaisieDeLaSeance>();

  constructor() {
    this.relectures
      .pipe(
        switchMap((sessionId) => this.relire(sessionId)),
        takeUntilDestroyed(),
      )
      .subscribe((lecture) => {
        if (lecture.annotations.lue) {
          const recues = lecture.annotations.valeur.annotations;
          this.annotations.update((connues) => fusionnerLesAnnotations(connues, recues));
        }
        if (lecture.reponses.lue) this.reponsesLibres.set(lecture.reponses.valeur.responses);
        this.lectureEchouee.set(Object.values(lecture).some((resultat) => !resultat.lue));
      });
    this.saisies
      .pipe(
        tap(() => this.sauvegarde.set('en_cours')),
        debounceTime(DELAI_ENREGISTREMENT_MS),
        switchMap((saisie) => this.envoyer(saisie)),
        takeUntilDestroyed(),
      )
      .subscribe((etat) => this.sauvegarde.set(etat));
    effect(() => {
      const sessionId = this.sessionId();
      this.ecran();
      this.resultats();
      if (sessionId !== null) {
        this.relectures.next(sessionId);
      }
    });
  }

  protected enregistrer(saisie: SaisieAnnotation): void {
    const sessionId = this.sessionId();
    if (sessionId !== null) {
      this.saisies.next({ ...saisie, sessionId });
    }
  }

  protected async exporterLeBilan(): Promise<void> {
    const sessionId = this.sessionId();
    if (sessionId === null || !this.navigateur) {
      return;
    }
    this.export.set('en_cours');
    try {
      const bilan = await firstValueFrom(this.port.exporterBilan(sessionId));
      telechargerFichier(
        this.document,
        JSON.stringify(bilan, null, 2),
        `bilan-seance-${sessionId}.json`,
        'application/json',
      );
      this.export.set('repos');
    } catch {
      this.export.set('echec');
    }
  }

  private relire(sessionId: string) {
    return forkJoin({
      annotations: lire(this.port.lireAnnotations(sessionId)),
      reponses: lire(this.port.lireReponsesLibres(sessionId)),
    });
  }

  private envoyer(saisie: SaisieDeLaSeance): Observable<EtatSauvegarde> {
    const note = saisie.note.trim();
    if (note === '') {
      return of<EtatSauvegarde>('repos');
    }
    return this.port
      .enregistrerAnnotation(saisie.sessionId, {
        screenId: saisie.screenId,
        note,
      })
      .pipe(
        tap((annotation) =>
          this.annotations.update((connues) => fusionnerLesAnnotations(connues, [annotation])),
        ),
        map((): EtatSauvegarde => 'enregistre'),
        catchError(() => of<EtatSauvegarde>('echec')),
      );
  }
}
