import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  InjectionToken,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { CoursContent } from '../../../../cours/content/types';
import type { Deck } from '../../../../cours/runtime/core/deck';
import { createDeck } from '../../../../cours/runtime/core/deck';
import type { Identity } from '../../../../cours/runtime/core/identity';
import { saveIdentity } from '../../../../cours/runtime/core/identity';
import type { Lock } from '../../../../cours/runtime/core/lock';
import { createLock } from '../../../../cours/runtime/core/lock';
import type { EnvoiReponse } from '../../../../cours/runtime/core/queue';
import { enqueue, flush, pending } from '../../../../cours/runtime/core/queue';
import { shuffleWithSeed } from '../../../../cours/runtime/core/seed';
import type { Sync, SyncOptions } from '../../../../cours/runtime/core/sync';
import { createSync } from '../../../../cours/runtime/core/sync';
import { getApiBaseUrl } from '../../../core/http/api-config';
import type {
  IncidentEtudiant,
  MotifRefusRattachement,
  Rattachement,
  ReponseEtudiant,
  ValeurReponse,
  VerdictReponse,
} from '../../../core/ports/formations.port';
import { FORMATIONS_PORT, RattachementRefuse } from '../../../core/ports/formations.port';

export type CreateurFlux = (options: SyncOptions) => Sync;

export const CREATEUR_FLUX = new InjectionToken<CreateurFlux>('CREATEUR_FLUX', {
  providedIn: 'root',
  factory: () => createSync,
});

type EtatEtudiant = 'code' | 'rattachement' | 'seance';

type MotifEchec = MotifRefusRattachement | 'code-invalide' | 'identite-refusee';

interface QuestionPublique {
  readonly id: string;
  readonly enonce: string;
  readonly unite: string;
}

interface VerdictAffiche {
  readonly reussite: boolean;
  readonly etiquette: string | null;
}

const REGIME_VERROU = 'focus';
const COURS_ID = 'fp-capitalisation';
const DUREE_ECRAN_S = 90;

const MESSAGE_CODE = 'Le code de séance compte quatre chiffres : recopiez-le sans autre caractère.';
const MESSAGE_IDENTITE =
  'Vérifiez votre prénom, votre nom et votre adresse e-mail, puis réessayez.';
const MESSAGE_ECHEC = 'Le rattachement à la séance a échoué. Prévenez votre formateur.';

const MOTIF_CODE = /^\d{4}$/;
const ESPACES = /\s+/g;

const QUESTIONS: readonly QuestionPublique[] = [
  {
    id: 'Q-CAP-01',
    enonce: 'Un capital de 1 000 € placé à 4 % pendant 10 ans, intérêts composés : quelle valeur ?',
    unite: '€',
  },
  {
    id: 'Q-CAP-02',
    enonce: 'Quel taux mensuel équivaut à 12 % par an, intérêts composés ?',
    unite: '%',
  },
  {
    id: 'Q-CAP-03',
    enonce: 'Combien d’années faut-il pour doubler un capital placé à 5 % ?',
    unite: 'ans',
  },
  {
    id: 'Q-CAP-04',
    enonce: 'Quelle mensualité pour un emprunt de 10 000 € sur 24 mois à 3 % ?',
    unite: '€',
  },
  {
    id: 'Q-CAP-05',
    enonce: 'Quelle valeur aujourd’hui pour 5 000 € disponibles dans 3 ans à 4 % ?',
    unite: '€',
  },
];

function normaliserCode(saisi: string): string | null {
  const compact = saisi.replace(ESPACES, '');
  return MOTIF_CODE.test(compact) ? compact : null;
}

function lireVerdict(recu: VerdictReponse): VerdictAffiche {
  return {
    reussite: recu.correcte,
    etiquette: recu.libelleConfusion,
  };
}

function construireCours(questions: readonly QuestionPublique[]): CoursContent {
  return {
    id: COURS_ID,
    titre: 'Capitalisation',
    niveau: 'BTS',
    duree: questions.length * DUREE_ECRAN_S,
    concepts: questions.map((question) => question.id),
    ecrans: questions.map((question) => ({
      id: question.id,
      type: 'numeric',
      duree: DUREE_ECRAN_S,
      interactif: true,
    })),
  };
}

