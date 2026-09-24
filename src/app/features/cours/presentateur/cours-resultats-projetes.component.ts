import { PercentPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, of, Subject, switchMap } from 'rxjs';
import type {
  EcranDeroule,
  ResultatQuestion,
  ResultatsSeance,
} from '../../../../cours/content/types';
import type { ReponseLibreFormateur } from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import {
  enoncesDesActivites,
  identifiantsDuMontage,
  planDeMontage,
  questionsDeLEcran,
} from '../../../shared/slides/session/lecture-ecran';
import type { GroupeDeReponses } from './panneau-pedagogique/panneau-reponses-libres.component';
import { grouperLesReponses } from './panneau-pedagogique/panneau-reponses-libres.component';

const REPONSES_PROJETEES_PAR_QUESTION = 6;

type LectureDesReponses =
  | { readonly etat: 'lue'; readonly reponses: readonly ReponseLibreFormateur[] }
  | { readonly etat: 'echec' };

interface BarreDOption {
  readonly id: string;
  readonly libelle: string;
  readonly compte: number;
  readonly part: number;
}

interface ResultatProjete {
  readonly id: string;
  readonly enonce: string;
  readonly total: number;
  readonly correctes: number;
  readonly scoreMoyen: number | null;
  readonly barres: readonly BarreDOption[];
}

function barresDe(
  resultat: ResultatQuestion,
  options: readonly { readonly id: string; readonly libelle: string }[] | null,
): readonly BarreDOption[] {
  if (resultat.parOption === null || options === null) {
    return [];
  }
  const total = Math.max(resultat.total, 1);
  return options.map(({ id, libelle }) => {
    const compte = resultat.parOption?.[id] ?? 0;
    return { id, libelle, compte, part: compte / total };
  });
}

function resultatsProjetes(
  ecran: EcranDeroule,
  resultats: ResultatsSeance | null,
): readonly ResultatProjete[] {
  const enonces = new Map(questionsDeLEcran(ecran).map(({ id, enonce }) => [id, enonce]));
  const options = new Map(ecran.questions.map(({ id, options }) => [id, options]));
  for (const { id, enonce } of ecran.questions) {
    if (!enonces.has(id)) enonces.set(id, enonce);
  }
  const identifiants = new Set([
    ...enonces.keys(),
    ...ecran.corriges.map(({ questionId }) => questionId),
    ...(planDeMontage(ecran) ?? []).flatMap(identifiantsDuMontage),
  ]);
  return (resultats?.questions ?? [])
    .filter(({ questionId }) => identifiants.has(questionId))
    .map((resultat) => ({
      id: resultat.questionId,
      enonce: enonces.get(resultat.questionId) ?? '',
      total: resultat.total,
      correctes: resultat.correctes,
      scoreMoyen: resultat.scoreMoyen,
      barres: barresDe(resultat, options.get(resultat.questionId) ?? null),
    }));
}

