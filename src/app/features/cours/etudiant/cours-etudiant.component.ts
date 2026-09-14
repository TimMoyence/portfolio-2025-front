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
import type { CoursContent, EcranContent } from '../../../../cours/content/types';
import type { Deck } from '../../../../cours/runtime/core/deck';
import { createDeck } from '../../../../cours/runtime/core/deck';
import type { Identity } from '../../../../cours/runtime/core/identity';
import { saveIdentity } from '../../../../cours/runtime/core/identity';
import type { Lock } from '../../../../cours/runtime/core/lock';
import { createLock } from '../../../../cours/runtime/core/lock';
import type { EnvoiReponse } from '../../../../cours/runtime/core/queue';
import { enqueue, flush, pending } from '../../../../cours/runtime/core/queue';
import type { EtatSession, Sync, SyncOptions } from '../../../../cours/runtime/core/sync';
import { createSync } from '../../../../cours/runtime/core/sync';
import { getApiBaseUrl } from '../../../core/http/api-config';
import type {
  IncidentEtudiant,
  MotifRefusRattachement,
  MotifRefusSujet,
  Rattachement,
  ReponseEtudiant,
  ValeurReponse,
  VerdictReponse,
} from '../../../core/ports/formations.port';
import {
  FORMATIONS_PORT,
  RattachementRefuse,
  SujetRefuse,
} from '../../../core/ports/formations.port';
import type { ReponseBrique } from '../ecran/cours-ecran.component';
import { CoursEcranComponent } from '../ecran/cours-ecran.component';

export type CreateurFlux = (options: SyncOptions) => Sync;

export const CREATEUR_FLUX = new InjectionToken<CreateurFlux>('CREATEUR_FLUX', {
  providedIn: 'root',
  factory: () => createSync,
});

type EtatEtudiant = 'code' | 'rattachement' | 'chargement' | 'sujet-refuse' | 'seance';

type MotifEchec = MotifRefusRattachement | 'code-invalide' | 'identite-refusee';

interface RefusAffiche {
  readonly motif: MotifRefusSujet;
  readonly message: string;
}

interface VerdictAffiche {
  readonly questionId: string;
  readonly reussite: boolean;
  readonly etiquette: string | null;
}

const REGIME_VERROU = 'focus';

const MESSAGE_CODE = 'Le code de séance compte quatre chiffres : recopiez-le sans autre caractère.';
const MESSAGE_IDENTITE =
  'Vérifiez votre prénom, votre nom et votre adresse e-mail, puis réessayez.';
const MESSAGE_ECHEC = 'Le rattachement à la séance a échoué. Prévenez votre formateur.';

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
            @for (verdict of verdicts(); track verdict.questionId) {
              <li
                data-testid="etudiant-verdict"
                [attr.data-question]="verdict.questionId"
                [attr.data-reussite]="verdict.reussite"
              >
                @if (verdict.reussite) {
                  <span i18n="cours.reussi|@@coursReussi">Réussi</span>
                } @else {
                  <span i18n="cours.manque|@@coursManque">Manqué</span>
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
  readonly verdicts = signal<readonly VerdictAffiche[]>([]);
  readonly enAttente = signal(false);
  readonly fileRefusee = signal(false);
  readonly terminee = signal(false);
  readonly peutAvancer = signal(false);

  readonly ecranCourant = computed<EcranContent | null>(
    () => this.sujet()?.ecrans[this.indexEcran()] ?? null,
  );

  private readonly port = inject(FORMATIONS_PORT);
  private readonly creerFlux = inject(CREATEUR_FLUX);
  private readonly baseUrl = `${getApiBaseUrl()}/formations`;
  private readonly enLigne = signal(typeof navigator === 'undefined' || navigator.onLine);
  private readonly incidents: IncidentEtudiant[] = [];
  private readonly questionsDeLEcran = new Set<string>();
  private readonly debutFormulaire = Date.now();

  private identite: Identity | null = null;
  private sessionId: string | null = null;
  private jeton = '';
  private flux: Sync | null = null;
  private verrou: Lock | null = null;
  private deck: Deck | null = null;
  private ecranDistant = 0;
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

  protected envoyer(reponse: ReponseBrique): void {
    this.questionsDeLEcran.add(reponse.questionId);
    this.chantier = this.traiter({
      questionId: reponse.questionId,
      valeur: reponse.valeur,
      dureeMs: reponse.dureeMs,
    });
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
    const rattachement = await this.demanderRattachement(code, identite, donnees);
    if (rattachement === null) {
      return;
    }
    const sujet = await this.lireLeSujet(rattachement);
    if (sujet !== null) {
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
    this.identite = identite;
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
    this.ecranDistant = rattachement.ecranCourant;
    this.deck = deck;
    return deck;
  }

  private suivreLeDeck(deck: Deck): void {
    const index = deck.current();
    if (index !== this.indexEcran()) {
      this.indexEcran.set(index);
      this.questionsDeLEcran.clear();
      this.verdicts.set([]);
    }
    this.peutAvancer.set(deck.canNavigate(index + 1));
  }

  private suivreLeFlux(deck: Deck, etat: EtatSession): void {
    this.terminee.set(etat.etat === 'terminee');
    deck.setPacing(etat.modeRythme, etat.intervalleLibre);
    if (etat.modeRythme === 'pilote' || etat.ecranCourant !== this.ecranDistant) {
      deck.applyRemote(etat.ecranCourant);
    }
    this.ecranDistant = etat.ecranCourant;
  }

  private async traiter(reponse: ReponseEtudiant): Promise<void> {
    if (this.sessionId === null) {
      return;
    }
    this.remonterLesIncidents();
    if (!this.enLigne()) {
      this.mettreEnFile(reponse);
      return;
    }
    try {
      const recu = await firstValueFrom(this.port.repondre(this.sessionId, this.jeton, reponse));
      this.afficherVerdict(reponse.questionId, recu);
    } catch {
      this.mettreEnFile(reponse);
    }
  }

  private afficherVerdict(questionId: string, recu: VerdictReponse): void {
    if (!this.questionsDeLEcran.has(questionId)) {
      return;
    }
    const verdict: VerdictAffiche = {
      questionId,
      reussite: recu.reussite,
      etiquette: recu.libelleConfusion,
    };
    this.verdicts.update((affiches) =>
      affiches.some((affiche) => affiche.questionId === questionId)
        ? affiches.map((affiche) => (affiche.questionId === questionId ? verdict : affiche))
        : [...affiches, verdict],
    );
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
      this.afficherVerdict(envoi.questionId, recu);
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