@Component({
  selector: 'app-cours-etudiant',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (etat() !== 'seance') {
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
    @if (etat() === 'seance') {
      <section data-testid="etudiant-seance">
        <p data-testid="etudiant-progression">{{ rang() }} / {{ ordreDesQuestions().length }}</p>
        <h2 data-testid="etudiant-enonce">{{ questionCourante().enonce }}</h2>
        @if (terminee()) {
          <p data-testid="etudiant-fin" role="status" i18n="cours.fin|@@coursFin">
            La séance est terminée. Merci de votre participation.
          </p>
        } @else {
          <form data-testid="etudiant-reponse" (submit)="envoyerLaReponse($event)">
            <label for="etudiant-valeur">
              <span i18n="cours.votreReponse|@@coursVotreReponse">Votre réponse</span>
              ({{ questionCourante().unite }})
            </label>
            <input
              id="etudiant-valeur"
              name="valeur"
              inputmode="decimal"
              autocomplete="off"
              required
            />
            <button type="submit" i18n="cours.valider|@@coursValider">Valider</button>
          </form>
        }
        @if (peutAvancer()) {
          <button type="button" (click)="avancer()" i18n="cours.suivant|@@coursSuivant">
            Question suivante
          </button>
        }
        @if (verdict(); as resultat) {
          <p data-testid="etudiant-verdict" [attr.data-reussite]="resultat.reussite">
            @if (resultat.reussite) {
              <span i18n="cours.reussi|@@coursReussi">Réussi</span>
            } @else {
              <span i18n="cours.manque|@@coursManque">Manqué</span>
            }
          </p>
          @if (resultat.etiquette; as etiquette) {
            <p data-testid="etudiant-confusion">{{ etiquette }}</p>
          }
        }
        @if (enAttente()) {
          <p
            data-testid="etudiant-hors-ligne"
            role="status"
            i18n="cours.horsLigne|@@coursHorsLigne"
          >
            Votre réponse est enregistrée sur ce poste et partira au retour du réseau.
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
  `,
})
export class CoursEtudiantComponent {
  readonly etat = signal<EtatEtudiant>('code');
  readonly motifEchec = signal<MotifEchec | null>(null);
  readonly messageEchec = signal<string | null>(null);
  readonly graine = signal(0);
  readonly ecranCourant = signal(0);
  readonly verdict = signal<VerdictAffiche | null>(null);
  readonly enAttente = signal(false);
  readonly fileRefusee = signal(false);
  readonly terminee = signal(false);
  readonly peutAvancer = signal(false);

  readonly ordreDesQuestions = computed(() => shuffleWithSeed(QUESTIONS, this.graine()));

  readonly questionCourante = computed<QuestionPublique>(() => {
    const ordre = this.ordreDesQuestions();
    const index = Math.min(Math.max(this.ecranCourant(), 0), ordre.length - 1);
    return ordre[index];
  });

  readonly rang = computed(() => this.ecranCourant() + 1);

  private readonly port = inject(FORMATIONS_PORT);
  private readonly creerFlux = inject(CREATEUR_FLUX);
  private readonly baseUrl = `${getApiBaseUrl()}/formations`;
  private readonly enLigne = signal(typeof navigator === 'undefined' || navigator.onLine);
  private readonly incidents: IncidentEtudiant[] = [];
  private readonly debutFormulaire = Date.now();

  private identite: Identity | null = null;
  private sessionId: string | null = null;
  private jeton = '';
  private flux: Sync | null = null;
  private verrou: Lock | null = null;
  private deck: Deck | null = null;
  private debutQuestion = Date.now();
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

  protected envoyerLaReponse(evenement: Event): void {
    evenement.preventDefault();
    const formulaire = evenement.currentTarget as HTMLFormElement;
    const valeur = String(new FormData(formulaire).get('valeur') ?? '').trim();
    this.chantier = this.traiter(valeur);
  }

  protected avancer(): void {
    this.deck?.next();
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
    this.motifEchec.set(null);
    this.messageEchec.set(null);
    this.etat.set('rattachement');
    try {
      const rattachement = await firstValueFrom(
        this.port.rejoindre(code, {
          studentKey: identite.studentKey,
          prenom: identite.prenom,
          nom: identite.nom,
          email: identite.email,
          website: String(donnees.get('website') ?? ''),
          formStartedAt: this.debutFormulaire,
        }),
      );
      this.ouvrirLaSeance(identite, rattachement);
    } catch (erreur) {
      this.etat.set('code');
      const refus = erreur instanceof RattachementRefuse ? erreur : null;
      this.echouer(refus?.motif ?? 'rattachement-impossible', refus?.message ?? MESSAGE_ECHEC);
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

  private ouvrirLaSeance(identite: Identity, rattachement: Rattachement): void {
    this.identite = identite;
    this.sessionId = rattachement.sessionId;
    this.jeton = rattachement.jeton;
    this.graine.set(rattachement.seed);
    this.monterLeDeck(rattachement);
    const flux = this.creerFlux({
      baseUrl: this.baseUrl,
      sessionId: rattachement.sessionId,
      jeton: rattachement.jeton,
    });
    flux.onState((etat) => {
      this.terminee.set(etat.etat === 'terminee');
      this.deck?.applyRemote(etat.ecranCourant);
    });
    flux.join(identite);
    this.flux = flux;
    const verrou = createLock(REGIME_VERROU);
    verrou.onIncident((incident) => {
      this.incidents.push({ type: incident.type, horodatage: incident.horodatage });
    });
    verrou.arm();
    this.verrou = verrou;
    this.debutQuestion = Date.now();
    this.etat.set('seance');
  }

  private monterLeDeck(rattachement: Rattachement): void {
    const deck = createDeck(construireCours(this.ordreDesQuestions()), { role: 'etudiant' });
    deck.subscribe((etat) => {
      this.ecranCourant.set(etat.ecranCourant);
      this.peutAvancer.set(deck.canNavigate(etat.ecranCourant + 1));
      this.verdict.set(null);
      this.debutQuestion = Date.now();
    });
    deck.setPacing(rattachement.modeRythme, null);
    deck.applyRemote(rattachement.ecranCourant);
    this.ecranCourant.set(deck.current());
    this.peutAvancer.set(deck.canNavigate(deck.current() + 1));
    this.deck = deck;
  }

  private async traiter(valeur: string): Promise<void> {
    if (this.sessionId === null) {
      return;
    }
    const reponse: ReponseEtudiant = {
      questionId: this.questionCourante().id,
      valeur,
      dureeMs: Math.max(0, Date.now() - this.debutQuestion),
    };
    this.remonterLesIncidents();
    if (!this.enLigne()) {
      this.mettreEnFile(reponse);
      return;
    }
    try {
      const recu = await firstValueFrom(this.port.repondre(this.sessionId, this.jeton, reponse));
      this.verdict.set(lireVerdict(recu));
    } catch {
      this.mettreEnFile(reponse);
    }
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
    if (this.sessionId === null || this.videEnCours) {
      return;
    }
    this.videEnCours = true;
    try {
      await flush((envoi) => this.renvoyer(envoi));
    } finally {
      this.videEnCours = false;
      this.enAttente.set(pending().length > 0);
    }
  }

  private async renvoyer(envoi: EnvoiReponse): Promise<boolean> {
    if (this.sessionId === null || envoi.sessionId !== this.sessionId) {
      return false;
    }
    try {
      const recu = await firstValueFrom(
        this.port.repondre(this.sessionId, this.jeton, {
          questionId: envoi.questionId,
          valeur: envoi.valeur as ValeurReponse,
          dureeMs: envoi.dureeMs,
        }),
      );
      this.verdict.set(lireVerdict(recu));
      return true;
    } catch {
      return false;
    }
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
