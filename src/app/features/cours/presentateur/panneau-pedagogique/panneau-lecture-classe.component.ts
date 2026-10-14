import { PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type {
  EcranDeroule,
  ProgressionEnigme,
  ResultatQuestion,
} from '../../../../../cours/content/types';
import type { ReponseLibreFormateur } from '../../../../core/ports/formations.port';
import {
  enoncesDesActivites,
  identifiantsDuMontage,
  planDeMontage,
} from '../../../../shared/slides/session/lecture-ecran';

type Confiance = 'aucune' | 'a-confirmer' | 'solide';

interface LigneDeLecture {
  readonly reponses: number;
  readonly taux: number | null;
  readonly avecTaux: boolean;
}

interface SourcesDeLecture {
  readonly resultats: readonly ResultatQuestion[];
  readonly enigmes: readonly ProgressionEnigme[];
  readonly reponsesLibres: readonly ReponseLibreFormateur[];
}

const COUVERTURE_SOLIDE = 0.9;

const LIBELLES_CONFIANCE: Readonly<Record<Confiance, string>> = {
  aucune: $localize`:@@panneauLectureConfianceAucune:Aucune donnée`,
  'a-confirmer': $localize`:@@panneauLectureConfianceAConfirmer:À confirmer`,
  solide: $localize`:@@panneauLectureConfianceSolide:Solide`,
};

function ligneDEnigme(enigme: ProgressionEnigme): LigneDeLecture {
  return {
    reponses: enigme.ouvertes,
    taux: enigme.ouvertes > 0 ? enigme.resolues / enigme.ouvertes : null,
    avecTaux: true,
  };
}

function ligneDeResultat(resultat: ResultatQuestion | undefined): LigneDeLecture {
  const reponses = resultat?.total ?? 0;
  return {
    reponses,
    taux:
      resultat === undefined || reponses === 0
        ? null
        : (resultat.scoreMoyen ?? resultat.correctes / reponses),
    avecTaux: true,
  };
}

function ligneDActivite(
  ecranId: string,
  activityId: string,
  reponsesLibres: readonly ReponseLibreFormateur[],
): LigneDeLecture {
  const auteurs = new Set(
    reponsesLibres
      .filter((reponse) => reponse.screenId === ecranId && reponse.activityId === activityId)
      .map((reponse) => reponse.participantId),
  );
  return { reponses: auteurs.size, taux: null, avecTaux: false };
}

function lireLaClasse(ecran: EcranDeroule, sources: SourcesDeLecture): readonly LigneDeLecture[] {
  const parcours = new Set((planDeMontage(ecran) ?? []).flatMap(identifiantsDuMontage));
  const questionIds = ecran.questions.map((question) => question.id);
  const activites = [...enoncesDesActivites(ecran).keys()].filter(
    (activityId) => !questionIds.includes(activityId),
  );
  return [
    ...questionIds.map((questionId) => {
      const enigme = sources.enigmes.find(
        (candidate) => parcours.has(candidate.parcoursId) && candidate.enigmeId === questionId,
      );
      return enigme === undefined
        ? ligneDeResultat(sources.resultats.find((resultat) => resultat.questionId === questionId))
        : ligneDEnigme(enigme);
    }),
    ...activites.map((activityId) => ligneDActivite(ecran.id, activityId, sources.reponsesLibres)),
  ];
}

function confianceDe(lignes: readonly LigneDeLecture[], participants: number): Confiance | null {
  const notees = lignes.filter((ligne) => ligne.avecTaux);
  if (notees.length === 0) {
    return null;
  }
  if (notees.every((ligne) => ligne.reponses === 0)) {
    return 'aucune';
  }
  return participants > 0 &&
    notees.every((ligne) => ligne.reponses / participants >= COUVERTURE_SOLIDE)
    ? 'solide'
    : 'a-confirmer';
}

@Component({
  selector: 'app-panneau-lecture-classe',
  standalone: true,
  imports: [PercentPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './panneau-lecture-classe.component.scss',
  template: `
    @if (lignes().length > 0) {
      <section class="panneau-lecture" aria-labelledby="panneau-lecture-titre">
        <h4 id="panneau-lecture-titre" class="panneau-lecture__titre" i18n="@@panneauLectureTitre">
          Lecture de la classe
        </h4>
        <table class="panneau-lecture__lignes">
          <thead>
            <tr>
              <th scope="col" i18n="@@panneauLectureQuestion">Question</th>
              <th scope="col" i18n="@@panneauLectureReponses">Réponses</th>
              <th scope="col" i18n="@@panneauLectureTaux">Taux de réussite</th>
            </tr>
          </thead>
          <tbody>
            @for (ligne of lignes(); track $index) {
              <tr data-testid="lecture-classe-ligne">
                <th scope="row" i18n="@@panneauLectureRang">Q{{ $index + 1 }}</th>
                <td>{{ ligne.reponses }} / {{ participants() }}</td>
                <td>
                  @if (ligne.avecTaux) {
                    {{ ligne.taux === null ? '—' : (ligne.taux | percent) }}
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (libelleConfiance(); as libelle) {
          <p class="panneau-lecture__confiance">
            <span i18n="@@panneauLectureConfiance">Confiance du diagnostic</span>
            <strong data-testid="lecture-classe-confiance">{{ libelle }}</strong>
          </p>
        }
      </section>
    }
  `,
})
export class PanneauLectureClasseComponent {
  readonly ecran = input.required<EcranDeroule>();
  readonly resultats = input.required<readonly ResultatQuestion[]>();
  readonly enigmes = input<readonly ProgressionEnigme[]>([]);
  readonly reponsesLibres = input<readonly ReponseLibreFormateur[]>([]);
  readonly participants = input.required<number>();

  protected readonly lignes = computed(() =>
    lireLaClasse(this.ecran(), {
      resultats: this.resultats(),
      enigmes: this.enigmes(),
      reponsesLibres: this.reponsesLibres(),
    }),
  );

  protected readonly libelleConfiance = computed(() => {
    const confiance = confianceDe(this.lignes(), this.participants());
    return confiance === null ? null : LIBELLES_CONFIANCE[confiance];
  });
}
