import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type {
  ConfusionComptee,
  CorrigePresentateur,
  DerouleCours,
  ResultatQuestion,
} from '../../../../cours/content/types';
import { deLaQuestion } from '../../../shared/slides/session/lecture-ecran';
import { formaterPart } from '../../../../cours/runtime/core/typographie';

export interface QuestionDuPanneau {
  readonly numero: number;
  readonly enonce: string;
  readonly corrige: CorrigePresentateur;
}

interface PanneauQuestion {
  readonly questionId: string;
  readonly bonneReponse: string;
  readonly total: number;
  readonly part: number;
  readonly neSaitPas: number;
  readonly sousLeSeuil: boolean;
  readonly confusions: readonly ConfusionComptee[];
  readonly remediation: number | null;
}

const SANS_REPONSE: Pick<
  ResultatQuestion,
  'total' | 'neSaitPas' | 'confusions' | 'part' | 'sousLeSeuil' | 'remediation'
> = {
  total: 0,
  neSaitPas: 0,
  confusions: [],
  part: 0,
  sousLeSeuil: false,
  remediation: null,
};

function rangDeLEcran(deroule: DerouleCours, ecranId: string): number | null {
  const index = deroule.ecrans.findIndex((ecran) => ecran.id === ecranId);
  return index === -1 ? null : index;
}

function lirePanneau(
  deroule: DerouleCours,
  corrige: CorrigePresentateur,
  resultats: readonly ResultatQuestion[],
): PanneauQuestion {
  const resultat = deLaQuestion(resultats, corrige.questionId) ?? SANS_REPONSE;
  return {
    questionId: corrige.questionId,
    bonneReponse: corrige.bonneReponse,
    total: resultat.total,
    part: resultat.part,
    neSaitPas: resultat.neSaitPas,
    sousLeSeuil: resultat.sousLeSeuil,
    confusions: corrige.confusions.map((confusion) => ({
      ...confusion,
      nombre: resultat.confusions.find((comptee) => comptee.id === confusion.id)?.nombre ?? 0,
    })),
    remediation:
      resultat.remediation === null ? null : rangDeLEcran(deroule, resultat.remediation.ecranId),
  };
}

@Component({
  selector: 'app-cours-panneau-question',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }

    [data-etat='sous-le-seuil'] {
      border-inline-start: 0.375rem solid currentColor;
      padding-inline-start: 0.75rem;
    }
  `,
  template: `
    @if (panneau(); as panneau) {
      <article
        data-testid="presentateur-question"
        [attr.data-question]="panneau.questionId"
        [attr.data-etat]="panneau.sousLeSeuil ? 'sous-le-seuil' : null"
      >
        <h3
          data-testid="presentateur-question-titre"
          i18n="presentateur.questionTitre|@@presentateurQuestionTitre"
        >
          Question {{ question().numero }}
        </h3>
        <p data-testid="presentateur-question-enonce">{{ enonce() }}</p>
        <dl>
          <dt i18n="presentateur.reponses|@@presentateurReponses">Réponses reçues</dt>
          <dd data-testid="presentateur-question-total">
            {{ panneau.total }} / {{ participants() }}
          </dd>
          <dt i18n="presentateur.part|@@presentateurPart">Bonnes réponses</dt>
          <dd data-testid="presentateur-question-part">{{ formaterPart(panneau.part) }}</dd>
          <dt i18n="presentateur.neSaitPas|@@presentateurNeSaitPas">Je ne sais pas</dt>
          <dd data-testid="presentateur-question-ne-sait-pas">{{ panneau.neSaitPas }}</dd>
          @if (seuil() !== null) {
            <dt i18n="presentateur.seuil|@@presentateurSeuil">Seuil</dt>
            <dd data-testid="presentateur-question-seuil">{{ formaterPart(seuil()) }}</dd>
          }
          <dt i18n="presentateur.reponseAttendue|@@presentateurReponseAttendue">
            Réponse attendue
          </dt>
          <dd data-testid="presentateur-question-bonne-reponse">{{ panneau.bonneReponse }}</dd>
        </dl>
        @if (panneau.sousLeSeuil) {
          <p
            data-testid="presentateur-question-alerte"
            i18n="presentateur.sousLeSeuil|@@presentateurSousLeSeuil"
          >
            Sous le seuil : la classe n'a pas encore compris.
          </p>
        }
        <ul>
          @for (confusion of panneau.confusions; track confusion.id) {
            <li data-testid="presentateur-confusion" [attr.data-confusion]="confusion.id">
              <span>{{ confusion.libelle }}</span>
              <span data-testid="presentateur-confusion-nombre">{{ confusion.nombre }}</span>
            </li>
          }
        </ul>
        @if (panneau.remediation !== null) {
          <button
            type="button"
            data-testid="presentateur-remediation"
            [disabled]="pilotageBloque()"
            (click)="allerALaRemediation()"
            i18n="presentateur.remediation|@@presentateurRemediation"
          >
            Aller à la remédiation
          </button>
        }
      </article>
    }
  `,
})
export class CoursPanneauQuestionComponent {
  protected readonly formaterPart = formaterPart;
  readonly question = input.required<QuestionDuPanneau>();
  readonly deroule = input.required<DerouleCours>();
  readonly seuil = input.required<number | null>();
  readonly resultats = input.required<readonly ResultatQuestion[]>();
  readonly participants = input.required<number>();
  readonly pilotageBloque = input.required<boolean>();
  readonly remediation = output<number>();

  protected readonly panneau = computed(() =>
    lirePanneau(this.deroule(), this.question().corrige, this.resultats()),
  );

  protected readonly enonce = computed(() => {
    const question = this.question();
    return question.enonce === '' ? question.corrige.questionId : question.enonce;
  });

  protected allerALaRemediation(): void {
    const cible = this.panneau().remediation;
    if (cible !== null) {
      this.remediation.emit(cible);
    }
  }
}
