import { isPlatformBrowser, Location } from '@angular/common';
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
  ResultatQuestion,
  ResultatsSeance,
} from '../../../../cours/content/types';
import type {
  EtatSession,
  StatutFlux,
  StatutSession,
  Sync,
} from '../../../../cours/runtime/core/sync';
import type { CommandePilotage } from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import { CREATEUR_FLUX_FORMATEUR } from '../cours-flux.token';
import { CoursEcranComponent, questionsDeLEcran } from '../ecran/cours-ecran.component';
import type { QuestionDuPanneau } from './cours-panneau-question.component';
import { CoursPanneauQuestionComponent } from './cours-panneau-question.component';

type EtatSeance = 'fermee' | 'ouverte' | 'en_cours' | 'terminee';

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
  imports: [CoursEcranComponent, CoursPanneauQuestionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .code-seance {
      font-size: 7rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      line-height: 1.1;
      margin: 0;
    }

    .notes {
      white-space: pre-line;
    }

    .suivi-du-flux[data-etat='reconnexion'],
    .suivi-du-flux[data-etat='refuse'] {
      border-inline-start: 0.375rem solid var(--danger);
      padding-inline-start: 0.75rem;
      font-weight: 700;
    }
  `,
  template: `
    <h1 i18n="presentateur.titrePage|@@presentateurTitrePage">Pupitre de la séance</h1>
    @if (statut() === 'fermee' && seance() === undefined) {
      <button
        type="button"
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
    @if (sessionId() !== null) {
      <p
        class="suivi-du-flux"
        data-testid="presentateur-flux"
        role="status"
        [attr.data-etat]="etatDuFlux()"
        [attr.data-statut]="refusDuFlux()?.statut ?? null"
      >
        @switch (etatDuFlux()) {
          @case ('connecte') {
            <span i18n="presentateur.fluxConnecte|@@presentateurFluxConnecte"
              >Suivi de la séance en direct.</span
            >
          }
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
                    reconnectez-vous, puis rechargez le pupitre, qui reprendra la séance.</span
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
      <section>
        <h2 i18n="presentateur.codeTitre|@@presentateurCodeTitre">Code à dicter à la classe</h2>
        <p class="code-seance" data-testid="presentateur-code">{{ code() }}</p>
        <p data-testid="presentateur-participants">
          <span i18n="presentateur.participants|@@presentateurParticipants">Participants</span>
          <span data-testid="presentateur-participants-nombre">{{ participants() }}</span>
        </p>
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
    @if (deroule(); as cours) {
      <h2 data-testid="presentateur-titre">{{ cours.titre }}</h2>
      @if (statut() === 'ouverte' || statut() === 'en_cours') {
        @if (statut() === 'ouverte') {
          <button
            type="button"
            data-testid="presentateur-demarrer"
            [disabled]="pilotageBloque()"
            (click)="demarrer()"
            i18n="presentateur.demarrer|@@presentateurDemarrer"
          >
            Démarrer la séance
          </button>
        }
        <nav aria-label="Pilotage des écrans" i18n-aria-label="@@presentateurPilotage">
          <button
            type="button"
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
            data-testid="presentateur-suivant"
            [disabled]="pilotageBloque() || ecran() >= dernierEcran()"
            (click)="suivant()"
            i18n="presentateur.suivant|@@presentateurSuivant"
          >
            Écran suivant
          </button>
          <button
            type="button"
            data-testid="presentateur-rythme"
            [disabled]="pilotageBloque()"
            (click)="basculerLeRythme()"
          >
            @if (mode() === 'pilote') {
              <span i18n="presentateur.rythmeLibre|@@presentateurRythmeLibre"
                >Passer en rythme libre</span
              >
            } @else {
              <span i18n="presentateur.rythmePilote|@@presentateurRythmePilote"
                >Reprendre la main</span
              >
            }
          </button>
          <span data-testid="presentateur-rythme-mode" [attr.data-mode]="mode()">
            @if (mode() === 'pilote') {
              <span i18n="presentateur.modePilote|@@presentateurModePilote">Rythme piloté</span>
            } @else {
              <span i18n="presentateur.modeLibre|@@presentateurModeLibre">Rythme libre</span>
            }
          </span>
          <button
            type="button"
            data-testid="presentateur-scene"
            (click)="ouvrirLaScene()"
            i18n="presentateur.scene|@@presentateurScene"
          >
            Ouvrir la scène
          </button>
        </nav>
        @if (ecranCourant(); as ecranAffiche) {
          <app-cours-ecran [ecran]="ecranAffiche" rendu="stage" [role]="'presentateur'" />
          @if (ecranAffiche.notes !== '') {
            <section data-testid="presentateur-notes">
              <h3 i18n="presentateur.notes|@@presentateurNotes">Notes du formateur</h3>
              <p class="notes">{{ ecranAffiche.notes }}</p>
            </section>
          }
          <ul data-testid="presentateur-questions">
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
        }
      }
    }
    @if (statut() === 'ouverte' || statut() === 'en_cours') {
      <button
        #boutonDeCloture
        type="button"
        data-testid="presentateur-cloturer"
        (click)="demanderLaCloture()"
        i18n="presentateur.cloturer|@@presentateurCloturer"
      >
        Clôturer la séance
      </button>
    }
    @if (clotureDemandee() && statut() !== 'terminee') {
      <div
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
          data-testid="presentateur-cloture-confirmer"
          (click)="confirmerLaCloture()"
          i18n="presentateur.clotureConfirmer|@@presentateurClotureConfirmer"
        >
          Confirmer la clôture
        </button>
        <button
          #retourALaSeance
          type="button"
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
  readonly resultats = signal<ResultatsSeance | null>(null);
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
      if (seance !== undefined) {
        this.chantier = this.reprendreLaSeance(seance);
      }
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
    this.resultats.set(rapport.resultats);
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
    flux.onResultats((resultats) => this.resultats.set(resultats));
    flux.onStatut((statut) => this.suiviDuFlux.set(statut));
    this.flux = flux;
    flux.ouvrir();
  }

  private suivreLeFlux(etat: EtatSession): void {
    this.etatDeLaRepriseAttendu.set(false);
    this.avancerLeStatut(ETAT_ANNONCE[etat.etat]);
    if (etat.etat === 'terminee') {
      this.flux?.close();
    }
    if (!this.commandeEnVol()) {
      this.ecran.set(etat.ecranCourant);
      this.mode.set(etat.modeRythme);
    }
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