@Component({
  selector: 'app-cours-resultats-projetes',
  standalone: true,
  imports: [PercentPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (actif()) {
      <aside class="resultats-projetes" data-testid="resultats-projetes" aria-live="polite">
        <header class="resultats-projetes__tete">
          <p class="resultats-projetes__titre" i18n="@@resultatsProjetesTitre">
            Résultats de la classe
          </p>
          <p class="resultats-projetes__participants" data-testid="resultats-projetes-participants">
            <span i18n="@@resultatsProjetesParticipants">Participants</span>
            <strong>{{ resultats()?.participants ?? 0 }}</strong>
          </p>
        </header>
        <div class="resultats-projetes__grille">
          @for (question of questions(); track question.id) {
            <section class="resultats-projetes__carte" data-testid="resultats-projetes-question">
              @if (question.enonce !== '') {
                <p class="resultats-projetes__enonce">{{ question.enonce }}</p>
              }
              <p class="resultats-projetes__compte">
                <strong data-testid="resultats-projetes-total">{{ question.total }}</strong>
                <span i18n="@@resultatsProjetesReponses">réponse(s)</span>
                @if (revele() && question.total > 0) {
                  ·
                  @if (question.scoreMoyen !== null) {
                    <span i18n="@@resultatsProjetesScoreMoyen">score moyen</span>
                    <strong>{{ question.scoreMoyen | percent }}</strong>
                  } @else {
                    <strong>{{ question.correctes / question.total | percent }}</strong>
                    <span i18n="@@resultatsProjetesJustes">de réponses justes</span>
                  }
                }
              </p>
              @if (question.barres.length > 0) {
                <ul class="resultats-projetes__barres">
                  @for (barre of question.barres; track barre.id) {
                    <li data-testid="resultats-projetes-barre" [attr.data-option]="barre.id">
                      <span class="resultats-projetes__libelle">{{ barre.libelle }}</span>
                      <span class="resultats-projetes__jauge">
                        <span [style.inline-size.%]="barre.part * 100"></span>
                      </span>
                      <strong>{{ barre.compte }}</strong>
                    </li>
                  }
                </ul>
              }
            </section>
          }
          @for (groupe of groupes(); track groupe.activityId) {
            <section class="resultats-projetes__carte" data-testid="resultats-projetes-libres">
              @if (groupe.enonce !== null) {
                <p class="resultats-projetes__enonce">{{ groupe.enonce }}</p>
              }
              <p class="resultats-projetes__compte">
                <strong>{{ groupe.reponses.length }}</strong>
                <span i18n="@@resultatsProjetesReponses">réponse(s)</span>
              </p>
              <ul class="resultats-projetes__libres">
                @for (reponse of dernieres(groupe); track reponse.id) {
                  <li data-testid="resultats-projetes-reponse">{{ reponse.response }}</li>
                }
              </ul>
            </section>
          }
          @if (lectureEchouee()) {
            <p
              class="resultats-projetes__vide"
              role="alert"
              data-testid="resultats-projetes-echec"
              i18n="@@resultatsProjetesEchec"
            >
              Les réponses libres n’ont pas pu être relues : elles le seront au prochain résultat.
            </p>
          }
          @if (questions().length === 0 && groupes().length === 0) {
            <p class="resultats-projetes__vide" i18n="@@resultatsProjetesVide">
              Aucune réponse reçue pour l’instant.
            </p>
          }
        </div>
      </aside>
    }
  `,
  styles: `
    .resultats-projetes {
      position: absolute;
      inset: 1.5rem;
      z-index: 2;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      gap: 1rem;
      box-sizing: border-box;
      padding: 1.5rem 2rem;
      border-radius: 1rem;
      background: var(--ivory, #fbf3e6);
      box-shadow: 0 0.75rem 2rem rgba(12, 9, 2, 0.2);
      overflow: hidden;
    }

    .resultats-projetes__tete {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
    }

    .resultats-projetes__titre {
      margin: 0;
      font-family: var(--font-display, Georgia, serif);
      font-size: 1.75rem;
      font-weight: 700;
    }

    .resultats-projetes__participants {
      display: flex;
      gap: 0.5rem;
      margin: 0;
      font-size: 1.1rem;
    }

    .resultats-projetes__grille {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
      align-content: start;
      gap: 1rem;
      min-block-size: 0;
    }

    .resultats-projetes__carte {
      display: grid;
      align-content: start;
      gap: 0.5rem;
      padding: 1rem 1.25rem;
      border: 1px solid var(--line, #e4d8c4);
      border-radius: 0.75rem;
      background: var(--cream, #fffaf2);
    }

    .resultats-projetes__enonce {
      margin: 0;
      font-weight: 600;
      font-size: 1.05rem;
      line-height: 1.35;
    }

    .resultats-projetes__compte {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      align-items: baseline;
      margin: 0;
      font-variant-numeric: tabular-nums;
    }

    .resultats-projetes__compte strong {
      font-size: 1.4rem;
    }

    .resultats-projetes__barres,
    .resultats-projetes__libres {
      display: grid;
      gap: 0.4rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .resultats-projetes__barres li {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 6rem auto;
      gap: 0.6rem;
      align-items: center;
    }

    .resultats-projetes__jauge {
      display: block;
      block-size: 0.6rem;
      border-radius: 999px;
      background: rgba(12, 9, 2, 0.08);
      overflow: hidden;
    }

    .resultats-projetes__jauge span {
      display: block;
      block-size: 100%;
      background: var(--teal, #4fb3a2);
    }

    .resultats-projetes__libres li {
      padding: 0.4rem 0.6rem;
      border-radius: 0.5rem;
      background: rgba(255, 255, 255, 0.6);
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .resultats-projetes__vide {
      margin: 0;
      font-size: 1.25rem;
    }
  `,
})
export class CoursResultatsProjetesComponent {
  readonly ecran = input.required<EcranDeroule>();
  readonly resultats = input<ResultatsSeance | null>(null);
  readonly sessionId = input<string | null>(null);
  readonly actif = input(false);
  readonly revele = input(false);

  protected readonly questions = computed(() => resultatsProjetes(this.ecran(), this.resultats()));

  private readonly enonces = computed<ReadonlyMap<string, string>>(
    () => new Map(enoncesDesActivites(this.ecran())),
  );

  private readonly reponsesLibres = signal<readonly ReponseLibreFormateur[]>([]);
  protected readonly lectureEchouee = signal(false);

  protected readonly groupes = computed<readonly GroupeDeReponses[]>(() => {
    const ecran = this.ecran().id;
    return this.enonces().size === 0
      ? []
      : grouperLesReponses(
          this.reponsesLibres().filter(({ screenId }) => screenId === ecran),
          this.enonces(),
        );
  });

  private readonly port = inject(FORMATIONS_PORT);
  private readonly relectures = new Subject<string>();

  constructor() {
    this.relectures
      .pipe(
        switchMap((sessionId) =>
          this.port.lireReponsesLibres(sessionId).pipe(
            map(({ responses }): LectureDesReponses => ({ etat: 'lue', reponses: responses })),
            catchError(() => of<LectureDesReponses>({ etat: 'echec' })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((lecture) => {
        this.lectureEchouee.set(lecture.etat === 'echec');
        if (lecture.etat === 'lue') this.reponsesLibres.set(lecture.reponses);
      });
    effect(() => {
      const sessionId = this.sessionId();
      this.resultats();
      if (this.actif() && sessionId !== null && this.enonces().size > 0) {
        this.relectures.next(sessionId);
      }
    });
  }

  protected dernieres(groupe: GroupeDeReponses): readonly ReponseLibreFormateur[] {
    return groupe.reponses.slice(-REPONSES_PROJETEES_PAR_QUESTION);
  }
}
