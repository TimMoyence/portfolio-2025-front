import { isPlatformBrowser, PercentPipe } from '@angular/common';
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
import type { EcranDeroule, ResultatQuestion } from '../../../../cours/content/types';
import type { QuestionDuPanneau } from './cours-panneau-question.component';

interface LectureClasse {
  readonly reponses: number;
  readonly correctes: number;
  readonly taux: number | null;
  readonly couverture: number;
  readonly confiance: 'Aucune donnée' | 'À confirmer' | 'Solide';
}

function resultatDe(
  questionIds: readonly string[],
  resultats: readonly ResultatQuestion[],
): ResultatQuestion | null {
  const correspondants = resultats.filter((resultat) => questionIds.includes(resultat.questionId));
  if (correspondants.length === 0) {
    return null;
  }
  return correspondants.reduce<ResultatQuestion>(
    (total, resultat) => ({
      questionId: 'ecran',
      total: total.total + resultat.total,
      correctes: total.correctes + resultat.correctes,
      neSaitPas: total.neSaitPas + resultat.neSaitPas,
      confusions: [],
    }),
    { questionId: 'ecran', total: 0, correctes: 0, neSaitPas: 0, confusions: [] },
  );
}

@Component({
  selector: 'app-cours-panneau-pedagogique',
  standalone: true,
  imports: [PercentPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }

    .pedagogie-panel {
      display: grid;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid rgba(12, 9, 2, 0.12);
      border-radius: 0.8rem;
      background: var(--ivory, #fbf3e6);
    }

    .pedagogie-panel__head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
    }

    .pedagogie-panel__head h3,
    .pedagogie-panel__head p {
      margin: 0;
    }

    .pedagogie-panel__head p {
      color: var(--ink-mute, #766f63);
      font-size: 0.75rem;
    }

    .pedagogie-block {
      display: grid;
      gap: 0.35rem;
      padding-block-start: 0.85rem;
      border-block-start: 1px solid rgba(12, 9, 2, 0.12);
    }

    .pedagogie-block dt {
      color: var(--teal-deep, #277c70);
      font-family: var(--font-mono, monospace);
      font-size: 0.67rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .pedagogie-block dd {
      margin: 0;
      line-height: 1.45;
    }

    .pedagogie-block ul {
      display: grid;
      gap: 0.3rem;
      margin: 0;
      padding-inline-start: 1rem;
    }

    .pedagogie-confidence {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.5rem;
      margin: 0;
    }

    .pedagogie-confidence div {
      padding: 0.65rem;
      border: 1px solid rgba(12, 9, 2, 0.12);
      border-radius: 0.65rem;
      background: rgba(255, 255, 255, 0.42);
    }

    .pedagogie-confidence__label {
      color: var(--ink-mute, #766f63);
      font-size: 0.7rem;
    }

    .pedagogie-confidence strong {
      margin: 0.2rem 0 0;
      font-weight: 700;
    }

    .pedagogie-form {
      display: grid;
      gap: 0.55rem;
    }

    .pedagogie-form label {
      color: var(--ink-mute, #766f63);
      font-size: 0.75rem;
      font-weight: 700;
    }

    .pedagogie-form input,
    .pedagogie-form textarea {
      box-sizing: border-box;
      width: 100%;
      border: 1px solid rgba(12, 9, 2, 0.16);
      border-radius: 0.55rem;
      background: var(--ivory, #fbf3e6);
      color: var(--ink, #0c0902);
      font: inherit;
      padding: 0.6rem 0.7rem;
    }

    .pedagogie-form textarea {
      min-height: 5.25rem;
      resize: vertical;
    }

    .pedagogie-form input:focus-visible,
    .pedagogie-form textarea:focus-visible {
      outline: 2px solid var(--teal, #4fb3a2);
      outline-offset: 2px;
    }

    .pedagogie-local {
      color: var(--ink-mute, #766f63);
      font-size: 0.72rem;
    }

    @media (max-width: 520px) {
      .pedagogie-confidence {
        grid-template-columns: 1fr;
      }
    }
  `,
  template: `
    <section class="pedagogie-panel" data-testid="presentateur-guide">
      <div class="pedagogie-panel__head">
        <h3>Guide de facilitation</h3>
        <p>Écran {{ ecran().id }}</p>
      </div>

      <dl class="pedagogie-block">
        <dt>Objectif de la diapositive</dt>
        <dd>{{ objectif() }}</dd>
      </dl>
      <dl class="pedagogie-block">
        <dt>Réponse attendue</dt>
        <dd>{{ reponseAttendue() }}</dd>
      </dl>
      <dl class="pedagogie-block">
        <dt>Erreurs typiques</dt>
        <dd>
          <ul>
            @for (erreur of erreursTypiques(); track erreur) {
              <li>{{ erreur }}</li>
            }
          </ul>
        </dd>
      </dl>
      <dl class="pedagogie-block">
        <dt>Relance à utiliser</dt>
        <dd>{{ relance() }}</dd>
      </dl>
      <dl class="pedagogie-block">
        <dt>Transition</dt>
        <dd>{{ transition() }}</dd>
      </dl>

      <dl class="pedagogie-block">
        <dt>Lecture de la classe</dt>
        <dd>
          <div class="pedagogie-confidence">
            <div>
              <span class="pedagogie-confidence__label">Taux de réussite</span>
              <strong>{{
                lectureClasse().taux === null ? '—' : (lectureClasse().taux | percent)
              }}</strong>
            </div>
            <div>
              <span class="pedagogie-confidence__label">Réponses</span>
              <strong>{{ lectureClasse().reponses }} / {{ participants() }}</strong>
            </div>
            <div>
              <span class="pedagogie-confidence__label">Confiance du diagnostic</span>
              <strong>{{ lectureClasse().confiance }}</strong>
            </div>
          </div>
        </dd>
      </dl>

      <div class="pedagogie-form pedagogie-block">
        <label for="presentateur-groupe">Groupe suivi</label>
        <input
          id="presentateur-groupe"
          type="text"
          [value]="groupe()"
          (input)="saisirGroupe($event)"
          placeholder="Classe entière ou nom du groupe"
        />
        <label for="presentateur-note">Note du formateur</label>
        <textarea
          id="presentateur-note"
          [value]="note()"
          (input)="saisirNote($event)"
          placeholder="Observation, étudiant à relancer, exemple à reprendre…"
        ></textarea>
        <small class="pedagogie-local">Notes conservées sur ce poste pour cette séance.</small>
      </div>
    </section>
  `,
})
export class CoursPanneauPedagogiqueComponent {
  readonly ecran = input.required<EcranDeroule>();
  readonly questions = input.required<readonly QuestionDuPanneau[]>();
  readonly resultats = input.required<readonly ResultatQuestion[]>();
  readonly participants = input.required<number>();
  readonly sessionId = input.required<string | null>();
  readonly nextScreenTitle = input('l’étape suivante');

  protected readonly note = signal('');
  protected readonly groupe = signal('Classe entière');

  private readonly platformId = inject(PLATFORM_ID);

  protected readonly objectif = computed(
    () =>
      (this.ecran().guide?.objectif ?? this.ecran().notes) ||
      'Faire comprendre le point de décision porté par cette diapositive.',
  );

  protected readonly reponseAttendue = computed(() => {
    const guide = this.ecran().guide?.reponseAttendue;
    if (guide) {
      return guide;
    }
    const question = this.questions()[0];
    return (
      question?.corrige.bonneReponse ?? 'Pas de réponse unique : faire formuler le raisonnement.'
    );
  });

  protected readonly erreursTypiques = computed(() => {
    const guide = this.ecran().guide?.erreursTypiques;
    if (guide && guide.length > 0) {
      return guide;
    }
    const confusions = this.ecran().corriges.flatMap((corrige) =>
      corrige.confusions.map((confusion) => confusion.libelle),
    );
    return confusions.length > 0 ? confusions : ['Confondre le constat et la conclusion.'];
  });

  protected readonly relance = computed(
    () =>
      this.ecran().guide?.relance ??
      'Quelle unité, quelle base ou quelle source faut-il vérifier avant de répondre ?',
  );

  protected readonly transition = computed(
    () =>
      this.ecran().guide?.transition ??
      `Après cet écran, passer à ${this.nextScreenTitle()} en demandant ce qui a changé dans le raisonnement.`,
  );

  protected readonly lectureClasse = computed<LectureClasse>(() => {
    const resultat = resultatDe(
      this.ecran().corriges.map((corrige) => corrige.questionId),
      this.resultats(),
    );
    const participants = this.participants();
    const couverture = participants > 0 && resultat ? resultat.total / participants : 0;
    let confiance: LectureClasse['confiance'] = 'Aucune donnée';
    if (resultat !== null && resultat.total > 0) {
      confiance = couverture >= 0.9 ? 'Solide' : 'À confirmer';
    }
    return {
      reponses: resultat?.total ?? 0,
      correctes: resultat?.correctes ?? 0,
      taux: resultat && resultat.total > 0 ? resultat.correctes / resultat.total : null,
      couverture,
      confiance,
    };
  });

  constructor() {
    effect(() => {
      const key = this.storageKey();
      if (key === null || !isPlatformBrowser(this.platformId)) {
        return;
      }
      this.note.set(localStorage.getItem(`${key}:note`) ?? '');
      this.groupe.set(localStorage.getItem(`${key}:groupe`) ?? 'Classe entière');
    });
  }

  private readonly storageKey = computed(() => {
    const sessionId = this.sessionId();
    return sessionId === null ? null : `cours-formateur:${sessionId}:${this.ecran().id}`;
  });

  protected saisirNote(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.note.set(value);
    this.enregistrer('note', value);
  }

  protected saisirGroupe(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.groupe.set(value);
    this.enregistrer('groupe', value);
  }

  private enregistrer(type: 'note' | 'groupe', value: string): void {
    const key = this.storageKey();
    if (key !== null && isPlatformBrowser(this.platformId)) {
      localStorage.setItem(`${key}:${type}`, value);
    }
  }
}
