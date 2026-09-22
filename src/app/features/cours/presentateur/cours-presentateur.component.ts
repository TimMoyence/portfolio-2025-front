import { isPlatformBrowser, Location, PercentPipe } from '@angular/common';
import type { ElementRef, WritableSignal } from '@angular/core';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  Injector,
  input,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import type {
  DerouleCours,
  EcranDeroule,
  PacingMode,
  PilotageEcran,
  ResultatQuestion,
  ResultatsSeance,
} from '../../../../cours/content/types';
import type {
  EtatSession,
  StatutFlux,
  StatutSession,
  Sync,
} from '../../../../cours/runtime/core/sync';
import type {
  CommandePilotage,
  RapportSeance,
  RegleNotation,
  SyntheseConcept,
} from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import { CREATEUR_FLUX_FORMATEUR } from '../cours-flux.token';
import type { DirectEcran } from '../../../shared/slides/session/contrat-hote';
import { enoncesDuDeroule, questionsDeLEcran } from '../../../shared/slides/session/lecture-ecran';
import { CoursPresentationComponent } from '../../../shared/slides/session/cours-presentation.component';
import { objet } from '../../../shared/slides/visual/presentation-v2';
import type { CommandeDEcran, ResultatsDuPupitre } from './cours-panneau-activite.component';
import { CoursPanneauActiviteComponent } from './cours-panneau-activite.component';
import type { QuestionDuPanneau } from './cours-panneau-question.component';
import { CoursPanneauQuestionComponent } from './cours-panneau-question.component';
import { CoursPanneauPedagogiqueComponent } from './cours-panneau-pedagogique.component';
import { phraseDeNotation } from './regle-de-notation';

type EtatSeance = 'fermee' | 'ouverte' | 'en_cours' | 'terminee';

type LectureDeLaNotation = 'a-lire' | 'lue' | 'echec';

function resultatsDuRapport(rapport: RapportSeance): ResultatsSeance {
  return rapport.statistiques === undefined
    ? rapport.resultats
    : { ...rapport.resultats, statistiques: rapport.statistiques };
}

type Chargement = 'repos' | 'chargement' | 'succes' | 'echec';

type MotifDuRefus = 'session' | 'saturation' | 'autre';

interface RefusDuFlux {
  readonly statut: number;
  readonly motif: MotifDuRefus;
}

function motifDuRefus(statut: number): MotifDuRefus {
  if (statut === 401 || statut === 403) {
    return 'session';
  }
  return statut === 429 ? 'saturation' : 'autre';
}

const RANG_DE_L_ETAT: Readonly<Record<EtatSeance, number>> = {
  fermee: 0,
  ouverte: 1,
  en_cours: 2,
  terminee: 3,
};

const ETAT_ANNONCE: Readonly<Record<StatutSession, EtatSeance>> = {
  attente: 'ouverte',
  en_cours: 'en_cours',
  terminee: 'terminee',
};

const FENETRE_SCENE = 'cours-scene';
const ECRAN_DE_RAPPEL = 'fp-spaced';

function questionsDuPanneau(ecran: EcranDeroule): readonly QuestionDuPanneau[] {
  const apercu = questionsDeLEcran(ecran);
  let horsApercu = apercu.length;
  const questions = ecran.corriges.map((corrige) => {
    const position = apercu.findIndex((question) => question.id === corrige.questionId);
    if (position !== -1) {
      return { numero: position + 1, enonce: apercu[position].enonce, corrige };
    }
    horsApercu += 1;
    return { numero: horsApercu, enonce: '', corrige };
  });
  return questions.sort((gauche, droite) => gauche.numero - droite.numero);
}

