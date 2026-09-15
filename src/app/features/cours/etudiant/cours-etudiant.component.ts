import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { CoursContent, EcranContent, PacingMode } from '../../../../cours/content/types';
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
import type { ReponseBrique } from '../ecran/cours-ecran.component';
import { CREATEUR_FLUX } from '../cours-flux.token';
import { CoursEcranComponent, identifiantsDesQuestions } from '../ecran/cours-ecran.component';

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

type IssueDeLEnvoi = 'transmise' | 'en-panne';

interface VerdictRecu {
  readonly reussite: boolean;
  readonly etiquette: string | null;
}

interface VerdictAffiche extends VerdictRecu {
  readonly questionId: string;
  readonly rang: number;
}

const REGIME_VERROU = 'focus';

const MESSAGE_CODE = $localize`:cours.codeInvalide|@@coursCodeInvalide:Le code de séance compte quatre chiffres : recopiez-le sans autre caractère.`;
const MESSAGE_IDENTITE = $localize`:cours.identiteRefusee|@@coursIdentiteRefusee:Vérifiez votre prénom, votre nom et votre adresse e-mail, puis réessayez.`;
const MESSAGE_ECHEC = $localize`:cours.rattachementEchec|@@coursRattachementEchec:Le rattachement à la séance a échoué. Prévenez votre formateur.`;

const MOTIF_CODE = /^\d{4}$/;
const ESPACES = /\s+/g;

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

@Component({
  selector: 'app-cours-etudiant',
  standalone: true,
  imports: [CoursEcranComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (etat()) {
      @case ('chargement') {
        <p
          data-testid="etudiant-chargement"
          role="status"
          i18n="cours.chargementSujet|@@coursChargementSujet"
        >
          Chargement de votre sujet…
        </p>
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
      @case ('seance') {
        <section data-testid="etudiant-seance">
          @if (sujet(); as cours) {
            <h2 data-testid="etudiant-titre">{{ cours.titre }}</h2>
            <p data-testid="etudiant-progression">
              {{ indexEcran() + 1 }} / {{ cours.ecrans.length }}
            </p>
          }
          @if (terminee()) {
            <p data-testid="etudiant-fin" role="status" i18n="cours.fin|@@coursFin">
              La séance est terminée. Merci de votre participation.
            </p>
          } @else if (statutSeance() !== 'en_cours') {
            <p
              data-testid="etudiant-attente"
              role="status"
              i18n="cours.attenteDemarrage|@@coursAttenteDemarrage"
            >
              La séance n’a pas encore démarré : le premier écran s’affichera dès que votre
              formateur la lancera.
            </p>
          } @else {
            @if (ecranCourant(); as ecran) {
              <app-cours-ecran
                [ecran]="ecran"
                rendu="hand"
                [role]="'etudiant'"
                (reponse)="envoyer($event)"
              />
            }
            @if (peutAvancer()) {
              <button
                type="button"
                data-testid="etudiant-suivant"
                (click)="avancer()"
                i18n="cours.ecranSuivant|@@coursEcranSuivant"
              >
                Écran suivant
              </button>
            }
          }
          <ul data-testid="etudiant-verdicts" aria-live="polite">
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
              data-testid="etudiant-hors-ligne"
              role="status"
              i18n="cours.horsLigne|@@coursHorsLigne"
            >
              Votre réponse est enregistrée sur ce poste et partira au retour du réseau.
            </p>
          }
          @if (refusReponse(); as refus) {
            <p data-testid="etudiant-reponse-refusee" role="alert" [attr.data-motif]="refus.motif">
              {{ refus.message }}
            </p>
          }
          @if (fileRefusee()) {
            <p
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
        <form data-testid="etudiant-entree" (submit)="soumettre($event)">
          <label for="etudiant-code" i18n="cours.code|@@coursCode">Code de la séance</label>
          <input id="etudiant-code" name="code" inputmode="numeric" autocomplete="off" required />
          <label for="etudiant-prenom" i18n="cours.prenom|@@coursPrenom">Prénom</label>
          <input id="etudiant-prenom" name="prenom" required />
          <label for="etudiant-nom" i18n="cours.nom|@@coursNom">Nom</label>
          <input id="etudiant-nom" name="nom" required />
          <label for="etudiant-email" i18n="cours.email|@@coursEmail">Adresse e-mail</label>
          <input id="etudiant-email" name="email" type="email" required />
          <input name="website" type="text" tabindex="-1" autocomplete="off" hidden />
          <button
            type="submit"
            [disabled]="etat() === 'rattachement'"
            i18n="cours.rejoindre|@@coursRejoindre"
          >
            Rejoindre
          </button>
          @if (messageEchec(); as message) {
            <p data-testid="etudiant-echec" role="alert" [attr.data-motif]="motifEchec()">
              {{ message }}
            </p>
          }
        </form>
      }
    }
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

  readonly ecranCourant = computed<EcranContent | null>(
    () => this.sujet()?.ecrans[this.indexEcran()] ?? null,
  );

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

  private identite: Identity | null = null;
  private rattachement: Rattachement | null = null;
  private sessionId: string | null = null;
  private jeton = '';
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

  protected envoyer(reponse: ReponseBrique): void {
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
    this.sessionId = rattachement.sessionId;
    this.jeton = rattachement.jeton;
    this.sujet.set(sujet);
    const deck = this.monterLeDeck(sujet, rattachement);
    const flux = this.creerFlux({
      baseUrl: this.baseUrl,
      sessionId: rattachement.sessionId,
      jeton: rattachement.jeton,
    });
    flux.onState((etat) => this.suivreLeFlux(deck, etat));
    flux.join(identite);
    this.flux = flux;
    const verrou = createLock(REGIME_VERROU);
    verrou.onIncident((incident) => {
      this.incidents.push({ type: incident.type, horodatage: incident.horodatage });
    });
    verrou.arm();
    this.verrou = verrou;
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
    }
    this.peutAvancer.set(deck.canNavigate(index + 1));
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
    if (this.sessionId === null) {
      return;
    }
    this.remonterLesIncidents();
    if (!this.enLigne() || (await this.transmettre(this.sessionId, reponse)) === 'en-panne') {
      this.mettreEnFile(reponse);
      return;
    }
    await this.viderLaFile();
  }

  private async transmettre(sessionId: string, reponse: ReponseEtudiant): Promise<IssueDeLEnvoi> {
    try {
      const recu = await firstValueFrom(this.port.repondre(sessionId, this.jeton, reponse));
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
    if (identite === null || this.sessionId === null) {
      return;
    }
    try {
      enqueue({
        sessionId: this.sessionId,
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
    if (this.sessionId === null || this.videEnCours || !this.fileDeLaSeance()) {
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
    return pending().some((envoi) => envoi.sessionId === this.sessionId);
  }

  private async renvoyer(envoi: EnvoiReponse): Promise<boolean> {
    if (this.sessionId === null || envoi.sessionId !== this.sessionId) {
      return false;
    }
    const issue = await this.transmettre(this.sessionId, {
      questionId: envoi.questionId,
      valeur: envoi.valeur as ValeurReponse,
      dureeMs: envoi.dureeMs,
    });
    return issue === 'transmise';
  }

  private remonterLesIncidents(): void {
    if (this.sessionId === null || this.incidents.length === 0) {
      return;
    }
    const lot = [...this.incidents];
    this.incidents.length = 0;
    void firstValueFrom(this.port.signalerIncidents(this.sessionId, this.jeton, lot)).catch(
      () => undefined,
    );
  }
}
