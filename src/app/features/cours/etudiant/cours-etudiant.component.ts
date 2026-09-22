import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  CoursContent,
  EcranContent,
  EtatPulse,
  PacingMode,
  PilotageEcran,
  RegimeVerrou,
  ValeurProduction,
} from '../../../../cours/content/types';
import type { Deck } from '../../../../cours/runtime/core/deck';
import { createDeck } from '../../../../cours/runtime/core/deck';
import { texte } from '../../../../cours/runtime/core/i18n';
import type { Identity } from '../../../../cours/runtime/core/identity';
import { saveIdentity } from '../../../../cours/runtime/core/identity';
import type { Lock } from '../../../../cours/runtime/core/lock';
import { createLock } from '../../../../cours/runtime/core/lock';
import type { EnvoiReponse, NatureEnvoi } from '../../../../cours/runtime/core/queue';
import {
  enqueue,
  flush,
  pending,
  purgerLesAutresEnvois,
} from '../../../../cours/runtime/core/queue';
import type { Brouillons } from '../../../../cours/runtime/core/storage';
import { creerBrouillons, purgerLesAutresBrouillons } from '../../../../cours/runtime/core/storage';
import type { EtatSession, StatutSession, Sync } from '../../../../cours/runtime/core/sync';
import { getApiBaseUrl } from '../../../core/http/api-config';
import type {
  IncidentEtudiant,
  MotifRefusRattachement,
  MotifRefusReponse,
  MotifRefusSujet,
  Rattachement,
  ReponseEtudiant,
  ValeurReponse,
  VerdictReponse,
} from '../../../core/ports/formations.port';
import {
  FORMATIONS_PORT,
  RattachementRefuse,
  ReponseRefusee,
  SujetRefuse,
} from '../../../core/ports/formations.port';
import {
  ajouterRetours,
  retirerLesRefus,
  retourDeProduction,
  retourDeRefus,
  retourDeReponse,
  retourDeTentative,
  retoursDeLEtat,
} from '../../../core/ports/retours-brique';
import type {
  DirectEcran,
  EvenementBrique,
  RetourBrique,
} from '../../../shared/slides/session/contrat-hote';
import {
  ecranDuRappel,
  ecransDesIdentifiants,
  identifiantsDesQuestions,
} from '../../../shared/slides/session/lecture-ecran';
import type { EtatEnvoiLibre } from '../../../shared/slides/session/reponses-libres.service';
import { ReponsesLibresService } from '../../../shared/slides/session/reponses-libres.service';
import { CoursPresentationComponent } from '../../../shared/slides/session/cours-presentation.component';
import { aUnePresentation, objet } from '../../../shared/slides/visual/presentation-v2';
import { CREATEUR_FLUX } from '../cours-flux.token';

type EtatEtudiant = 'code' | 'rattachement' | 'chargement' | 'sujet-refuse' | 'seance';

type MotifEchec = MotifRefusRattachement | 'code-invalide' | 'identite-refusee';

type EvenementDe<K extends EvenementBrique['kind']> = Extract<EvenementBrique, { kind: K }>;

interface RefusAffiche {
  readonly motif: MotifRefusSujet;
  readonly message: string;
}

interface RefusDeReponse {
  readonly motif: MotifRefusReponse;
  readonly message: string;
}

interface RefusDuFlux {
  readonly statut: number;
}

interface Envoi {
  readonly nature: NatureEnvoi;
  readonly questionId: string;
  readonly valeur: unknown;
  readonly dureeMs: number;
}

type IssueDeLEnvoi = 'transmise' | 'en-panne';

interface VerdictRecu {
  readonly reussite: boolean;
  readonly etiquette: string | null;
}

interface VerdictAffiche extends VerdictRecu {
  readonly questionId: string;
  readonly rang: number;
}

const REGIMES_VERROU: readonly RegimeVerrou[] = ['ouvert', 'focus', 'examen'];

const STATUTS_SANS_RETOUR: readonly number[] = [401, 403];

const ETATS_LIBRES_EN_ATTENTE: readonly EtatEnvoiLibre[] = ['attente_reseau', 'ecran_non_servi'];

const MESSAGE_CODE = $localize`:cours.codeInvalide|@@coursCodeInvalide:Le code de séance compte quatre chiffres : recopiez-le sans autre caractère.`;
const MESSAGE_IDENTITE = $localize`:cours.identiteRefusee|@@coursIdentiteRefusee:Vérifiez votre prénom, votre nom et votre adresse e-mail, puis réessayez.`;
const MESSAGE_ECHEC = $localize`:cours.rattachementEchec|@@coursRattachementEchec:Le rattachement à la séance a échoué. Prévenez votre formateur.`;
const MESSAGE_ECRAN_INDISPONIBLE = $localize`:cours.ecranIndisponible|@@coursEcranIndisponible:L’écran n’est pas encore disponible pour cette séance.`;
const MESSAGE_ECRAN_ECHEC = $localize`:cours.ecranChargementEchec|@@coursEcranChargementEchec:L’écran n’a pas pu être chargé.`;

const MOTIF_CODE = /^\d{4}$/;
const ESPACES = /\s+/g;
const DELAI_MINIMUM_FORMULAIRE_MS = 1_200;
const BRIQUE_DE_RAPPEL = 'fp-spaced';
const BRIQUE_DE_DEFI = 'fp-challenge';
const MOTIFS_DE_RESYNCHRONISATION: readonly MotifRefusReponse[] = [
  'tentatives-epuisees',
  'enigme-verrouillee',
];

function normaliserCode(saisi: string): string | null {
  const compact = saisi.replace(ESPACES, '');
  return MOTIF_CODE.test(compact) ? compact : null;
}

