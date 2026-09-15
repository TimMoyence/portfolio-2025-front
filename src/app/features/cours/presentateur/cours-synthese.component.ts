import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { ParticipantRapporte, RapportSeance } from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import type { DerouleCours, ResultatQuestion } from '../../../../cours/content/types';
import { questionsDeLEcran } from '../ecran/cours-ecran.component';

interface LigneClassement {
  participant: ParticipantRapporte;
  sansReponse: boolean;
}

interface ConceptCompte {
  concept: string;
  effectif: number;
}

interface ConfusionFrequente {
  readonly id: string;
  readonly libelle: string;
  readonly nombre: number;
}

const NOMBRE_CONFUSIONS_FREQUENTES = 5;

const SEPARATEUR = ';';

const ENTETE: readonly string[] = [
  'prenom',
  'nom',
  'adresse',
  'question',
  'concept',
  'valeur',
  'duree_ms',
];

const CARACTERES_A_PROTEGER = /[;"\n\r]/;
const CARACTERES_FORMULE = /^[=+@\t\r]/;
const NOMBRE_NEGATIF_VALIDE = /^-\d+([.,]\d+)?$/;

function neutraliser(champ: string): string {
  if (CARACTERES_FORMULE.test(champ)) {
    return `'${champ}`;
  }
  return champ.startsWith('-') && !NOMBRE_NEGATIF_VALIDE.test(champ) ? `'${champ}` : champ;
}

function echapper(champ: string): string {
  const sain = neutraliser(champ);
  return CARACTERES_A_PROTEGER.test(sain) ? `"${sain.replaceAll('"', '""')}"` : sain;
}

function ligneCsv(champs: readonly string[]): string {
  return champs.map(echapper).join(SEPARATEUR);
}

function enoncesDuDeroule(deroule: DerouleCours): ReadonlyMap<string, string> {
  return new Map(
    deroule.ecrans
      .flatMap((ecran) => questionsDeLEcran(ecran))
      .filter((question) => question.enonce !== '')
      .map((question) => [question.id, question.enonce]),
  );
}

function confusionsFrequentesDe(
  questions: readonly ResultatQuestion[],
): readonly ConfusionFrequente[] {
  const totaux = new Map<string, ConfusionFrequente>();
  for (const question of questions) {
    for (const confusion of question.confusions) {
      const existante = totaux.get(confusion.id);
      totaux.set(confusion.id, {
        id: confusion.id,
        libelle: existante?.libelle ?? confusion.libelle,
        nombre: (existante?.nombre ?? 0) + confusion.nombre,
      });
    }
  }
  return [...totaux.values()]
    .sort((gauche, droite) => droite.nombre - gauche.nombre || (gauche.id < droite.id ? -1 : 1))
    .slice(0, NOMBRE_CONFUSIONS_FREQUENTES);
}

@Component({
  selector: 'app-cours-synthese',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 i18n="synthese.titre|@@syntheseTitre">Synthèse de la séance</h2>
    @if (vide()) {
      <p data-testid="synthese-vide" role="status" i18n="synthese.vide|@@syntheseVide">
        Aucun participant n'a rejoint cette séance : il n'y a rien à analyser.
      </p>
    } @else {
      <table data-testid="synthese-classement">
        <thead>
          <tr>
            <th i18n="synthese.etudiant|@@syntheseEtudiant">Étudiant</th>
            <th i18n="synthese.score|@@syntheseScore">Score</th>
            <th i18n="synthese.avancement|@@syntheseAvancement">Avancement</th>
          </tr>
        </thead>
        <tbody>
          @for (ligne of classement(); track ligne.participant.email) {
            <tr data-testid="synthese-ligne">
              <td data-testid="synthese-nom">
                {{ ligne.participant.prenom }} {{ ligne.participant.nom }}
              </td>
              @if (ligne.sansReponse) {
                <td
                  data-testid="synthese-sans-reponse"
                  i18n="synthese.sansReponse|@@syntheseSansReponse"
                >
                  N'a répondu à aucune question
                </td>
              } @else {
                <td data-testid="synthese-score">{{ ligne.participant.note }}</td>
              }
              <td>{{ ligne.participant.completion }}</td>
            </tr>
          }
        </tbody>
      </table>
      <section>
        <h3 i18n="synthese.questionsTitre|@@syntheseQuestionsTitre">Résultats par question</h3>
        <table data-testid="synthese-questions">
          <caption i18n="synthese.questionsLegende|@@syntheseQuestionsLegende">
            Bonnes réponses, total et « je ne sais pas » pour chaque question de la séance
          </caption>
          <thead>
            <tr>
              <th scope="col" i18n="synthese.questionColonne|@@syntheseQuestionColonne">
                Question
              </th>
              <th scope="col" i18n="synthese.correctesColonne|@@syntheseCorrectesColonne">
                Bonnes réponses
              </th>
              <th scope="col" i18n="synthese.totalColonne|@@syntheseTotalColonne">Total</th>
              <th scope="col" i18n="synthese.neSaitPasColonne|@@syntheseNeSaitPasColonne">
                Je ne sais pas
              </th>
            </tr>
          </thead>
          <tbody>
            @for (question of questions(); track question.questionId) {
              <tr data-testid="synthese-question-ligne">
                <th scope="row">
                  @if (enonces().get(question.questionId); as enonce) {
                    <span data-testid="synthese-question-libelle">{{ enonce }}</span>
                  }
                  <small data-testid="synthese-question-id">{{ question.questionId }}</small>
                </th>
                <td data-testid="synthese-question-correctes">{{ question.correctes }}</td>
                <td data-testid="synthese-question-total">{{ question.total }}</td>
                <td data-testid="synthese-question-ne-sait-pas">{{ question.neSaitPas }}</td>
              </tr>
            }
          </tbody>
        </table>
      </section>
      <section>
        <h3 i18n="synthese.confusionsTitre|@@syntheseConfusionsTitre">
          Confusions fréquentes de la classe
        </h3>
        <ol data-testid="synthese-confusions">
          @for (confusion of confusionsFrequentes(); track confusion.id) {
            <li data-testid="synthese-confusion">
              <span data-testid="synthese-confusion-libelle">{{ confusion.libelle }}</span>
              <span data-testid="synthese-confusion-nombre">{{ confusion.nombre }}</span>
            </li>
          }
        </ol>
      </section>
      <section>
        <h3 i18n="synthese.fragiles|@@syntheseFragiles">Ce qui a le plus accroché</h3>
        <ul data-testid="synthese-fragiles">
          @for (fragile of fragiles(); track fragile.concept) {
            <li data-testid="synthese-fragile">
              <span data-testid="synthese-fragile-concept">{{ fragile.concept }}</span>
              <span data-testid="synthese-fragile-effectif">{{ fragile.effectif }}</span>
              <span i18n="synthese.sousSeuil|@@syntheseSousSeuil">étudiants sous le seuil</span>
            </li>
          }
        </ul>
      </section>
      <button
        type="button"
        data-testid="synthese-export"
        (click)="telecharger()"
        i18n="synthese.export|@@syntheseExport"
      >
        Exporter les réponses en CSV
      </button>
    }
    @if (echec()) {
      <p data-testid="synthese-echec" role="alert" i18n="synthese.echec|@@syntheseEchec">
        La synthèse n'a pas pu être lue. Rechargez la page, puis réessayez.
      </p>
    }
  `,
})
export class CoursSyntheseComponent {
  readonly sessionId = input.required<string>();

  readonly rapport = signal<RapportSeance | null>(null);
  readonly echec = signal(false);
  readonly enonces = signal<ReadonlyMap<string, string>>(new Map());

  readonly vide = computed(() => this.rapport()?.participants.length === 0);

  readonly classement = computed<readonly LigneClassement[]>(() => {
    const participants = this.rapport()?.participants ?? [];
    const lignes = participants.map((participant) => ({
      participant,
      sansReponse: participant.reponses.length === 0,
    }));
    return [
      ...lignes
        .filter((ligne) => !ligne.sansReponse)
        .sort((gauche, droite) => gauche.participant.note - droite.participant.note),
      ...lignes.filter((ligne) => ligne.sansReponse),
    ];
  });

  readonly fragiles = computed<readonly ConceptCompte[]>(() => {
    const rapport = this.rapport();
    if (rapport === null) {
      return [];
    }
    return rapport.conceptsFragiles
      .map((concept) => ({ concept, effectif: this.compterLesFreins(rapport, concept) }))
      .sort((gauche, droite) => droite.effectif - gauche.effectif);
  });

  readonly questions = computed<readonly ResultatQuestion[]>(
    () => this.rapport()?.resultats.questions ?? [],
  );

  readonly confusionsFrequentes = computed<readonly ConfusionFrequente[]>(() =>
    confusionsFrequentesDe(this.questions()),
  );

  private readonly port = inject(FORMATIONS_PORT);

  private acheve: () => void = () => undefined;
  private readonly chantier = new Promise<void>((resoudre) => {
    this.acheve = resoudre;
  });

  constructor() {
    afterNextRender(() => {
      void this.lire().then(this.acheve);
    });
  }

  quandStabilise(): Promise<void> {
    return this.chantier;
  }

  exporterCsv(): string {
    const participants = this.rapport()?.participants ?? [];
    const lignes = participants.flatMap((participant) =>
      participant.reponses.map((reponse) =>
        ligneCsv([
          participant.prenom,
          participant.nom,
          participant.email,
          reponse.questionId,
          reponse.concept,
          reponse.valeur,
          String(reponse.dureeMs),
        ]),
      ),
    );
    return [ENTETE.join(SEPARATEUR), ...lignes].join('\n');
  }

  protected telecharger(): void {
    const fichier = new Blob([this.exporterCsv()], { type: 'text/csv;charset=utf-8' });
    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(fichier);
    lien.download = `seance-${this.sessionId()}.csv`;
    lien.click();
    URL.revokeObjectURL(lien.href);
  }

  private compterLesFreins(rapport: RapportSeance, concept: string): number {
    return rapport.participants.filter(
      (participant) =>
        participant.sousSeuil &&
        participant.reponses.some((reponse) => reponse.concept === concept),
    ).length;
  }

  private async lire(): Promise<void> {
    await Promise.all([this.lireLeRapport(), this.lireLesEnonces()]);
  }

  private async lireLeRapport(): Promise<void> {
    try {
      this.rapport.set(await firstValueFrom(this.port.lireResultats(this.sessionId())));
    } catch {
      this.echec.set(true);
    }
  }

  private async lireLesEnonces(): Promise<void> {
    try {
      const deroule = await firstValueFrom(this.port.lireDeroule(this.sessionId()));
      this.enonces.set(enoncesDuDeroule(deroule));
    } catch {
      this.enonces.set(new Map());
    }
  }
}
