import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  signal,
} from '@angular/core';
import type { RapportIncidentResponseDto } from '../../../../../contrat/types.gen';
import { LIBELLES_DES_INCIDENTS } from '../../../core/models/libelles-des-incidents';
import type { ParticipantRapporte, RapportSeance } from '../../../core/ports/formations.port';
import { heureDuSite } from '../../../shared/pipes/date-du-site.pipe';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import { type Chargement, lectureSuivie } from '../lecture-suivie';
import type { DerouleCours, ResultatQuestion } from '../../../../cours/content/types';
import {
  enoncesDesActivites,
  enoncesDuDeroule,
} from '../../../shared/slides/session/lecture-ecran';
import { DefileurDeTableauComponent } from '../../../shared/slides/defileur-de-tableau/defileur-de-tableau.component';
import { telechargerFichier } from '../../../shared/utils/telechargement.utils';
import { chantierApresRendu } from './chantier-apres-rendu';
import { formaterPart } from '../../../../cours/runtime/core/typographie';

interface LigneClassement {
  participant: ParticipantRapporte;
  sansReponse: boolean;
}

interface IncidentLu {
  readonly heure: string;
  readonly libelle: string;
  readonly contexte: string;
}

function contexteLisible(contexte: RapportIncidentResponseDto['contexte']): string {
  return Object.entries(contexte ?? {})
    .map(([cle, valeur]) => `${cle} : ${String(valeur)}`)
    .join(', ');
}

const NOMBRE_CONFUSIONS_FREQUENTES = 5;

interface EnoncesDeLaSeance {
  readonly questions: ReadonlyMap<string, string>;
  readonly activites: ReadonlyMap<string, string>;
}

const AUCUN_ENONCE: EnoncesDeLaSeance = { questions: new Map(), activites: new Map() };

function enoncesDeLaSeance(deroule: DerouleCours): EnoncesDeLaSeance {
  return {
    questions: enoncesDuDeroule(deroule),
    activites: new Map(deroule.ecrans.flatMap((ecran) => [...enoncesDesActivites(ecran)])),
  };
}

