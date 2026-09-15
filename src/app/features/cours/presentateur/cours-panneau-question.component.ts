import { PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type {
  ConfusionComptee,
  CorrigePresentateur,
  DerouleCours,
  ResultatQuestion,
} from '../../../../cours/content/types';

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

const SANS_REPONSE: Omit<ResultatQuestion, 'questionId'> = {
  total: 0,
  correctes: 0,
  neSaitPas: 0,
  confusions: [],
};

function confusionDominante(confusions: readonly ConfusionComptee[]): ConfusionComptee | null {
  return confusions.reduce<ConfusionComptee | null>(
    (dominante, confusion) => (confusion.nombre > (dominante?.nombre ?? 0) ? confusion : dominante),
    null,
  );
}

function ecranDeRemediation(
  deroule: DerouleCours,
  confusion: ConfusionComptee | null,
): number | null {
  if (confusion === null || !Object.hasOwn(deroule.remediations, confusion.id)) {
    return null;
  }
  const cible = deroule.remediations[confusion.id];
  const index = deroule.ecrans.findIndex((ecran) => ecran.id === cible);
  return index === -1 ? null : index;
}

function lirePanneau(
  deroule: DerouleCours,
  seuil: number | null,
  corrige: CorrigePresentateur,
  resultats: readonly ResultatQuestion[],
): PanneauQuestion {
  const resultat =
    resultats.find((question) => question.questionId === corrige.questionId) ?? SANS_REPONSE;
  const part = resultat.total > 0 ? resultat.correctes / resultat.total : 0;
  const sousLeSeuil = seuil !== null && resultat.total > 0 && part < seuil;
  return {
    questionId: corrige.questionId,
    bonneReponse: corrige.bonneReponse,
    total: resultat.total,
    part,
    neSaitPas: resultat.neSaitPas,
    sousLeSeuil,
    confusions: corrige.confusions.map((confusion) => ({
      ...confusion,
      nombre: resultat.confusions.find((comptee) => comptee.id === confusion.id)?.nombre ?? 0,
    })),
    remediation: sousLeSeuil
      ? ecranDeRemediation(deroule, confusionDominante(resultat.confusions))
      : null,
  };
}

@Component({
  selector: 'app-cours-panneau-question',
  standalone: true,
  imports: [PercentPipe],
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
          <dd data-testid="presentateur-question-part">{{ panneau.part | percent }}</dd>
          <dt i18n="presentateur.neSaitPas|@@presentateurNeSaitPas">Je ne sais pas</dt>
          <dd data-testid="presentateur-question-ne-sait-pas">{{ panneau.neSaitPas }}</dd>
          @if (seuil() !== null) {
            <dt i18n="presentateur.seuil|@@presentateurSeuil">Seuil</dt>
            <dd data-testid="presentateur-question-seuil">{{ seuil() | percent }}</dd>
          }
          <dt i18n="presentateur.bonneReponse|@@presentateurBonneReponse">Bonne réponse</dt>
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
            [disabled]="commandeEnVol()"
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
  readonly question = input.required<QuestionDuPanneau>();
  readonly deroule = input.required<DerouleCours>();
  readonly seuil = input.required<number | null>();
  readonly resultats = input.required<readonly ResultatQuestion[]>();
  readonly participants = input.required<number>();
  readonly commandeEnVol = input.required<boolean>();
  readonly remediation = output<number>();

  protected readonly panneau = computed(() =>
    lirePanneau(this.deroule(), this.seuil(), this.question().corrige, this.resultats()),
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