@Component({
  selector: 'app-cours-presentateur',
  standalone: true,
  imports: [
    CoursPanneauActiviteComponent,
    CoursPanneauQuestionComponent,
    CoursPanneauPedagogiqueComponent,
    CoursPresentationComponent,
    PercentPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: '',
  template: `
    <div class="cours-presentateur">
      @if (statut() === 'fermee' && seance() === undefined && ouverture() === 'echec') {
        <button
          type="button"
          class="btn btn-teal presentateur-open"
          data-testid="presentateur-ouvrir"
          [disabled]="ouverture() === 'chargement'"
          (click)="ouvrir()"
          i18n="presentateur.ouvrir|@@presentateurOuvrir"
        >
          Ouvrir la séance
        </button>
      }
      @switch (ouverture()) {
        @case ('chargement') {
          <p
            data-testid="presentateur-ouverture-chargement"
            role="status"
            i18n="presentateur.ouvertureChargement|@@presentateurOuvertureChargement"
          >
            Ouverture de la séance…
          </p>
        }
        @case ('echec') {
          <p
            data-testid="presentateur-ouverture-echec"
            role="alert"
            i18n="presentateur.ouvertureEchec|@@presentateurOuvertureEchec"
          >
            La séance n'a pas pu être ouverte. Vérifiez la connexion, puis réessayez.
          </p>
        }
      }
      @switch (reprise()) {
        @case ('chargement') {
          <p
            data-testid="presentateur-reprise-chargement"
            role="status"
            i18n="presentateur.repriseChargement|@@presentateurRepriseChargement"
          >
            Reprise de la séance…
          </p>
        }
        @case ('echec') {
          <p
            data-testid="presentateur-reprise-echec"
            role="alert"
            i18n="presentateur.repriseEchec|@@presentateurRepriseEchec"
          >
            La séance n'a pas pu être reprise. Vérifiez la connexion, puis réessayez.
          </p>
          <button
            type="button"
            data-testid="presentateur-reprise-reessayer"
            (click)="reessayerLaReprise()"
            i18n="presentateur.repriseReessayer|@@presentateurRepriseReessayer"
          >
            Réessayer la reprise
          </button>
        }
      }
      @if (sessionId() !== null && etatDuFlux() !== 'connecte') {
        <p
          class="presentateur-flux"
          data-testid="presentateur-flux"
          role="status"
          [attr.data-etat]="etatDuFlux()"
          [attr.data-statut]="refusDuFlux()?.statut ?? null"
        >
          @switch (etatDuFlux()) {
            @case ('reconnexion') {
              <span i18n="presentateur.fluxReconnexion|@@presentateurFluxReconnexion"
                >Suivi de la séance interrompu : reconnexion en cours. Les résultats et la scène
                peuvent être en retard.</span
              >
            }
            @case ('refuse') {
              @if (refusDuFlux(); as refus) {
                @switch (refus.motif) {
                  @case ('session') {
                    <span i18n="presentateur.fluxRefusSession|@@presentateurFluxRefusSession"
                      >Le serveur refuse le suivi de la séance (statut {{ refus.statut }}) :
                      rechargez le pupitre, reconnectez-vous si la connexion est demandée ; la
                      séance reprendra.</span
                    >
                  }
                  @case ('saturation') {
                    <span i18n="presentateur.fluxRefusSaturation|@@presentateurFluxRefusSaturation"
                      >Trop de connexions au suivi de cette séance (statut {{ refus.statut }}) :
                      fermez les onglets en trop ; nouvel essai automatique.</span
                    >
                  }
                  @default {
                    <span i18n="presentateur.fluxRefus|@@presentateurFluxRefus"
                      >Le serveur refuse le suivi de la séance (statut {{ refus.statut }}) : nouvel
                      essai automatique.</span
                    >
                  }
                }
              }
            }
            @default {
              <span i18n="presentateur.fluxConnexion|@@presentateurFluxConnexion"
                >Connexion au suivi de la séance…</span
              >
            }
          }
        </p>
      }
      @if (code() !== null) {
        <section class="join-panel">
          <div>
            <h2 i18n="presentateur.codeTitre|@@presentateurCodeTitre">Code à dicter à la classe</h2>
            <p class="code-seance" data-testid="presentateur-code">{{ code() }}</p>
          </div>
          <div class="join-panel__meta">
            <p data-testid="presentateur-participants">
              <span i18n="presentateur.participants|@@presentateurParticipants">Participants</span>
              <strong data-testid="presentateur-participants-nombre">{{ participants() }}</strong>
            </p>
            <span i18n="presentateur.participantsEnDirect|@@presentateurParticipantsEnDirect"
              >connectés à cette séance</span
            >
            @if (resultats()?.statistiques; as statistiques) {
              <dl class="join-panel__stats" data-testid="presentateur-statistiques">
                <div>
                  <dt i18n="@@presentateurStatMoyenne">Moyenne</dt>
                  <dd>{{ statistiques.moyenne }}</dd>
                </div>
                <div>
                  <dt i18n="@@presentateurStatMediane">Médiane</dt>
                  <dd>{{ statistiques.mediane }}</dd>
                </div>
                <div>
                  <dt i18n="@@presentateurStatDispersion">Dispersion (écart-type)</dt>
                  <dd>{{ statistiques.dispersion }}</dd>
                </div>
                <div>
                  <dt i18n="@@presentateurStatParticipation">Participation</dt>
                  <dd>{{ statistiques.tauxParticipation | percent }}</dd>
                </div>
                <div>
                  <dt i18n="@@presentateurStatReussite">Réussite</dt>
                  <dd>{{ statistiques.tauxReussite | percent }}</dd>
                </div>
                <div class="join-panel__problemes">
                  <dt i18n="@@presentateurStatProblemes">Questions problématiques</dt>
                  <dd>
                    @for (libelle of questionsProblematiques(); track $index) {
                      <span class="join-panel__probleme">{{ libelle }}</span>
                    } @empty {
                      <span i18n="@@presentateurStatAucunProbleme">Aucune</span>
                    }
                  </dd>
                </div>
              </dl>
            }
            @switch (lectureDeLaNotation()) {
              @case ('lue') {
                @if (regleDeNotation(); as regle) {
                  <div class="notation-help">
                    <button
                      type="button"
                      class="notation-help__button"
                      data-testid="presentateur-notation-help"
                      aria-describedby="presentateur-notation-tooltip"
                      aria-label="Afficher la règle de notation"
                      i18n-aria-label="@@presentateurNotationAide"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 10.5v6"></path>
                        <circle cx="12" cy="7.25" r="0.8"></circle>
                      </svg>
                    </button>
                    <div
                      id="presentateur-notation-tooltip"
                      class="notation-help__tooltip"
                      role="tooltip"
                      data-testid="presentateur-notation-tooltip"
                    >
                      {{ regle }}
                    </div>
                  </div>
                }
              }
              @case ('echec') {
                <p
                  class="join-panel__notation"
                  data-testid="presentateur-notation-echec"
                  i18n="@@presentateurNotationEchec"
                >
                  La règle de notation n’a pas pu être lue.
                </p>
              }
            }
          </div>
        </section>
      }
      @switch (lectureDeroule()) {
        @case ('chargement') {
          <p
            data-testid="presentateur-deroule-chargement"
            role="status"
            i18n="presentateur.derouleChargement|@@presentateurDerouleChargement"
          >
            Chargement du déroulé…
          </p>
        }
        @case ('echec') {
          <p
            data-testid="presentateur-deroule-echec"
            role="alert"
            i18n="presentateur.derouleEchec|@@presentateurDerouleEchec"
          >
            Le déroulé de la séance n'a pas pu être chargé.
          </p>
          <button
            type="button"
            data-testid="presentateur-deroule-reessayer"
            (click)="relireLeDeroule()"
            i18n="presentateur.derouleReessayer|@@presentateurDerouleReessayer"
          >
            Réessayer
          </button>
        }
      }
      @if (deroule() === null) {
        <h1 class="sr-only" i18n="presentateur.titreChargement|@@presentateurTitreChargement">
          Pupitre
        </h1>
      }
      @if (deroule(); as cours) {
        <div class="course-heading">
          <div>
            <h1 data-testid="presentateur-titre">{{ cours.titre }}</h1>
          </div>
          <span class="session-state" data-testid="presentateur-statut">
            @if (statut() === 'ouverte') {
              <span i18n="presentateur.statutOuverte|@@presentateurStatutOuverte"
                >Prête à démarrer</span
              >
            } @else if (statut() === 'en_cours') {
              <span i18n="presentateur.statutEnCours|@@presentateurStatutEnCours">En cours</span>
            } @else {
              <span i18n="presentateur.statutTerminee|@@presentateurStatutTerminee">Terminée</span>
            }
          </span>
        </div>
        @if (statut() === 'ouverte' || statut() === 'en_cours') {
          @if (statut() === 'ouverte') {
            <button
              type="button"
              class="btn btn-teal"
              data-testid="presentateur-demarrer"
              [disabled]="pilotageBloque()"
              (click)="demarrer()"
              i18n="presentateur.demarrer|@@presentateurDemarrer"
            >
              Démarrer la séance
            </button>
          }
          <div class="presentateur-controls">
            <nav
              class="presentateur-control-nav"
              aria-label="Pilotage des écrans"
              i18n-aria-label="@@presentateurPilotage"
            >
              <button
                type="button"
                class="control-btn"
                data-testid="presentateur-precedent"
                [disabled]="pilotageBloque() || ecran() <= 0"
                (click)="precedent()"
                i18n="presentateur.precedent|@@presentateurPrecedent"
              >
                Écran précédent
              </button>
              <output data-testid="presentateur-ecran"
                >{{ ecran() + 1 }} / {{ cours.ecrans.length }}</output
              >
              <button
                type="button"
                class="control-btn"
                data-testid="presentateur-suivant"
                [disabled]="pilotageBloque() || ecran() >= dernierEcran()"
                (click)="suivant()"
                i18n="presentateur.suivant|@@presentateurSuivant"
              >
                Écran suivant
              </button>
              <button
                type="button"
                class="control-btn rhythm-toggle"
                data-testid="presentateur-rythme"
                [attr.aria-pressed]="mode() === 'libre'"
                [attr.data-mode]="mode()"
                [disabled]="pilotageBloque()"
                (click)="basculerLeRythme()"
                aria-label="Changer le rythme de la séance"
                i18n-aria-label="@@presentateurChangerRythme"
              >
                <span
                  class="rhythm-toggle__track"
                  data-testid="presentateur-rythme-mode"
                  [attr.data-mode]="mode()"
                  aria-hidden="true"
                >
                  <span i18n="presentateur.modePilote|@@presentateurModePilote">Piloté</span>
                  <span i18n="presentateur.modeLibre|@@presentateurModeLibre">Libre</span>
                </span>
              </button>
              <button
                type="button"
                class="control-btn control-btn--accent"
                data-testid="presentateur-plein-ecran"
                (click)="ouvrirLaScene()"
                aria-label="Ouvrir la projection en plein écran"
                i18n-aria-label="presentateur.pleinEcranAria|@@presentateurPleinEcranAria"
                i18n="presentateur.pleinEcran|@@presentateurPleinEcran"
              >
                Projection plein écran
              </button>
            </nav>
            <div class="screen-progress">
              <label for="presentateur-slider" i18n="presentateur.slider|@@presentateurSlider"
                >Écran courant</label
              >
              <input
                id="presentateur-slider"
                type="range"
                data-testid="presentateur-slider"
                min="0"
                [max]="dernierEcran()"
                [value]="ecran()"
                [style.--progress]="(ecran() / (dernierEcran() || 1)) * 100 + '%'"
                [disabled]="pilotageBloque()"
                (input)="changerLEcranDepuisLeCurseur($event)"
              />
              <output data-testid="presentateur-ecran-slider"
                >{{ ecran() + 1 }} / {{ cours.ecrans.length }}</output
              >
            </div>
          </div>
          @if (ecranCourant(); as ecranAffiche) {
            <div class="presentateur-workspace">
              <main class="presentateur-stage" aria-labelledby="presentateur-stage-titre">
                <div class="presentateur-stage__head">
                  <h3
                    id="presentateur-stage-titre"
                    i18n="presentateur.stageTitre|@@presentateurStageTitre"
                  >
                    Écran projeté
                  </h3>
                  <span class="muted" i18n="presentateur.stageApercu|@@presentateurStageApercu"
                    >Aperçu formateur</span
                  >
                </div>
                <div class="presentateur-stage__body">
                  <app-cours-presentation
                    mode="formateur"
                    [slide]="ecranAffiche"
                    [resultats]="resultats()"
                    [direct]="direct()"
                    [donneesFormateur]="ecranAffiche.corrigeEcran"
                    [maitrise]="maitrise()"
                  />
                  @if (maitriseIndisponible()) {
                    <p
                      class="muted"
                      data-testid="presentateur-maitrise-echec"
                      role="status"
                      i18n="@@presentateurMaitriseEchec"
                    >
                      La carte de maîtrise n’a pas pu être lue : elle sera relue au prochain
                      résultat.
                    </p>
                  }
                </div>
              </main>
              <aside
                class="presentateur-sidebar"
                aria-label="Informations de séance"
                i18n-aria-label="@@presentateurInformationsSeance"
              >
                <app-cours-panneau-activite
                  [ecran]="ecranAffiche"
                  [resultats]="resultats()"
                  [pilotage]="pilotageDeLEcran()"
                  [participants]="participants()"
                  [sessionId]="sessionId()"
                  [pilotageBloque]="pilotageBloque()"
                  (commande)="piloterLEcran($event)"
                />
                <app-cours-panneau-pedagogique
                  [ecran]="ecranAffiche"
                  [resultats]="resultatsDesQuestions()"
                  [participants]="participants()"
                  [sessionId]="sessionId()"
                />
                @if (ecranAffiche.notes !== '') {
                  <section class="presentateur-notes" data-testid="presentateur-notes">
                    <h3 i18n="presentateur.notes|@@presentateurNotes">Notes du formateur</h3>
                    <p class="notes">{{ ecranAffiche.notes }}</p>
                  </section>
                }
                @if (questions().length > 0) {
                  <section class="presentateur-questions-panel">
                    <div class="presentateur-sidebar__head">
                      <h3 i18n="presentateur.questionsTitre|@@presentateurQuestionsTitre">
                        Lecture de la classe
                      </h3>
                      <span class="muted">{{ questions().length }}</span>
                    </div>
                    <div class="presentateur-questions-panel__body">
                      <ul class="presentateur-questions" data-testid="presentateur-questions">
                        @for (question of questions(); track question.corrige.questionId) {
                          <li>
                            <app-cours-panneau-question
                              [question]="question"
                              [deroule]="cours"
                              [seuil]="ecranAffiche.seuil"
                              [resultats]="resultatsDesQuestions()"
                              [participants]="participants()"
                              [pilotageBloque]="pilotageBloque()"
                              (remediation)="allerA($event)"
                            />
                          </li>
                        }
                      </ul>
                    </div>
                  </section>
                }
              </aside>
            </div>
          }
        }
      }
      @if (statut() === 'ouverte' || statut() === 'en_cours') {
        <button
          #boutonDeCloture
          type="button"
          class="control-danger presentateur-cloture"
          data-testid="presentateur-cloturer"
          (click)="demanderLaCloture()"
          i18n="presentateur.cloturer|@@presentateurCloturer"
        >
          Clôturer la séance
        </button>
      }
      @if (clotureDemandee() && statut() !== 'terminee') {
        <div
          class="presentateur-confirmation"
          data-testid="presentateur-cloture-confirmation"
          role="alertdialog"
          aria-labelledby="presentateur-cloture-question"
        >
          <p
            id="presentateur-cloture-question"
            i18n="presentateur.clotureQuestion|@@presentateurClotureQuestion"
          >
            Clôturer la séance maintenant ? Les participants ne pourront plus répondre.
          </p>
          <button
            type="button"
            class="control-danger"
            data-testid="presentateur-cloture-confirmer"
            (click)="confirmerLaCloture()"
            i18n="presentateur.clotureConfirmer|@@presentateurClotureConfirmer"
          >
            Confirmer la clôture
          </button>
          <button
            #retourALaSeance
            type="button"
            class="control-btn"
            data-testid="presentateur-cloture-annuler"
            (click)="annulerLaCloture()"
            i18n="presentateur.clotureAnnuler|@@presentateurClotureAnnuler"
          >
            Revenir à la séance
          </button>
        </div>
      }
      @if (statut() === 'terminee') {
        <p
          data-testid="presentateur-terminee"
          role="status"
          i18n="presentateur.terminee|@@presentateurTerminee"
        >
          La séance est close : la synthèse est disponible.
        </p>
        <button
          type="button"
          class="btn btn-teal"
          data-testid="presentateur-synthese"
          (click)="ouvrirLaSynthese()"
          i18n="presentateur.synthese|@@presentateurSynthese"
        >
          Voir la synthèse
        </button>
      }
      @if (echec()) {
        <p
          data-testid="presentateur-echec"
          role="alert"
          i18n="presentateur.echec|@@presentateurEchec"
        >
          La dernière commande n'est pas passée. Vérifiez la connexion, puis réessayez.
        </p>
      }
    </div>
  `,
})
export class CoursPresentateurComponent {
  readonly slug = input.required<string>();
  readonly seance = input<string>();

  readonly statut = signal<EtatSeance>('fermee');
  readonly ouverture = signal<Chargement>('repos');
  readonly reprise = signal<Chargement>('repos');
  readonly lectureDeroule = signal<Chargement>('repos');
  readonly code = signal<string | null>(null);
  readonly sessionId = signal<string | null>(null);
  readonly deroule = signal<DerouleCours | null>(null);
  readonly ecran = signal(0);
  readonly mode = signal<PacingMode>('pilote');
  readonly resultats = signal<ResultatsDuPupitre | null>(null);
  readonly pilotage = signal<Readonly<Record<string, PilotageEcran>>>({});
  readonly maitrise = signal<readonly SyntheseConcept[] | null>(null);
  readonly maitriseIndisponible = signal(false);
  readonly notation = signal<RegleNotation | null>(null);
  readonly lectureDeLaNotation = signal<LectureDeLaNotation>('a-lire');
  readonly commandeEnVol = signal(false);
  readonly clotureDemandee = signal(false);
  readonly clotureEnVol = signal(false);
  readonly echec = signal(false);
  readonly suiviDuFlux = signal<StatutFlux | null>(null);
  readonly etatDeLaRepriseAttendu = signal(false);

  readonly pilotageBloque = computed(() => this.commandeEnVol() || this.etatDeLaRepriseAttendu());

  readonly etatDuFlux = computed(() => this.suiviDuFlux()?.etat ?? 'connexion');

  readonly refusDuFlux = computed<RefusDuFlux | null>(() => {
    const suivi = this.suiviDuFlux();
    return suivi?.etat === 'refuse'
      ? { statut: suivi.statut, motif: motifDuRefus(suivi.statut) }
      : null;
  });

  readonly participants = computed(() => this.resultats()?.participants ?? 0);

  readonly dernierEcran = computed(() => (this.deroule()?.ecrans.length ?? 0) - 1);

  readonly ecranCourant = computed<EcranDeroule | null>(
    () => this.deroule()?.ecrans[this.ecran()] ?? null,
  );

  readonly questions = computed<readonly QuestionDuPanneau[]>(() => {
    const ecran = this.ecranCourant();
    return ecran === null ? [] : questionsDuPanneau(ecran);
  });

  readonly resultatsDesQuestions = computed<readonly ResultatQuestion[]>(
    () => this.resultats()?.questions ?? [],
  );

  readonly questionsProblematiques = computed<readonly string[]>(() => {
    const deroule = this.deroule();
    const enonces = deroule === null ? new Map<string, string>() : enoncesDuDeroule(deroule);
    return (this.resultats()?.statistiques?.questionsProblemes ?? []).map(
      (questionId) => enonces.get(questionId) ?? questionId,
    );
  });

  readonly regleDeNotation = computed(() => {
    const notation = this.notation();
    return notation === null ? null : phraseDeNotation(notation, this.resultats()?.bareme ?? null);
  });

  readonly pilotageDeLEcran = computed<PilotageEcran>(() => {
    const ecran = this.ecranCourant();
    return ecran === null ? {} : (this.pilotage()[ecran.id] ?? {});
  });

  readonly direct = computed<DirectEcran | null>(() => {
    const ecran = this.ecranCourant();
    if (ecran === null) {
      return null;
    }
    const sondageId = objet(ecran.donnees?.['sondage'])?.['id'];
    return {
      pilotage: this.pilotageDeLEcran(),
      resultats: this.resultats()?.questions ?? null,
      comptesJalon:
        typeof sondageId === 'string' ? (this.resultats()?.jalons?.[sondageId] ?? null) : null,
    };
  });

  private readonly port = inject(FORMATIONS_PORT);
  private readonly creerFluxFormateur = inject(CREATEUR_FLUX_FORMATEUR);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly injecteur = inject(Injector);
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly boutonDeCloture = viewChild<ElementRef<HTMLButtonElement>>('boutonDeCloture');
  private readonly retourALaSeance = viewChild<ElementRef<HTMLButtonElement>>('retourALaSeance');

  private flux: Sync | null = null;
  private notationEnVol = false;
  private maitriseEnVol = false;
  private detruit = false;
  private chantier: Promise<void> = Promise.resolve();

  constructor() {
    const aLaDestruction = inject(DestroyRef);
    aLaDestruction.onDestroy(() => {
      this.detruit = true;
      this.flux?.close();
    });
    if (this.navigateur) {
      const avantDeQuitter = (evenement: BeforeUnloadEvent): void => {
        if (this.statut() === 'ouverte' || this.statut() === 'en_cours') {
          evenement.preventDefault();
        }
      };
      window.addEventListener('beforeunload', avantDeQuitter);
      aLaDestruction.onDestroy(() => window.removeEventListener('beforeunload', avantDeQuitter));
    }
    afterNextRender(() => {
      const seance = this.seance();
      this.chantier = seance === undefined ? this.ouvrirLaSeance() : this.reprendreLaSeance(seance);
    });
  }

  quandStabilise(): Promise<void> {
    return this.chantier;
  }

  allerA(cible: number): void {
    if (!this.armee() || cible < 0 || cible > this.dernierEcran()) {
      return;
    }
    const avant = this.ecran();
    this.ecran.set(cible);
    this.commander({ ecran: cible }, () => this.ecran.set(avant));
  }

  protected changerLEcranDepuisLeCurseur(evenement: Event): void {
    const valeur = Number((evenement.target as HTMLInputElement).value);
    if (Number.isInteger(valeur)) {
      this.allerA(valeur);
    }
  }

  protected ouvrir(): void {
    if (
      this.sessionId() !== null ||
      this.seance() !== undefined ||
      this.ouverture() === 'chargement'
    ) {
      return;
    }
    this.chantier = this.ouvrirLaSeance();
  }

  protected reessayerLaReprise(): void {
    const seance = this.seance();
    if (seance === undefined || this.reprise() === 'chargement') {
      return;
    }
    this.chantier = this.reprendreLaSeance(seance);
  }

  protected relireLeDeroule(): void {
    const session = this.sessionId();
    if (session === null || this.lectureDeroule() === 'chargement') {
      return;
    }
    this.chantier = this.lireLeDeroule(session);
  }

  protected demarrer(): void {
    const session = this.sessionId();
    if (session === null || this.statut() !== 'ouverte' || !this.armee()) {
      return;
    }
    this.commandeEnVol.set(true);
    this.suivreLaCommande(this.port.demarrer(session), (abouti) => {
      this.commandeEnVol.set(false);
      if (abouti) {
        this.avancerLeStatut('en_cours');
      }
    });
  }

  protected suivant(): void {
    this.allerA(this.ecran() + 1);
  }

  protected precedent(): void {
    this.allerA(this.ecran() - 1);
  }

  protected basculerLeRythme(): void {
    if (!this.armee()) {
      return;
    }
    const avant = this.mode();
    const vise: PacingMode = avant === 'pilote' ? 'libre' : 'pilote';
    this.mode.set(vise);
    const commande: CommandePilotage =
      vise === 'libre'
        ? { mode: vise, intervalle: { premier: this.ecran(), dernier: this.dernierEcran() } }
        : { mode: vise };
    this.commander(commande, () => this.mode.set(avant));
  }

  protected ouvrirLaScene(): void {
    const session = this.sessionId();
    if (session === null || !this.navigateur) {
      return;
    }
    const chemin = `/cours/presenter/${encodeURIComponent(this.slug())}/scene/${encodeURIComponent(session)}`;
    window.open(this.location.prepareExternalUrl(chemin), FENETRE_SCENE);
  }

  protected demanderLaCloture(): void {
    this.clotureDemandee.set(true);
    this.focaliserApresLeRendu(this.retourALaSeance);
  }

  protected annulerLaCloture(): void {
    this.clotureDemandee.set(false);
    this.focaliserApresLeRendu(this.boutonDeCloture);
  }

  protected confirmerLaCloture(): void {
    const session = this.sessionId();
    if (session === null || this.clotureEnVol()) {
      return;
    }
    this.clotureEnVol.set(true);
    this.suivreLaCommande(this.port.cloturer(session), (abouti) => {
      this.clotureEnVol.set(false);
      if (!abouti) {
        return;
      }
      this.clotureDemandee.set(false);
      this.avancerLeStatut('terminee');
      this.flux?.close();
      this.ouvrirLaSynthese();
    });
  }

  protected ouvrirLaSynthese(): void {
    const session = this.sessionId();
    if (session !== null) {
      void this.router.navigate(['/cours/seance', session, 'synthese']);
    }
  }

  private async ouvrirLaSeance(): Promise<void> {
    const seance = await this.charger(this.ouverture, this.port.ouvrirSeance(this.slug()));
    if (seance === null) {
      return;
    }
    this.sessionId.set(seance.sessionId);
    this.code.set(seance.code);
    this.avancerLeStatut('ouverte');
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { seance: seance.sessionId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    await this.lireLeDeroule(seance.sessionId);
  }

  private async reprendreLaSeance(sessionId: string): Promise<void> {
    const rapport = await this.charger(this.reprise, this.port.lireResultats(sessionId));
    if (rapport === null) {
      return;
    }
    this.etatDeLaRepriseAttendu.set(true);
    this.sessionId.set(sessionId);
    this.code.set(rapport.code);
    this.resultats.set(resultatsDuRapport(rapport));
    this.retenirLaNotation(rapport);
    this.avancerLeStatut('ouverte');
    await this.lireLeDeroule(sessionId);
  }

  private async lireLeDeroule(sessionId: string): Promise<void> {
    const deroule = await this.charger(this.lectureDeroule, this.port.lireDeroule(sessionId));
    if (deroule !== null) {
      this.deroule.set(deroule);
      this.ecouterLeFlux(sessionId);
    }
  }

  private async charger<T>(
    etat: WritableSignal<Chargement>,
    source: Observable<T>,
  ): Promise<T | null> {
    etat.set('chargement');
    try {
      const valeur = await firstValueFrom(source);
      etat.set('succes');
      return this.detruit ? null : valeur;
    } catch {
      etat.set('echec');
      return null;
    }
  }

  private ecouterLeFlux(sessionId: string): void {
    const flux = this.creerFluxFormateur(sessionId);
    flux.onState((etat) => this.suivreLeFlux(etat));
    flux.onResultats((resultats) => {
      this.resultats.set(resultats);
      this.lireLaNotationSiBesoin(sessionId);
      this.lireLaMaitriseSiBesoin(sessionId);
    });
    flux.onStatut((statut) => this.suiviDuFlux.set(statut));
    this.flux = flux;
    flux.ouvrir();
  }

  private lireLaNotationSiBesoin(sessionId: string): void {
    if (this.lectureDeLaNotation() === 'lue' || this.notationEnVol) {
      return;
    }
    this.notationEnVol = true;
    const lecture = this.lireLaNotation(sessionId);
    this.chantier = Promise.all([this.chantier, lecture]).then(() => undefined);
  }

  private async lireLaNotation(sessionId: string): Promise<void> {
    try {
      this.retenirLaNotation(await firstValueFrom(this.port.lireResultats(sessionId)));
    } catch {
      this.lectureDeLaNotation.set('echec');
    } finally {
      this.notationEnVol = false;
    }
  }

  private retenirLaNotation(rapport: RapportSeance): void {
    this.notation.set(rapport.notation ?? null);
    this.lectureDeLaNotation.set('lue');
  }

  private suivreLeFlux(etat: EtatSession): void {
    this.etatDeLaRepriseAttendu.set(false);
    this.avancerLeStatut(ETAT_ANNONCE[etat.etat]);
    this.pilotage.set(etat.pilotage);
    if (etat.etat === 'terminee') {
      this.flux?.close();
    }
    if (!this.commandeEnVol()) {
      this.ecran.set(etat.ecranCourant);
      this.mode.set(etat.modeRythme);
    }
    const session = this.sessionId();
    if (session !== null) {
      this.lireLaMaitriseSiBesoin(session);
    }
  }

  private lireLaMaitriseSiBesoin(sessionId: string): void {
    if (this.ecranCourant()?.type !== ECRAN_DE_RAPPEL || this.maitriseEnVol) {
      return;
    }
    this.maitriseEnVol = true;
    const lecture = firstValueFrom(this.port.lireSyntheseRappels(sessionId))
      .then(({ concepts }) => {
        this.maitrise.set(concepts);
        this.maitriseIndisponible.set(false);
      })
      .catch(() => {
        this.maitriseIndisponible.set(true);
      })
      .finally(() => {
        this.maitriseEnVol = false;
      });
    this.chantier = Promise.all([this.chantier, lecture]).then(() => undefined);
  }

  protected piloterLEcran(commande: CommandeDEcran): void {
    if (!this.armee()) {
      return;
    }
    this.commander({ pilotage: commande }, () => undefined);
  }

  private focaliserApresLeRendu(cible: () => ElementRef<HTMLButtonElement> | undefined): void {
    afterNextRender(() => cible()?.nativeElement.focus(), { injector: this.injecteur });
  }

  private armee(): boolean {
    return this.sessionId() !== null && !this.pilotageBloque() && this.statut() !== 'terminee';
  }

  private avancerLeStatut(vise: EtatSeance): void {
    if (RANG_DE_L_ETAT[vise] > RANG_DE_L_ETAT[this.statut()]) {
      this.statut.set(vise);
    }
  }

  private commander(commande: CommandePilotage, annuler: () => void): void {
    const session = this.sessionId();
    if (session === null) {
      return;
    }
    this.commandeEnVol.set(true);
    this.suivreLaCommande(this.port.piloter(session, commande), (abouti) => {
      this.commandeEnVol.set(false);
      if (!abouti) {
        annuler();
      }
    });
  }

  private suivreLaCommande(source: Observable<void>, conclure: (abouti: boolean) => void): void {
    this.chantier = this.executer(source).then((abouti) => {
      if (!this.detruit) {
        conclure(abouti);
      }
    });
  }

  private async executer(source: Observable<void>): Promise<boolean> {
    try {
      await lastValueFrom(source, { defaultValue: undefined });
      this.echec.set(false);
      return true;
    } catch {
      this.echec.set(true);
      return false;
    }
  }
}