function lireRefus(erreur: unknown): RefusAffiche {
  const refus = erreur instanceof SujetRefuse ? erreur : new SujetRefuse('sujet-indisponible', 0);
  return { motif: refus.motif, message: refus.message };
}

function refusDe(erreur: unknown): ReponseRefusee {
  return erreur instanceof ReponseRefusee ? erreur : new ReponseRefusee('reseau', 0);
}

function doitSuivreLeFormateur(index: number, etat: EtatSession, bascule: boolean): boolean {
  if (etat.modeRythme === 'pilote') {
    return true;
  }
  const intervalle = etat.intervalleLibre;
  if (intervalle === null) {
    return bascule;
  }
  return index < intervalle.premier || index > intervalle.dernier;
}

function regimeDuContenu(contenu: unknown): RegimeVerrou | null {
  if (typeof contenu !== 'object' || contenu === null) {
    return null;
  }
  const regime = (contenu as Record<string, unknown>)['regime'];
  return typeof regime === 'string' && REGIMES_VERROU.includes(regime as RegimeVerrou)
    ? (regime as RegimeVerrou)
    : null;
}

function regimeDeLEcran(ecran: EcranContent): RegimeVerrou {
  const direct = regimeDuContenu(ecran.donnees);
  if (direct !== null) {
    return direct;
  }
  for (const donnees of Object.values(ecran.donnees ?? {})) {
    const indirect = regimeDuContenu(donnees);
    if (indirect !== null) {
      return indirect;
    }
    if (typeof donnees === 'object' && donnees !== null) {
      const metadonnees = regimeDuContenu((donnees as Record<string, unknown>)['metadonnees']);
      if (metadonnees !== null) {
        return metadonnees;
      }
    }
  }
  return 'ouvert';
}

function estEcranVerrouille(ecran: EcranContent | undefined): boolean {
  return ecran?.type === 'ecran-verrouille';
}

