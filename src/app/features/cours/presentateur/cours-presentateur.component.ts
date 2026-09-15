import { isPlatformBrowser, Location, PercentPipe } from '@angular/common';
import type { WritableSignal } from '@angular/core';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import type {
  ConfusionComptee,
  CorrigePresentateur,
  DerouleCours,
  EcranDeroule,
  PacingMode,
  ResultatQuestion,
  ResultatsSeance,
} from '../../../../cours/content/types';
import type { EtatSession, StatutSession, Sync } from '../../../../cours/runtime/core/sync';
import type { CommandePilotage } from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import { CREATEUR_FLUX_FORMATEUR } from '../cours-flux.token';
import { CoursEcranComponent } from '../ecran/cours-ecran.component';

type EtatSeance = 'fermee' | 'ouverte' | 'en_cours' | 'terminee';

type Chargement = 'repos' | 'chargement' | 'succes' | 'echec';

interface PanneauQuestion {
  readonly questionId: string;
  readonly bonneReponse: string;
  readonly total: number;
  readonly part: number;
  readonly neSaitPas: number;
  readonly sousLeSeuil: boolean;
  readonly confusions: readonly ConfusionComptee[];
  readonly remediation: number | null;
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

const SANS_REPONSE: Omit<ResultatQuestion, 'questionId'> = {
  total: 0,
  correctes: 0,
  neSaitPas: 0,
  confusions: [],
};

function confusionDominante(confusions: readonly ConfusionComptee[]): ConfusionComptee | null {
  return confusions.reduce<ConfusionComptee | null>(
    (dominante, confusion) => (confusion.nombre > (dominante?.nombre ?? 0) ? confusion : dominante),
    null,
  );
}

function ecranDeRemediation(
  deroule: DerouleCours,
  confusion: ConfusionComptee | null,
): number | null {
  if (confusion === null || !Object.hasOwn(deroule.remediations, confusion.id)) {
    return null;
  }
  const cible = deroule.remediations[confusion.id];
  const index = deroule.ecrans.findIndex((ecran) => ecran.id === cible);
  return index === -1 ? null : index;
}

function lirePanneau(
  deroule: DerouleCours,
  seuil: number | null,
  corrige: CorrigePresentateur,
  resultats: readonly ResultatQuestion[],
): PanneauQuestion {
  const resultat =
    resultats.find((question) => question.questionId === corrige.questionId) ?? SANS_REPONSE;
  const part = resultat.total > 0 ? resultat.correctes / resultat.total : 0;
  const sousLeSeuil = seuil !== null && resultat.total > 0 && part < seuil;
  return {
    questionId: corrige.questionId,
    bonneReponse: corrige.bonneReponse,
    total: resultat.total,
    part,
    neSaitPas: resultat.neSaitPas,
    sousLeSeuil,
    confusions: corrige.confusions.map((confusion) => ({
      ...confusion,
      nombre: resultat.confusions.find((comptee) => comptee.id === confusion.id)?.nombre ?? 0,
    })),
    remediation: sousLeSeuil
      ? ecranDeRemediation(deroule, confusionDominante(resultat.confusions))
      : null,
  };
}

@Component({
  selector: 'app-cours-presentateur',
  standalone: true,
  imports: [CoursEcranComponent, PercentPipe],
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

    [data-etat='sous-le-seuil'] {
      border-inline-start: 0.375rem solid currentColor;
      padding-inline-start: 0.75rem;
    }
  `,
  template: `
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
            [disabled]="commandeEnVol()"
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
            [disabled]="commandeEnVol() || ecran() <= 0"
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
            [disabled]="commandeEnVol() || ecran() >= dernierEcran()"
            (click)="suivant()"
            i18n="presentateur.suivant|@@presentateurSuivant"
          >
            Écran suivant
          </button>
          <button
            type="button"
            data-testid="presentateur-rythme"
            [disabled]="commandeEnVol()"
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
            @for (panneau of panneaux(); track panneau.questionId) {
              <li
                data-testid="presentateur-question"
                [attr.data-question]="panneau.questionId"
                [attr.data-etat]="panneau.sousLeSeuil ? 'sous-le-seuil' : null"
              >
                <dl>
                  <dt i18n="presentateur.reponses|@@presentateurReponses">Réponses reçues</dt>
                  <dd data-testid="presentateur-question-total">
                    {{ panneau.total }} / {{ participants() }}
                  </dd>
                  <dt i18n="presentateur.part|@@presentateurPart">Bonnes réponses</dt>
                  <dd data-testid="presentateur-question-part">{{ panneau.part | percent }}</dd>
                  <dt i18n="presentateur.neSaitPas|@@presentateurNeSaitPas">Je ne sais pas</dt>
                  <dd data-testid="presentateur-question-ne-sait-pas">{{ panneau.neSaitPas }}</dd>
                  @if (ecranAffiche.seuil !== null) {
                    <dt i18n="presentateur.seuil|@@presentateurSeuil">Seuil</dt>
                    <dd data-testid="presentateur-question-seuil">
                      {{ ecranAffiche.seuil | percent }}
                    </dd>
                  }
                  <dt i18n="presentateur.bonneReponse|@@presentateurBonneReponse">Bonne réponse</dt>
                  <dd data-testid="presentateur-question-bonne-reponse">
                    {{ panneau.bonneReponse }}
                  </dd>
                </dl>
                @if (panneau.sousLeSeuil) {
                  <p
                    data-testid="presentateur-question-alerte"
                    i18n="presentateur.sousLeSeuil|@@presentateurSousLeSeuil"
                  >
                    Sous le seuil : la classe n'a pas encore compris.
                  </p>
                }
                <ul>
                  @for (confusion of panneau.confusions; track confusion.id) {
                    <li data-testid="presentateur-confusion" [attr.data-confusion]="confusion.id">
                      <span>{{ confusion.libelle }}</span>
                      <span data-testid="presentateur-confusion-nombre">{{
                        confusion.nombre
                      }}</span>
                    </li>
                  }
                </ul>
                @if (panneau.remediation !== null) {
                  <button
                    type="button"
                    data-testid="presentateur-remediation"
                    [disabled]="commandeEnVol()"
                    (click)="allerA(panneau.remediation)"
                    i18n="presentateur.remediation|@@presentateurRemediation"
                  >
                    Aller à la remédiation
                  </button>
                }
              </li>
            }
          </ul>
        }
      }
    }
    @if (statut() === 'ouverte' || statut() === 'en_cours') {
      <button
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

  readonly participants = computed(() => this.resultats()?.participants ?? 0);

  readonly dernierEcran = computed(() => (this.deroule()?.ecrans.length ?? 0) - 1);

  readonly ecranCourant = computed<EcranDeroule | null>(
    () => this.deroule()?.ecrans[this.ecran()] ?? null,
  );

  readonly panneaux = computed<readonly PanneauQuestion[]>(() => {
    const deroule = this.deroule();
    const ecran = this.ecranCourant();
    if (deroule === null || ecran === null) {
      return [];
    }
    const resultats = this.resultats()?.questions ?? [];
    return ecran.corriges.map((corrige) => lirePanneau(deroule, ecran.seuil, corrige, resultats));
  });

  private readonly port = inject(FORMATIONS_PORT);
  private readonly creerFluxFormateur = inject(CREATEUR_FLUX_FORMATEUR);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));

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
  }

  protected annulerLaCloture(): void {
    this.clotureDemandee.set(false);
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
    this.flux = flux;
    flux.ouvrir();
  }

  private suivreLeFlux(etat: EtatSession): void {
    this.avancerLeStatut(ETAT_ANNONCE[etat.etat]);
    if (etat.etat === 'terminee') {
      this.flux?.close();
    }
    if (!this.commandeEnVol()) {
      this.ecran.set(etat.ecranCourant);
      this.mode.set(etat.modeRythme);
    }
  }

  private armee(): boolean {
    return this.sessionId() !== null && !this.commandeEnVol() && this.statut() !== 'terminee';
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
