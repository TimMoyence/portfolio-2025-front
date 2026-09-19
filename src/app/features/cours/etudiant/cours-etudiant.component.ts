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
  PacingMode,
  RegimeVerrou,
} from '../../../../cours/content/types';
import type { Deck } from '../../../../cours/runtime/core/deck';
import { createDeck } from '../../../../cours/runtime/core/deck';
import type { Identity } from '../../../../cours/runtime/core/identity';
import { saveIdentity } from '../../../../cours/runtime/core/identity';
import type { Lock } from '../../../../cours/runtime/core/lock';
import { createLock } from '../../../../cours/runtime/core/lock';
import type { EnvoiReponse } from '../../../../cours/runtime/core/queue';
import { enqueue, flush, pending } from '../../../../cours/runtime/core/queue';
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
import type { ReponseSlide } from '../../../shared/slides/session/slide-activity.component';
import { CREATEUR_FLUX } from '../cours-flux.token';
import { identifiantsDesQuestions } from '../../../shared/slides/session/lecture-ecran';
import { SlideActivityComponent } from '../../../shared/slides/session/slide-activity.component';
import { SlideComponent } from '../../../shared/slides/deck/slide.component';
import { SlideDeckComponent } from '../../../shared/slides/deck/slide-deck.component';

type EtatEtudiant = 'code' | 'rattachement' | 'chargement' | 'sujet-refuse' | 'seance';

type MotifEchec = MotifRefusRattachement | 'code-invalide' | 'identite-refusee';

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

const MESSAGE_CODE = $localize`:cours.codeInvalide|@@coursCodeInvalide:Le code de séance compte quatre chiffres : recopiez-le sans autre caractère.`;
const MESSAGE_IDENTITE = $localize`:cours.identiteRefusee|@@coursIdentiteRefusee:Vérifiez votre prénom, votre nom et votre adresse e-mail, puis réessayez.`;
const MESSAGE_ECHEC = $localize`:cours.rattachementEchec|@@coursRattachementEchec:Le rattachement à la séance a échoué. Prévenez votre formateur.`;
const MESSAGE_ECRAN_INDISPONIBLE = $localize`:cours.ecranIndisponible|@@coursEcranIndisponible:L’écran n’est pas encore disponible pour cette séance.`;
const MESSAGE_ECRAN_ECHEC = $localize`:cours.ecranChargementEchec|@@coursEcranChargementEchec:L’écran n’a pas pu être chargé.`;

const MOTIF_CODE = /^\d{4}$/;
const ESPACES = /\s+/g;
const DELAI_MINIMUM_FORMULAIRE_MS = 1_200;

function normaliserCode(saisi: string): string | null {
  const compact = saisi.replace(ESPACES, '');
  return MOTIF_CODE.test(compact) ? compact : null;
}