@Component({
  selector: 'app-cours-synthese',
  standalone: true,
  imports: [DefileurDeTableauComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cours-synthese">
      <p class="cours-synthese__kicker" i18n="synthese.kicker|@@syntheseKicker">Après la séance</p>
      <h2 i18n="synthese.titre|@@syntheseTitre">Synthèse de la séance</h2>
      @if (vide()) {
        <p data-testid="synthese-vide" role="status" i18n="synthese.vide|@@syntheseVide">
          Aucun participant n'a rejoint cette séance : il n'y a rien à analyser.
        </p>
      } @else {
        <app-defileur-de-tableau>
          <table data-testid="synthese-classement">
            <thead>
              <tr>
                <th i18n="synthese.etudiant|@@syntheseEtudiant">Étudiant</th>
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
                    <td data-testid="synthese-avancement">
                      {{ formaterPart(ligne.participant.completion) }}
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </app-defileur-de-tableau>
        <section>
          <h3 i18n="synthese.questionsTitre|@@syntheseQuestionsTitre">Résultats par question</h3>
          <app-defileur-de-tableau>
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
                      @if (enonces().questions.get(question.questionId); as enonce) {
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
          </app-defileur-de-tableau>
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
                <span data-testid="synthese-fragile-concept">{{ fragile.libelle }}</span>
                <span data-testid="synthese-fragile-effectif">{{ fragile.effectif }}</span>
                <span i18n="synthese.seSontTrompes|@@syntheseSeSontTrompes"
                  >étudiants s’y sont trompés</span
                >
              </li>
            }
          </ul>
        </section>
        @if (auteursDeReponsesLibres().length > 0) {
          <section data-testid="synthese-libres">
            <h3 i18n="synthese.libresTitre|@@syntheseLibresTitre">Réponses libres des étudiants</h3>
            @for (participant of auteursDeReponsesLibres(); track participant.email) {
              <article>
                <h4 data-testid="synthese-libres-etudiant">
                  {{ participant.prenom }} {{ participant.nom }}
                </h4>
                <dl>
                  @for (libre of participant.reponsesLibres; track $index) {
                    <dt data-testid="synthese-libre-question">
                      {{ enonces().activites.get(libre.activityId) ?? libre.activityId }}
                    </dt>
                    <dd data-testid="synthese-libre-reponse">{{ libre.reponse }}</dd>
                  }
                </dl>
              </article>
            }
          </section>
        }
        @if (auteursDIncidents().length > 0) {
          <section data-testid="synthese-incidents">
            <h3 i18n="synthese.incidentsTitre|@@syntheseIncidentsTitre">
              Incidents relevés sur les postes
            </h3>
            @for (participant of auteursDIncidents(); track participant.email) {
              <article>
                <h4 data-testid="synthese-incidents-etudiant">
                  {{ participant.prenom }} {{ participant.nom }}
                </h4>
                <ul>
                  @for (incident of incidentsLus(participant); track $index) {
                    <li data-testid="synthese-incident">
                      <time data-testid="synthese-incident-heure">{{ incident.heure }}</time>
                      <span data-testid="synthese-incident-type">{{ incident.libelle }}</span>
                      @if (incident.contexte !== '') {
                        <small data-testid="synthese-incident-contexte">{{
                          incident.contexte
                        }}</small>
                      }
                    </li>
                  }
                </ul>
              </article>
            }
          </section>
        }
        <button
          type="button"
          class="btn btn-teal"
          data-testid="synthese-export"
          (click)="telecharger()"
          i18n="synthese.export|@@syntheseExport"
        >
          Exporter les réponses en CSV
        </button>
        @if (echecExport()) {
          <p
            data-testid="synthese-export-echec"
            role="alert"
            i18n="synthese.exportEchec|@@syntheseExportEchec"
          >
            Le CSV n’a pas pu être exporté. Réessayez.
          </p>
        }
      }
      @if (echec()) {
        <p data-testid="synthese-echec" role="alert" i18n="synthese.echec|@@syntheseEchec">
          La synthèse n'a pas pu être lue. Rechargez la page, puis réessayez.
        </p>
      }
    </div>
  `,
})
export class CoursSyntheseComponent {
  protected readonly formaterPart = formaterPart;
  readonly sessionId = input.required<string>();

  readonly rapport = signal<RapportSeance | null>(null);
  readonly echecExport = signal(false);

  private readonly lectureDuRapport = signal<Chargement>('repos');
  readonly echec = computed(() => this.lectureDuRapport() === 'echec');
  readonly enonces = signal<EnoncesDeLaSeance>(AUCUN_ENONCE);

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
        .sort((gauche, droite) => gauche.participant.completion - droite.participant.completion),
      ...lignes.filter((ligne) => ligne.sansReponse),
    ];
  });

  readonly fragiles = computed(() => this.rapport()?.conceptsFragiles ?? []);

  readonly questions = computed<readonly ResultatQuestion[]>(
    () => this.rapport()?.resultats.questions ?? [],
  );

  readonly confusionsFrequentes = computed(() =>
    (this.rapport()?.resultats.confusions ?? []).slice(0, NOMBRE_CONFUSIONS_FREQUENTES),
  );

  readonly auteursDeReponsesLibres = computed<readonly ParticipantRapporte[]>(() =>
    (this.rapport()?.participants ?? []).filter(
      (participant) => participant.reponsesLibres.length > 0,
    ),
  );

  readonly auteursDIncidents = computed<readonly ParticipantRapporte[]>(() =>
    (this.rapport()?.participants ?? []).filter((participant) => participant.incidents.length > 0),
  );

  private readonly locale = inject(LOCALE_ID);
  private readonly port = inject(FORMATIONS_PORT);
  private readonly document = inject(DOCUMENT);
  private readonly charger = lectureSuivie();

  private readonly chantier = chantierApresRendu(() => this.lire());

  quandStabilise(): Promise<void> {
    return this.chantier;
  }

  protected incidentsLus(participant: ParticipantRapporte): readonly IncidentLu[] {
    return participant.incidents.map((incident) => ({
      heure: heureDuSite(incident.horodatage, this.locale),
      libelle: LIBELLES_DES_INCIDENTS[incident.type],
      contexte: contexteLisible(incident.contexte),
    }));
  }

  protected telecharger(): void {
    this.echecExport.set(false);
    this.port.telechargerRapportCsv(this.sessionId()).subscribe({
      next: ({ nom, contenu }) => telechargerFichier(this.document, contenu, nom, contenu.type),
      error: () => this.echecExport.set(true),
    });
  }

  private async lire(): Promise<void> {
    await Promise.all([this.lireLeRapport(), this.lireLesEnonces()]);
  }

  private async lireLeRapport(): Promise<void> {
    const rapport = await this.charger(
      this.port.lireResultats(this.sessionId()),
      this.lectureDuRapport,
    );
    if (rapport !== null) {
      this.rapport.set(rapport);
    }
  }

  private async lireLesEnonces(): Promise<void> {
    const deroule = await this.charger(this.port.lireDeroule(this.sessionId()));
    if (deroule !== null) {
      this.enonces.set(enoncesDeLaSeance(deroule));
    }
  }
}