@Component({
  selector: 'app-cours-etudiant',
  standalone: true,
  imports: [CoursPresentationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cours-etudiant">
      @switch (etat()) {
        @case ('chargement') {
          <div class="student-state" data-testid="etudiant-chargement" role="status">
            <span class="student-state__pulse" aria-hidden="true"></span>
            <div>
              <p
                class="student-state__kicker"
                i18n="cours.kickerPreparation|@@coursKickerPreparation"
              >
                Préparation de la séance
              </p>
              <p i18n="cours.chargementSujet|@@coursChargementSujet">Chargement de votre sujet…</p>
            </div>
          </div>
        }
        @case ('sujet-refuse') {
          @if (refusSujet(); as refus) {
            <p data-testid="etudiant-sujet-refuse" role="alert" [attr.data-motif]="refus.motif">
              {{ refus.message }}
            </p>
            @if (refus.motif === 'sujet-indisponible') {
              <button
                type="button"
                data-testid="etudiant-sujet-reessayer"
                (click)="reessayer()"
                i18n="cours.reessayerSujet|@@coursReessayerSujet"
              >
                Réessayer
              </button>
            }
          }
        }
        @case ('rattachement') {
          <div class="student-state" data-testid="etudiant-rattachement" role="status">
            <span class="student-state__pulse" aria-hidden="true"></span>
            <div>
              <p class="student-state__kicker" i18n="cours.kickerEntree|@@coursKickerEntree">
                Entrée dans la classe
              </p>
              <p i18n="cours.rattachement|@@coursRattachement">Connexion à la séance…</p>
            </div>
          </div>
        }
        @case ('seance') {
          <section class="student-session" data-testid="etudiant-seance">
            @if (sujet(); as cours) {
              <div class="student-session__head">
                <div>
                  <p
                    class="cours-etudiant__kicker"
                    i18n="cours.etudiantKicker|@@coursEtudiantKicker"
                  >
                    Séance en cours
                  </p>
                  <h2 data-testid="etudiant-titre">{{ cours.titre }}</h2>
                </div>
                <p class="student-progress" data-testid="etudiant-progression">
                  {{ indexEcran() + 1 }} / {{ cours.ecrans.length }}
                </p>
              </div>
            }
            @if (terminee()) {
              <p data-testid="etudiant-fin" role="status" i18n="cours.fin|@@coursFin">
                La séance est terminée. Merci de votre participation.
              </p>
            } @else {
              @if (echecEcran(); as echec) {
                <p data-testid="etudiant-ecran-echec" role="alert">
                  {{ echec.message }}
                </p>
              } @else {
                @if (refusDuFlux(); as refus) {
                  @if (accesPerdu()) {
                    <p
                      class="student-status"
                      data-testid="etudiant-acces-perdu"
                      role="alert"
                      [attr.data-statut]="refus.statut"
                      i18n="cours.accesPerdu|@@coursAccesPerdu"
                    >
                      Votre accès à cette séance n’est plus valable (statut {{ refus.statut }}).
                      Attendre ne le rétablira pas : redemandez le code à votre formateur et
                      recommencez à rejoindre la séance.
                    </p>
                  } @else {
                    <p
                      class="student-status"
                      data-testid="etudiant-flux-refuse"
                      role="alert"
                      [attr.data-statut]="refus.statut"
                      i18n="cours.fluxRefuse|@@coursFluxRefuse"
                    >
                      Le suivi en direct a été refusé par le serveur (statut {{ refus.statut }}).
                      Les activités réapparaîtront dès que la connexion sera rétablie.
                    </p>
                  }
                } @else if (statutSeance() !== 'en_cours') {
                  <p
                    class="student-status"
                    data-testid="etudiant-attente"
                    role="status"
                    i18n="cours.attenteDemarrage|@@coursAttenteDemarrage"
                  >
                    La séance n’a pas encore démarré : le premier écran s’affichera dès que votre
                    formateur la lancera.
                  </p>
                } @else if (chargementEcran()) {
                  <p
                    class="student-status"
                    data-testid="etudiant-ecran-chargement"
                    role="status"
                    i18n="cours.chargementEcran|@@coursChargementEcran"
                  >
                    Chargement de l’écran…
                  </p>
                } @else {
                  @if (ecranCourant(); as ecran) {
                    <app-cours-presentation
                      mode="etudiant"
                      [slide]="ecran"
                      [index]="indexEcran()"
                      [total]="sujet()?.ecrans?.length ?? 0"
                      [sessionId]="sessionId()"
                      [jeton]="jeton()"
                      [retours]="retours()"
                      [direct]="direct()"
                      [brouillons]="brouillons()"
                      (evenement)="surEvenement($event)"
                    />
                  }
                  <div class="student-session__navigation">
                    @if (peutReculer()) {
                      <button
                        type="button"
                        class="btn btn-ghost"
                        data-testid="etudiant-precedent"
                        (click)="reculer()"
                        i18n="cours.ecranPrecedent|@@coursEcranPrecedent"
                      >
                        Écran précédent
                      </button>
                    }
                    @if (peutAvancer()) {
                      <button
                        type="button"
                        class="btn btn-teal"
                        data-testid="etudiant-suivant"
                        (click)="avancer()"
                        i18n="cours.ecranSuivant|@@coursEcranSuivant"
                      >
                        Écran suivant
                      </button>
                    }
                  </div>
                }
              }
            }
            <ul class="student-verdicts" data-testid="etudiant-verdicts" aria-live="polite">
              @for (verdict of verdictsAffiches(); track verdict.questionId) {
                <li
                  data-testid="etudiant-verdict"
                  [attr.data-question]="verdict.questionId"
                  [attr.data-reussite]="verdict.reussite"
                >
                  @if (verdict.reussite) {
                    <span
                      data-testid="etudiant-verdict-libelle"
                      i18n="cours.questionReussie|@@coursQuestionReussie"
                    >
                      Question {{ verdict.rang }} : Réussi
                    </span>
                  } @else {
                    <span
                      data-testid="etudiant-verdict-libelle"
                      i18n="cours.questionManquee|@@coursQuestionManquee"
                    >
                      Question {{ verdict.rang }} : Manqué
                    </span>
                  }
                  @if (verdict.etiquette; as etiquette) {
                    <span data-testid="etudiant-confusion">{{ etiquette }}</span>
                  }
                </li>
              }
            </ul>
            @if (enAttente()) {
              <p
                class="student-feedback"
                data-testid="etudiant-hors-ligne"
                role="status"
                i18n="cours.horsLigne|@@coursHorsLigne"
              >
                Votre réponse est enregistrée sur ce poste et partira au retour du réseau.
              </p>
            }
            @if (repriseIndisponible()) {
              <p
                class="student-feedback"
                data-testid="etudiant-reprise-indisponible"
                role="status"
                i18n="cours.repriseIndisponible|@@coursRepriseIndisponible"
              >
                Vos réponses déjà envoyées n’ont pas pu être relues : elles restent enregistrées et
                réapparaîtront au prochain chargement.
              </p>
            }
            @if (refusReponse(); as refus) {
              <p
                class="student-feedback"
                data-testid="etudiant-reponse-refusee"
                role="alert"
                [attr.data-motif]="refus.motif"
              >
                {{ refus.message }}
              </p>
            }
            @if (reflexionEnAttente(); as etat) {
              <p
                class="student-feedback"
                data-testid="etudiant-reflexion-en-attente"
                role="status"
                [attr.data-etat]="etat"
                i18n="cours.reflexionEnAttente|@@coursReflexionEnAttente"
              >
                Votre réflexion est gardée sur ce poste : elle partira dès que le formateur
                réaffichera l’écran.
              </p>
            }
            @if (fileRefusee()) {
              <p
                class="student-feedback"
                data-testid="etudiant-file-refusee"
                role="alert"
                i18n="cours.fileRefusee|@@coursFileRefusee"
              >
                Ce poste n’a pas pu mettre votre réponse de côté : prévenez votre formateur.
              </p>
            }
          </section>
        }
        @default {
          <form class="student-entry" data-testid="etudiant-entree" (submit)="soumettre($event)">
            <div class="student-entry__intro">
              <p class="student-entry__kicker" i18n="cours.entreeKicker|@@coursEntreeKicker">
                Atelier · séance accompagnée
              </p>
              <h1 i18n="cours.entreeTitre|@@coursEntreeTitre">Rejoindre une séance</h1>
              <p class="student-entry__lead" i18n="cours.entreeIntro|@@coursEntreeIntro">
                Votre formateur vous a donné un code. Entrez-le pour afficher le bon écran au bon
                moment, répondre aux activités et suivre la séance avec le groupe.
              </p>
              <ol class="student-entry__steps">
                <li>
                  <span>01</span
                  ><span i18n="cours.entreeEtapeCode|@@coursEntreeEtapeCode"
                    >Je saisis le code de séance</span
                  >
                </li>
                <li>
                  <span>02</span
                  ><span i18n="cours.entreeEtapeIdentite|@@coursEntreeEtapeIdentite"
                    >Je renseigne mon prénom et mon nom</span
                  >
                </li>
                <li>
                  <span>03</span
                  ><span i18n="cours.entreeEtapeDemarrage|@@coursEntreeEtapeDemarrage"
                    >J’entre dans le cours quand le formateur démarre</span
                  >
                </li>
              </ol>
            </div>

            <div class="student-entry__fields">
              <div class="student-entry__field student-entry__field--code">
                <label for="etudiant-code" i18n="cours.code|@@coursCode">Code de la séance</label>
                <span class="student-entry__hint" i18n="cours.codeIndice|@@coursCodeIndice"
                  >4 chiffres affichés par le formateur</span
                >
                <input
                  id="etudiant-code"
                  name="code"
                  inputmode="numeric"
                  autocomplete="off"
                  required
                />
              </div>
              <div class="student-entry__field">
                <label for="etudiant-prenom" i18n="cours.prenom|@@coursPrenom">Prénom</label>
                <input id="etudiant-prenom" name="prenom" autocomplete="given-name" required />
              </div>
              <div class="student-entry__field">
                <label for="etudiant-nom" i18n="cours.nom|@@coursNom">Nom</label>
                <input id="etudiant-nom" name="nom" autocomplete="family-name" required />
              </div>
              <div class="student-entry__field student-entry__field--wide">
                <label for="etudiant-email" i18n="cours.email|@@coursEmail">Adresse e-mail</label>
                <span class="student-entry__hint" i18n="cours.emailIndice|@@coursEmailIndice"
                  >Utilisée uniquement pour retrouver votre participation</span
                >
                <input
                  id="etudiant-email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  required
                />
              </div>
            </div>
            <input name="website" type="text" tabindex="-1" autocomplete="off" hidden />
            <div class="student-entry__actions">
              <button
                type="submit"
                class="btn btn-teal"
                [disabled]="etat() === 'rattachement'"
                i18n="cours.rejoindre|@@coursRejoindre"
              >
                Entrer dans la séance <span aria-hidden="true">→</span>
              </button>
              <p
                class="student-entry__privacy"
                i18n="cours.entreeConfidentialite|@@coursEntreeConfidentialite"
              >
                Pas de compte à créer. Ces informations restent liées à cette séance.
              </p>
            </div>
            @if (messageEchec(); as message) {
              <p data-testid="etudiant-echec" role="alert" [attr.data-motif]="motifEchec()">
                {{ message }}
              </p>
            }
          </form>
        }
      }
    </div>
  `,
})
export class CoursEtudiantComponent {
  readonly etat = signal<EtatEtudiant>('code');
  readonly motifEchec = signal<MotifEchec | null>(null);
  readonly messageEchec = signal<string | null>(null);
  readonly refusSujet = signal<RefusAffiche | null>(null);
  readonly sujet = signal<CoursContent | null>(null);
  readonly indexEcran = signal(0);
  readonly enAttente = signal(false);
  readonly fileRefusee = signal(false);
  readonly terminee = signal(false);
  readonly peutAvancer = signal(false);
  readonly peutReculer = signal(false);
  readonly statutSeance = signal<StatutSession | null>(null);
  readonly refusReponse = signal<RefusDeReponse | null>(null);
  readonly refusDuFlux = signal<RefusDuFlux | null>(null);
  readonly echecEcran = signal<RefusAffiche | null>(null);
  readonly chargementEcran = signal(false);
  readonly retours = signal<ReadonlyMap<string, readonly RetourBrique[]>>(new Map());
  readonly repriseIndisponible = signal(false);

  readonly reflexionEnAttente = computed<EtatEnvoiLibre | null>(() => {
    const sessionId = this.sessionId();
    if (sessionId === null) {
      return null;
    }
    for (const [cle, etat] of this.reponsesLibres.etatsDesEnvois()) {
      if (cle.startsWith(`${sessionId}:`) && ETATS_LIBRES_EN_ATTENTE.includes(etat)) {
        return etat;
      }
    }
    return null;
  });

  readonly accesPerdu = computed<boolean>(() => {
    const refus = this.refusDuFlux();
    return refus !== null && STATUTS_SANS_RETOUR.includes(refus.statut);
  });

  readonly ecranCourant = computed<EcranContent | null>(() => {
    const ecran = this.sujet()?.ecrans[this.indexEcran()];
    return estEcranVerrouille(ecran) ? null : (ecran ?? null);
  });

  readonly direct = computed<DirectEcran | null>(() => {
    const ecran = this.ecranCourant();
    return ecran === null
      ? null
      : { pilotage: this.pilotage()[ecran.id] ?? {}, resultats: null, comptesJalon: null };
  });

  protected readonly brouillons = signal<Brouillons | null>(null);

  private readonly pilotage = signal<Readonly<Record<string, PilotageEcran>>>({});
  private readonly verdicts = signal<ReadonlyMap<string, VerdictRecu>>(new Map());

  private readonly ecranVisuel = computed(() => {
    const ecran = this.ecranCourant();
    return ecran !== null && aUnePresentation(ecran);
  });

  private readonly questionsDeLEcran = computed<readonly string[]>(() => {
    const ecran = this.ecranCourant();
    return ecran === null || !this.ecranVisuel() ? [] : identifiantsDesQuestions(ecran);
  });

  readonly verdictsAffiches = computed<readonly VerdictAffiche[]>(() => {
    const recus = this.verdicts();
    return this.questionsDeLEcran().flatMap((questionId, index) => {
      const recu = recus.get(questionId);
      return recu === undefined ? [] : [{ questionId, rang: index + 1, ...recu }];
    });
  });

  private readonly ecransDesIdentifiants = computed<ReadonlyMap<string, string>>(() => {
    const sujet = this.sujet();
    return sujet === null ? new Map() : ecransDesIdentifiants(sujet);
  });

  private readonly port = inject(FORMATIONS_PORT);
  private readonly creerFlux = inject(CREATEUR_FLUX);
  private readonly reponsesLibres = inject(ReponsesLibresService);
  private readonly baseUrl = `${getApiBaseUrl()}/formations`;
  private readonly enLigne = signal(typeof navigator === 'undefined' || navigator.onLine);
  private readonly incidents: IncidentEtudiant[] = [];
  private readonly debutFormulaire = Date.now();
  private readonly defisReveles = new Set<string>();

  private readonly seanceOuverte = signal<Pick<Rattachement, 'sessionId' | 'jeton'> | null>(null);
  protected readonly sessionId = computed(() => this.seanceOuverte()?.sessionId ?? null);
  protected readonly jeton = computed(() => this.seanceOuverte()?.jeton ?? '');

  private identite: Identity | null = null;
  private rattachement: Rattachement | null = null;
  private flux: Sync | null = null;
  private verrou: Lock | null = null;
  private deck: Deck | null = null;
  private rythmeDistant: PacingMode = 'pilote';
  private rappelsDemandes = false;
  private detruit = false;
  private videEnCours = false;
  private chantier: Promise<void> = Promise.resolve();

  constructor() {
    const aLaDestruction = inject(DestroyRef);
    const fenetre = typeof window === 'undefined' ? null : window;
    if (fenetre !== null) {
      const surRetour = (): void => {
        this.enLigne.set(true);
        this.chantier = this.reprendreLesEnvois();
      };
      const surPerte = (): void => this.enLigne.set(false);
      fenetre.addEventListener('online', surRetour);
      fenetre.addEventListener('offline', surPerte);
      aLaDestruction.onDestroy(() => {
        fenetre.removeEventListener('online', surRetour);
        fenetre.removeEventListener('offline', surPerte);
      });
    }
    aLaDestruction.onDestroy(() => {
      this.detruit = true;
      this.flux?.close();
      this.verrou?.disarm();
    });
  }

  quandStabilise(): Promise<void> {
    return this.chantier;
  }

  protected soumettre(evenement: Event): void {
    evenement.preventDefault();
    const formulaire = evenement.currentTarget as HTMLFormElement;
    this.chantier = this.rattacher(new FormData(formulaire));
  }

  protected surEvenement(evenement: EvenementBrique): void {
    this.chantier = this.traiterEvenement(evenement);
  }

  protected avancer(): void {
    this.deck?.next();
  }

  protected reculer(): void {
    this.deck?.previous();
  }

  protected reessayer(): void {
    if (this.identite !== null && this.rattachement !== null) {
      this.chantier = this.chargerLaSeance(this.identite, this.rattachement);
    }
  }

  private async rattacher(donnees: FormData): Promise<void> {
    const code = normaliserCode(String(donnees.get('code') ?? ''));
    if (code === null) {
      this.echouer('code-invalide', MESSAGE_CODE);
      return;
    }
    const identite = this.enregistrerIdentite(donnees);
    if (identite === null) {
      this.echouer('identite-refusee', MESSAGE_IDENTITE);
      return;
    }
    const rattachement = await this.demanderRattachement(code, identite, donnees);
    if (rattachement === null || this.detruit) {
      return;
    }
    this.identite = identite;
    this.rattachement = rattachement;
    await this.chargerLaSeance(identite, rattachement);
  }

  private async chargerLaSeance(identite: Identity, rattachement: Rattachement): Promise<void> {
    const sujet = await this.lireLeSujet(rattachement);
    if (sujet !== null && !this.detruit) {
      this.ouvrirLaSeance(identite, rattachement, sujet);
      await Promise.all([
        this.relireMonEtat(),
        this.chargerLesDonneesDeLEcran(this.ecranCourant() ?? undefined),
      ]);
    }
  }

  private async demanderRattachement(
    code: string,
    identite: Identity,
    donnees: FormData,
  ): Promise<Rattachement | null> {
    this.motifEchec.set(null);
    this.messageEchec.set(null);
    this.etat.set('rattachement');
    const restant = DELAI_MINIMUM_FORMULAIRE_MS - (Date.now() - this.debutFormulaire);
    if (restant > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, restant));
    }
    if (this.detruit) {
      return null;
    }
    try {
      return await firstValueFrom(
        this.port.rejoindre(code, {
          prenom: identite.prenom,
          nom: identite.nom,
          email: identite.email,
          website: String(donnees.get('website') ?? ''),
          formStartedAt: this.debutFormulaire,
        }),
      );
    } catch (erreur) {
      this.etat.set('code');
      const refus = erreur instanceof RattachementRefuse ? erreur : null;
      this.echouer(refus?.motif ?? 'rattachement-impossible', refus?.message ?? MESSAGE_ECHEC);
      return null;
    }
  }

  private async lireLeSujet(rattachement: Rattachement): Promise<CoursContent | null> {
    this.etat.set('chargement');
    try {
      return await firstValueFrom(this.port.lireSujet(rattachement.sessionId, rattachement.jeton));
    } catch (erreur) {
      this.refusSujet.set(lireRefus(erreur));
      this.etat.set('sujet-refuse');
      return null;
    }
  }

  private enregistrerIdentite(donnees: FormData): Identity | null {
    try {
      return saveIdentity({
        prenom: String(donnees.get('prenom') ?? ''),
        nom: String(donnees.get('nom') ?? ''),
        email: String(donnees.get('email') ?? ''),
      }).identite;
    } catch {
      return null;
    }
  }

  private echouer(motif: MotifEchec, message: string): void {
    this.motifEchec.set(motif);
    this.messageEchec.set(message);
  }

  private ouvrirLaSeance(
    identite: Identity,
    rattachement: Rattachement,
    sujet: CoursContent,
  ): void {
    this.seanceOuverte.set({ sessionId: rattachement.sessionId, jeton: rattachement.jeton });
    purgerLesAutresBrouillons(rattachement.sessionId, rattachement.participantId);
    this.fileRefusee.set(!purgerLesAutresEnvois(rattachement.sessionId));
    this.brouillons.set(creerBrouillons(rattachement.sessionId, rattachement.participantId));
    this.sujet.set(sujet);
    const deck = this.monterLeDeck(sujet, rattachement);
    const flux = this.creerFlux({
      baseUrl: this.baseUrl,
      sessionId: rattachement.sessionId,
      jeton: rattachement.jeton,
    });
    flux.onState((etat) => this.suivreLeFlux(deck, etat));
    flux.onStatut((statut) => {
      this.refusDuFlux.set(statut.etat === 'refuse' ? { statut: statut.statut } : null);
    });
    flux.onFin(() => this.clore());
    flux.ouvrir();
    this.flux = flux;
    this.identite = identite;
    this.configurerLeVerrou(sujet.ecrans[deck.current()]);
    this.etat.set('seance');
  }

  private clore(): void {
    this.terminee.set(true);
    this.brouillons()?.purger();
  }

  private monterLeDeck(sujet: CoursContent, rattachement: Rattachement): Deck {
    const deck = createDeck(sujet, { role: 'etudiant' });
    deck.subscribe(() => this.suivreLeDeck(deck));
    deck.setPacing(rattachement.modeRythme, null);
    deck.applyRemote(rattachement.ecranCourant);
    this.rythmeDistant = rattachement.modeRythme;
    this.deck = deck;
    return deck;
  }

  private suivreLeDeck(deck: Deck): void {
    const index = deck.current();
    if (index !== this.indexEcran()) {
      this.indexEcran.set(index);
      this.verdicts.set(new Map());
      this.configurerLeVerrou(this.sujet()?.ecrans[index]);
      this.chantier = this.chargerLecranSiNecessaire(index);
    }
    const verrouille = estEcranVerrouille(this.sujet()?.ecrans[index]);
    this.peutAvancer.set(!verrouille && deck.canNavigate(index + 1));
    this.peutReculer.set(!verrouille && deck.canNavigate(index - 1));
  }

  private configurerLeVerrou(ecran: EcranContent | undefined): void {
    if (ecran === undefined) {
      return;
    }
    this.verrou?.disarm();
    const verrou = createLock(regimeDeLEcran(ecran));
    verrou.onIncident((incident) => {
      this.incidents.push({ type: incident.type, horodatage: incident.horodatage });
    });
    verrou.arm();
    this.verrou = verrou;
  }

  private async chargerLecranSiNecessaire(index: number): Promise<void> {
    const sessionId = this.sessionId();
    const jeton = this.jeton();
    if (sessionId === null || jeton === '') {
      return;
    }
    const ecran = this.sujet()?.ecrans[index];
    if (!estEcranVerrouille(ecran)) {
      await this.chargerLesDonneesDeLEcran(ecran);
      return;
    }
    this.chargementEcran.set(true);
    this.echecEcran.set(null);
    try {
      const sujet = await firstValueFrom(this.port.lireSujet(sessionId, jeton));
      if (!this.detruit) {
        this.sujet.set(sujet);
        const relu = sujet.ecrans[index];
        this.configurerLeVerrou(relu);
        if (this.deck !== null) {
          this.peutAvancer.set(!estEcranVerrouille(relu) && this.deck.canNavigate(index + 1));
          this.peutReculer.set(!estEcranVerrouille(relu) && this.deck.canNavigate(index - 1));
        }
        if (estEcranVerrouille(relu)) {
          this.echecEcran.set({
            motif: 'sujet-indisponible',
            message: MESSAGE_ECRAN_INDISPONIBLE,
          });
        } else {
          await this.chargerLesDonneesDeLEcran(relu);
        }
      }
    } catch {
      this.echecEcran.set({
        motif: 'sujet-indisponible',
        message: MESSAGE_ECRAN_ECHEC,
      });
    } finally {
      if (!this.detruit) {
        this.chargementEcran.set(false);
      }
    }
  }

  private async chargerLesDonneesDeLEcran(ecran: EcranContent | undefined): Promise<void> {
    if (ecran?.type === BRIQUE_DE_RAPPEL && !this.rappelsDemandes) {
      await this.chargerLesRappels(ecran.id);
    }
  }

  private async chargerLesRappels(screenId: string): Promise<void> {
    const sessionId = this.sessionId();
    if (sessionId === null) {
      return;
    }
    this.rappelsDemandes = true;
    try {
      const { questions } = await firstValueFrom(this.port.lireRappels(sessionId, this.jeton()));
      this.ajouter(screenId, [{ kind: 'rappels', questions }]);
    } catch (erreur) {
      this.rappelsDemandes = false;
      this.ajouter(screenId, [retourDeRefus(refusDe(erreur).motif, texte('spaced-erreur'))]);
    }
  }

  private suivreLeFlux(deck: Deck, etat: EtatSession): void {
    this.statutSeance.set(etat.etat);
    if (etat.etat === 'terminee') {
      this.clore();
    }
    if (etat.etat === 'en_cours' && this.refusReponse()?.motif === 'seance-non-demarree') {
      this.refusReponse.set(null);
    }
    this.pilotage.set(etat.pilotage);
    const bascule = etat.modeRythme !== this.rythmeDistant;
    this.rythmeDistant = etat.modeRythme;
    deck.setPacing(etat.modeRythme, etat.intervalleLibre);
    if (doitSuivreLeFormateur(deck.current(), etat, bascule)) {
      deck.applyRemote(etat.ecranCourant);
    }
    this.chantier = Promise.all([
      this.viderLaFile(),
      this.reprendreLesReponsesLibres(),
      this.relireLesStrategiesRevelees(),
    ]).then(() => undefined);
  }

  private async reprendreLesReponsesLibres(): Promise<void> {
    const sessionId = this.sessionId();
    if (sessionId === null) {
      return;
    }
    await this.reponsesLibres.reprendre(sessionId, this.jeton());
  }

  private async relireLesStrategiesRevelees(): Promise<void> {
    const ecran = this.ecranCourant();
    const sessionId = this.sessionId();
    const defiId = objet(ecran?.donnees?.['probleme'])?.['id'];
    if (
      ecran === null ||
      sessionId === null ||
      ecran.type !== BRIQUE_DE_DEFI ||
      typeof defiId !== 'string' ||
      this.pilotage()[ecran.id]?.revele !== true ||
      this.defisReveles.has(defiId) ||
      !(this.retours().get(ecran.id) ?? []).some((retour) => retour.kind === 'strategies')
    ) {
      return;
    }
    this.defisReveles.add(defiId);
    await this.lireLesStrategies(sessionId, ecran.id, defiId);
  }

  private async lireLesStrategies(
    sessionId: string,
    screenId: string,
    defiId: string,
  ): Promise<void> {
    try {
      const { strategies } = await firstValueFrom(
        this.port.lireStrategies(sessionId, this.jeton(), defiId),
      );
      this.ajouter(screenId, [{ kind: 'strategies', defiId, strategies }]);
    } catch {
      this.defisReveles.delete(defiId);
    }
  }

  private ajouter(screenId: string, retours: readonly RetourBrique[]): void {
    this.retours.update((existants) => ajouterRetours(existants, screenId, retours));
  }

  private ecranDe(identifiant: string): string | null {
    return this.ecransDesIdentifiants().get(identifiant) ?? null;
  }

  private async relireMonEtat(): Promise<void> {
    const sessionId = this.sessionId();
    const sujet = this.sujet();
    if (sessionId === null || sujet === null) {
      return;
    }
    try {
      const etat = await firstValueFrom(this.port.lireMonEtat(sessionId, this.jeton()));
      this.repriseIndisponible.set(false);
      const rappels = new Set(etat.rappels.questionIds);
      const ecranDesRappels = ecranDuRappel(sujet);
      const retrouves = retoursDeLEtat(etat, (identifiant) =>
        rappels.has(identifiant) ? ecranDesRappels : this.ecranDe(identifiant),
      );
      for (const [screenId, retours] of retrouves) {
        this.ajouter(screenId, retours);
      }
      await Promise.all(
        etat.defis.map((defi) => {
          const screenId = this.ecranDe(defi.defiId);
          return screenId === null
            ? Promise.resolve()
            : this.lireLesStrategies(sessionId, screenId, defi.defiId);
        }),
      );
    } catch {
      this.repriseIndisponible.set(true);
    }
  }

  private async traiterEvenement(evenement: EvenementBrique): Promise<void> {
    if (this.sessionId() === null) {
      return;
    }
    this.retours.update((existants) => retirerLesRefus(existants, evenement.screenId));
    if ('dureeMs' in evenement) {
      this.verrou?.recordAnswerDuration(evenement.dureeMs);
    }
    this.remonterLesIncidents();
    switch (evenement.kind) {
      case 'reponse':
        return this.envoyerOuMettreEnFile({ nature: 'reponse', ...evenement }, evenement.screenId);
      case 'production':
        return this.envoyerOuMettreEnFile(
          { nature: 'production', ...evenement },
          evenement.screenId,
        );
      case 'jalon':
        return this.envoyerOuMettreEnFile(
          { nature: 'jalon', questionId: evenement.sondageId, valeur: evenement.etat, dureeMs: 0 },
          evenement.screenId,
        );
      case 'tentative':
        return this.tenter(evenement);
      case 'libre':
        return this.envoyerLeTexte(evenement);
      case 'defi':
        return this.defier(evenement);
    }
  }

  private async envoyerOuMettreEnFile(envoi: Envoi, screenId: string): Promise<void> {
    const sessionId = this.sessionId();
    if (sessionId === null) {
      return;
    }
    if (
      !this.enLigne() ||
      (await this.transmettre(sessionId, envoi, screenId, false)) === 'en-panne'
    ) {
      this.mettreEnFile(envoi);
      return;
    }
    await this.viderLaFile();
  }

  private async transmettre(
    sessionId: string,
    envoi: Envoi,
    screenId: string | null,
    depuisLaFile: boolean,
  ): Promise<IssueDeLEnvoi> {
    try {
      const retour = await this.envoyer(sessionId, envoi);
      this.refusReponse.set(null);
      if (screenId !== null && retour !== null) {
        this.ajouter(screenId, [retour]);
      }
      return 'transmise';
    } catch (erreur) {
      const refus = refusDe(erreur);
      if (refus.motif === 'reseau') {
        return 'en-panne';
      }
      await this.traiterLeRefus(refus, envoi.questionId, screenId, depuisLaFile);
      return 'transmise';
    }
  }

  private async envoyer(sessionId: string, envoi: Envoi): Promise<RetourBrique | null> {
    const jeton = this.jeton();
    if (envoi.nature === 'production') {
      const verdict = await firstValueFrom(
        this.port.envoyerProduction(sessionId, jeton, {
          questionId: envoi.questionId,
          valeur: envoi.valeur as ValeurProduction,
          dureeMs: envoi.dureeMs,
        }),
      );
      return retourDeProduction(envoi.questionId, verdict);
    }
    if (envoi.nature === 'jalon') {
      await firstValueFrom(
        this.port.declarerJalon(sessionId, jeton, envoi.questionId, envoi.valeur as EtatPulse),
      );
      return null;
    }
    const reponse: ReponseEtudiant = {
      questionId: envoi.questionId,
      valeur: envoi.valeur as ValeurReponse,
      dureeMs: envoi.dureeMs,
    };
    const verdict = await firstValueFrom(this.port.repondre(sessionId, jeton, reponse));
    this.afficherVerdict(envoi.questionId, verdict);
    return retourDeReponse(envoi.questionId, verdict);
  }

  private async traiterLeRefus(
    refus: ReponseRefusee,
    questionId: string,
    screenId: string | null,
    depuisLaFile: boolean,
  ): Promise<void> {
    if (refus.motif === 'deja-repondue') {
      await this.relireMonEtat();
      if (screenId !== null) {
        this.ajouter(screenId, [{ kind: 'deja-repondu', questionId }]);
      }
      return;
    }
    if (screenId !== null) {
      this.ajouter(screenId, [retourDeRefus(refus.motif, refus.message)]);
    }
    if (depuisLaFile || screenId === null || this.ecranVisuel()) {
      this.refusReponse.set({ motif: refus.motif, message: refus.message });
    }
  }

  private async tenter(evenement: EvenementDe<'tentative'>): Promise<void> {
    const sessionId = this.sessionId();
    if (sessionId === null) {
      return;
    }
    try {
      const verdict = await firstValueFrom(
        this.port.tenterEnigme(sessionId, this.jeton(), evenement.parcoursId, {
          enigmeId: evenement.enigmeId,
          reponse: evenement.reponse,
          dureeMs: evenement.dureeMs,
        }),
      );
      this.ajouter(evenement.screenId, [
        retourDeTentative(evenement.parcoursId, evenement.enigmeId, verdict),
      ]);
    } catch (erreur) {
      const refus = refusDe(erreur);
      const message = refus.motif === 'reseau' ? texte('tentatives-reseau') : refus.message;
      this.ajouter(evenement.screenId, [retourDeRefus(refus.motif, message)]);
      if (MOTIFS_DE_RESYNCHRONISATION.includes(refus.motif) || refus.motif === 'deja-repondue') {
        await this.relireMonEtat();
      }
    }
  }

  private async defier(evenement: EvenementDe<'defi'>): Promise<void> {
    const sessionId = this.sessionId();
    if (sessionId === null) {
      return;
    }
    try {
      const { strategies } = await firstValueFrom(
        this.port.envoyerDefi(sessionId, this.jeton(), evenement.defiId, {
          texte: evenement.texte,
          dureeMs: evenement.dureeMs,
        }),
      );
      this.ajouter(evenement.screenId, [
        { kind: 'strategies', defiId: evenement.defiId, strategies },
      ]);
    } catch (erreur) {
      const refus = refusDe(erreur);
      const message = refus.motif === 'reseau' ? texte('tentatives-reseau') : refus.message;
      this.ajouter(evenement.screenId, [retourDeRefus(refus.motif, message)]);
    }
  }

  private async envoyerLeTexte(evenement: EvenementDe<'libre'>): Promise<void> {
    const sessionId = this.sessionId();
    if (sessionId === null) {
      return;
    }
    await this.reponsesLibres.envoyer(sessionId, this.jeton(), {
      screenId: evenement.screenId,
      activityId: evenement.activityId,
      response: evenement.response,
      dureeMs: evenement.dureeMs,
    });
  }

  private afficherVerdict(questionId: string, recu: VerdictReponse): void {
    const verdicts = new Map(this.verdicts());
    verdicts.set(questionId, { reussite: recu.reussite, etiquette: recu.libelleConfusion });
    this.verdicts.set(verdicts);
  }

  private mettreEnFile(envoi: Envoi): void {
    const identite = this.identite;
    const sessionId = this.sessionId();
    if (identite === null || sessionId === null) {
      return;
    }
    try {
      enqueue({
        nature: envoi.nature,
        sessionId,
        studentKey: identite.studentKey,
        questionId: envoi.questionId,
        valeur: envoi.valeur,
        dureeMs: envoi.dureeMs,
        horodatage: new Date().toISOString(),
      });
      this.enAttente.set(true);
    } catch {
      this.fileRefusee.set(true);
    }
  }

  private async reprendreLesEnvois(): Promise<void> {
    const sessionId = this.sessionId();
    await this.viderLaFile();
    if (sessionId !== null) {
      await this.reponsesLibres.reprendre(sessionId, this.jeton());
    }
  }

  private async viderLaFile(): Promise<void> {
    if (this.sessionId() === null || this.videEnCours || !this.fileDeLaSeance()) {
      return;
    }
    this.videEnCours = true;
    try {
      await flush((envoi) => this.renvoyer(envoi), this.identite?.studentKey);
    } catch {
      this.fileRefusee.set(true);
    } finally {
      this.videEnCours = false;
      this.enAttente.set(this.fileDeLaSeance());
    }
  }

  private fileDeLaSeance(): boolean {
    const sessionId = this.sessionId();
    return pending().some((envoi) => envoi.sessionId === sessionId);
  }

  private async renvoyer(envoi: EnvoiReponse): Promise<boolean> {
    const sessionId = this.sessionId();
    if (sessionId === null || envoi.sessionId !== sessionId) {
      return false;
    }
    const issue = await this.transmettre(sessionId, envoi, this.ecranDe(envoi.questionId), true);
    return issue === 'transmise';
  }

  private remonterLesIncidents(): void {
    const sessionId = this.sessionId();
    if (sessionId === null || this.incidents.length === 0) {
      return;
    }
    const lot = [...this.incidents];
    this.incidents.length = 0;
    void firstValueFrom(this.port.signalerIncidents(sessionId, this.jeton(), lot)).catch(
      () => undefined,
    );
  }
}