function lireRefus(erreur: unknown): RefusAffiche {
  const refus = erreur instanceof SujetRefuse ? erreur : new SujetRefuse('sujet-indisponible', 0);
  return { motif: refus.motif, message: refus.message };
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
  imports: [SlideActivityComponent, SlideComponent, SlideDeckComponent],
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
                  <p
                    class="student-status"
                    data-testid="etudiant-flux-refuse"
                    role="alert"
                    [attr.data-statut]="refus.statut"
                    i18n="cours.fluxRefuse|@@coursFluxRefuse"
                  >
                    Le suivi en direct a été refusé par le serveur (statut {{ refus.statut }}). Les
                    activités réapparaîtront dès que la connexion sera rétablie.
                  </p>
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
                    <app-slide-deck mode="scroll" [allowFullscreen]="false">
                      <app-slide [id]="ecran.id">
                        <app-slide-activity
                          [slide]="ecran"
                          render="hand"
                          [role]="'etudiant'"
                          [sessionId]="sessionId()"
                          [jeton]="jeton()"
                          (reponse)="envoyer($event)"
                        />
                      </app-slide>
                    </app-slide-deck>
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
  readonly statutSeance = signal<StatutSession | null>(null);
  readonly refusReponse = signal<RefusDeReponse | null>(null);
  readonly refusDuFlux = signal<RefusDuFlux | null>(null);
  readonly echecEcran = signal<RefusAffiche | null>(null);
  readonly chargementEcran = signal(false);

  readonly ecranCourant = computed<EcranContent | null>(() => {
    const ecran = this.sujet()?.ecrans[this.indexEcran()];
    return estEcranVerrouille(ecran) ? null : (ecran ?? null);
  });

  private readonly verdicts = signal<ReadonlyMap<string, VerdictRecu>>(new Map());

  private readonly questionsDeLEcran = computed<readonly string[]>(() => {
    const ecran = this.ecranCourant();
    return ecran === null ? [] : identifiantsDesQuestions(ecran);
  });

  readonly verdictsAffiches = computed<readonly VerdictAffiche[]>(() => {
    const recus = this.verdicts();
    return this.questionsDeLEcran().flatMap((questionId, index) => {
      const recu = recus.get(questionId);
      return recu === undefined ? [] : [{ questionId, rang: index + 1, ...recu }];
    });
  });

  private readonly port = inject(FORMATIONS_PORT);
  private readonly creerFlux = inject(CREATEUR_FLUX);
  private readonly baseUrl = `${getApiBaseUrl()}/formations`;
  private readonly enLigne = signal(typeof navigator === 'undefined' || navigator.onLine);
  private readonly incidents: IncidentEtudiant[] = [];
  private readonly debutFormulaire = Date.now();

  private readonly seanceOuverte = signal<Pick<Rattachement, 'sessionId' | 'jeton'> | null>(null);
  protected readonly sessionId = computed(() => this.seanceOuverte()?.sessionId ?? null);
  protected readonly jeton = computed(() => this.seanceOuverte()?.jeton ?? '');

  private identite: Identity | null = null;
  private rattachement: Rattachement | null = null;
  private flux: Sync | null = null;
  private verrou: Lock | null = null;
  private deck: Deck | null = null;
  private rythmeDistant: PacingMode = 'pilote';
  private detruit = false;
  private videEnCours = false;
  private chantier: Promise<void> = Promise.resolve();

  constructor() {
    const aLaDestruction = inject(DestroyRef);
    const fenetre = typeof window === 'undefined' ? null : window;
    if (fenetre !== null) {
      const surRetour = (): void => {
        this.enLigne.set(true);
        this.chantier = this.viderLaFile();
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

  protected envoyer(reponse: ReponseSlide): void {
    this.chantier = this.traiter({
      questionId: reponse.questionId,
      valeur: reponse.valeur,
      dureeMs: reponse.dureeMs,
    });
  }

  protected avancer(): void {
    this.deck?.next();
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
          studentKey: identite.studentKey,
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
    flux.join(identite);
    this.flux = flux;
    this.configurerLeVerrou(sujet.ecrans[deck.current()]);
    this.etat.set('seance');
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
    this.peutAvancer.set(
      !estEcranVerrouille(this.sujet()?.ecrans[index]) && deck.canNavigate(index + 1),
    );
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
    if (sessionId === null || jeton === '' || !estEcranVerrouille(this.sujet()?.ecrans[index])) {
      return;
    }
    this.chargementEcran.set(true);
    this.echecEcran.set(null);
    try {
      const sujet = await firstValueFrom(this.port.lireSujet(sessionId, jeton));
      if (!this.detruit) {
        this.sujet.set(sujet);
        const ecran = sujet.ecrans[index];
        this.configurerLeVerrou(ecran);
        if (this.deck !== null) {
          this.peutAvancer.set(!estEcranVerrouille(ecran) && this.deck.canNavigate(index + 1));
        }
        if (estEcranVerrouille(ecran)) {
          this.echecEcran.set({
            motif: 'sujet-indisponible',
            message: MESSAGE_ECRAN_INDISPONIBLE,
          });
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

  private suivreLeFlux(deck: Deck, etat: EtatSession): void {
    this.statutSeance.set(etat.etat);
    this.terminee.set(etat.etat === 'terminee');
    if (etat.etat === 'en_cours' && this.refusReponse()?.motif === 'seance-non-demarree') {
      this.refusReponse.set(null);
    }
    const bascule = etat.modeRythme !== this.rythmeDistant;
    this.rythmeDistant = etat.modeRythme;
    deck.setPacing(etat.modeRythme, etat.intervalleLibre);
    if (doitSuivreLeFormateur(deck.current(), etat, bascule)) {
      deck.applyRemote(etat.ecranCourant);
    }
    this.chantier = this.viderLaFile();
  }

  private async traiter(reponse: ReponseEtudiant): Promise<void> {
    const sessionId = this.sessionId();
    if (sessionId === null) {
      return;
    }
    this.remonterLesIncidents();
    if (!this.enLigne() || (await this.transmettre(sessionId, reponse)) === 'en-panne') {
      this.mettreEnFile(reponse);
      return;
    }
    await this.viderLaFile();
  }

  private async transmettre(sessionId: string, reponse: ReponseEtudiant): Promise<IssueDeLEnvoi> {
    try {
      const recu = await firstValueFrom(this.port.repondre(sessionId, this.jeton(), reponse));
      this.refusReponse.set(null);
      this.afficherVerdict(reponse.questionId, recu);
      return 'transmise';
    } catch (erreur) {
      const refus = erreur instanceof ReponseRefusee ? erreur : new ReponseRefusee('reseau', 0);
      if (refus.motif === 'reseau') {
        return 'en-panne';
      }
      if (refus.motif !== 'deja-repondue') {
        this.refusReponse.set({ motif: refus.motif, message: refus.message });
      }
      return 'transmise';
    }
  }

  private afficherVerdict(questionId: string, recu: VerdictReponse): void {
    const verdicts = new Map(this.verdicts());
    verdicts.set(questionId, { reussite: recu.reussite, etiquette: recu.libelleConfusion });
    this.verdicts.set(verdicts);
  }

  private mettreEnFile(reponse: ReponseEtudiant): void {
    const identite = this.identite;
    const sessionId = this.sessionId();
    if (identite === null || sessionId === null) {
      return;
    }
    try {
      enqueue({
        sessionId,
        studentKey: identite.studentKey,
        questionId: reponse.questionId,
        valeur: reponse.valeur,
        dureeMs: reponse.dureeMs,
        horodatage: new Date().toISOString(),
      });
      this.enAttente.set(true);
    } catch {
      this.fileRefusee.set(true);
    }
  }

  private async viderLaFile(): Promise<void> {
    if (this.sessionId() === null || this.videEnCours || !this.fileDeLaSeance()) {
      return;
    }
    this.videEnCours = true;
    try {
      await flush((envoi) => this.renvoyer(envoi));
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
    const issue = await this.transmettre(sessionId, {
      questionId: envoi.questionId,
      valeur: envoi.valeur as ValeurReponse,
      dureeMs: envoi.dureeMs,
    });
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
