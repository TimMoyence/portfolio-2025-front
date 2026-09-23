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
  lastValueFrom,
  map,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import type { EcranDeroule, ResultatQuestion } from '../../../../cours/content/types';
import type {
  AnnotationFormateur,
  GroupeFormation,
  MotifRefusGroupe,
  ParticipantDeSeance,
  ReponseLibreFormateur,
} from '../../../core/ports/formations.port';
import { FORMATIONS_PORT, GroupeRefuse } from '../../../core/ports/formations.port';
import { telechargerFichier } from '../../../shared/utils/telechargement.utils';
import type {
  EtatSauvegarde,
  SaisieAnnotation,
} from './panneau-pedagogique/panneau-annotation.component';
import { PanneauAnnotationComponent } from './panneau-pedagogique/panneau-annotation.component';
import type {
  AffectationDeParticipant,
  RenommageDeGroupe,
} from './panneau-pedagogique/panneau-groupes.component';
import { PanneauGroupesComponent } from './panneau-pedagogique/panneau-groupes.component';
import { PanneauGuideComponent } from './panneau-pedagogique/panneau-guide.component';
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
  return `${annotation.screenId}\u0000${annotation.groupName}`;
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
    PanneauGroupesComponent,
    PanneauGuideComponent,
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
          Les notes, groupes et réponses de la séance n’ont pas pu être relus : l’affichage peut
          être en retard.
        </p>
      }
      <app-panneau-guide [guide]="ecran().guide" [ecranId]="ecran().id" />
      <app-panneau-lecture-classe
        [questionIds]="questionIds()"
        [resultats]="resultats()"
        [participants]="participants()"
      />
      <app-panneau-reponses-libres
        [reponses]="reponsesLibres()"
        [ecranId]="ecran().id"
        [renvoi]="ecran().renvoi"
      />
      <app-panneau-groupes
        [groupes]="groupes()"
        [participants]="participantsDeSeance()"
        [refus]="refusDeGroupe()"
        (creation)="creerGroupe($event)"
        (renommage)="renommerGroupe($event)"
        (affectation)="affecterParticipant($event)"
      />
      <app-panneau-annotation
        [ecranId]="ecran().id"
        [groupes]="groupes()"
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

  protected readonly annotations = signal<readonly AnnotationFormateur[]>([]);
  protected readonly groupes = signal<readonly GroupeFormation[]>([]);
  protected readonly participantsDeSeance = signal<readonly ParticipantDeSeance[]>([]);
  protected readonly reponsesLibres = signal<readonly ReponseLibreFormateur[]>([]);
  protected readonly lectureEchouee = signal(false);
  protected readonly sauvegarde = signal<EtatSauvegarde>('repos');
  protected readonly refusDeGroupe = signal<MotifRefusGroupe | null>(null);
  protected readonly export = signal<EtatExport>('repos');

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
        if (lecture.groupes.lue) this.groupes.set(lecture.groupes.valeur.groups);
        if (lecture.participants.lue) {
          this.participantsDeSeance.set(
            lecture.participants.valeur.participants.filter((participant) => !participant.evince),
          );
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

  protected creerGroupe(nom: string): Promise<void> {
    return this.commanderLesGroupes(async (sessionId) => {
      const groupe = await firstValueFrom(this.port.creerGroupe(sessionId, nom));
      this.groupes.update((groupes) => [...groupes, groupe]);
    });
  }

  protected renommerGroupe({ groupe, nom }: RenommageDeGroupe): Promise<void> {
    return this.commanderLesGroupes(async (sessionId) => {
      const renomme = await firstValueFrom(this.port.renommerGroupe(sessionId, groupe.id, nom));
      this.groupes.update((groupes) =>
        groupes.map((existant) => (existant.id === renomme.id ? renomme : existant)),
      );
    });
  }

  protected affecterParticipant({
    participantId,
    groupId,
  }: AffectationDeParticipant): Promise<void> {
    return this.commanderLesGroupes(async (sessionId) => {
      const commande =
        groupId === null
          ? this.port.retirerParticipantDuGroupe(sessionId, participantId)
          : this.port.affecterParticipant(sessionId, participantId, groupId);
      await lastValueFrom(commande, { defaultValue: undefined });
      this.participantsDeSeance.update((participants) =>
        participants.map((participant) =>
          participant.id === participantId ? { ...participant, groupId } : participant,
        ),
      );
    });
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
      groupes: lire(this.port.lireGroupes(sessionId)),
      participants: lire(this.port.lireParticipants(sessionId)),
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
        groupName: saisie.groupName,
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

  private async commanderLesGroupes(commande: (sessionId: string) => Promise<void>): Promise<void> {
    const sessionId = this.sessionId();
    if (sessionId === null) {
      return;
    }
    try {
      await commande(sessionId);
      this.refusDeGroupe.set(null);
    } catch (erreur) {
      const motif = erreur instanceof GroupeRefuse ? erreur.motif : 'echec';
      this.refusDeGroupe.set(motif);
      if (motif === 'introuvable') {
        this.relectures.next(sessionId);
      }
    }
  }
}
