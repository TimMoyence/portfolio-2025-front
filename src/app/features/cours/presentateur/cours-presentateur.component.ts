import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import type { Observable } from 'rxjs';
import type { FreeRange, PacingMode } from '../../../../cours/content/types';
import type { VoteQuestionPublique } from '../../../../cours/runtime/blocks/FpVote';
import type { Identity } from '../../../../cours/runtime/core/identity';
import type { Sync } from '../../../../cours/runtime/core/sync';
import { createSync } from '../../../../cours/runtime/core/sync';
import { getApiBaseUrl } from '../../../core/http/api-config';
import type { CommandePilotage, OuvertureSeance } from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';

type EtatSeance = 'fermee' | 'ouverte' | 'en_cours' | 'terminee';

const INTERVALLE_LIBRE: FreeRange = { premier: 1, dernier: 3 };

const PUPITRE: Identity = {
  studentKey: 'pupitre-presentateur',
  prenom: 'Pupitre',
  nom: 'Presentateur',
  email: '',
};

@Component({
  selector: 'app-cours-presentateur',
  standalone: true,
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .code-seance {
      font-size: 7rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      line-height: 1.1;
      margin: 0;
    }
  `,
  template: `
    @if (statut() === 'fermee') {
      <button
        type="button"
        data-testid="presentateur-ouvrir"
        (click)="ouvrir()"
        i18n="presentateur.ouvrir|@@presentateurOuvrir"
      >
        Ouvrir la séance
      </button>
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
    @if (statut() === 'ouverte') {
      <button
        type="button"
        data-testid="presentateur-demarrer"
        (click)="demarrer()"
        i18n="presentateur.demarrer|@@presentateurDemarrer"
      >
        Démarrer la séance
      </button>
    }
    @if (statut() === 'ouverte' || statut() === 'en_cours') {
      <nav>
        <button
          type="button"
          data-testid="presentateur-precedent"
          [disabled]="commandeEnVol()"
          (click)="precedent()"
          i18n="presentateur.precedent|@@presentateurPrecedent"
        >
          Écran précédent
        </button>
        <output data-testid="presentateur-ecran">{{ ecran() }}</output>
        <button
          type="button"
          data-testid="presentateur-suivant"
          [disabled]="commandeEnVol()"
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
        <span data-testid="presentateur-rythme-mode">{{ mode() }}</span>
      </nav>
      @if (briquesPretes() && question() !== null) {
        <fp-vote
          role="presentateur"
          render="stage"
          data-testid="presentateur-brique"
          [question]="question()"
        ></fp-vote>
      }
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
      <div data-testid="presentateur-cloture-confirmation" role="alertdialog">
        <p i18n="presentateur.clotureQuestion|@@presentateurClotureQuestion">
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
  readonly ouverture = input.required<OuvertureSeance>();
  readonly question = input<VoteQuestionPublique | null>(null);

  readonly statut = signal<EtatSeance>('fermee');
  readonly code = signal<string | null>(null);
  readonly sessionId = signal<string | null>(null);
  readonly ecran = signal(0);
  readonly mode = signal<PacingMode>('pilote');
  readonly participants = signal(0);
  readonly commandeEnVol = signal(false);
  readonly clotureDemandee = signal(false);
  readonly clotureEnVol = signal(false);
  readonly briquesPretes = signal(false);
  readonly echec = signal(false);

  private readonly port = inject(FORMATIONS_PORT);
  private readonly baseFlux = `${getApiBaseUrl()}/formations`;

  private flux: Sync | null = null;

  private acheve: () => void = () => undefined;
  private chantier = new Promise<void>((resoudre) => {
    this.acheve = resoudre;
  });

  private annonceLeFlux: () => void = () => undefined;
  private readonly paroleDuFlux = new Promise<void>((resoudre) => {
    this.annonceLeFlux = resoudre;
  });

  constructor() {
    afterNextRender(() => {
      void this.enregistrerLesBriques().then(this.acheve);
    });
    inject(DestroyRef).onDestroy(() => {
      this.flux?.close();
    });
  }

  quandStabilise(): Promise<void> {
    return this.chantier;
  }

  quandLeFluxAParle(): Promise<void> {
    return this.paroleDuFlux;
  }

  protected ouvrir(): void {
    if (this.sessionId() !== null) {
      return;
    }
    this.suivre(
      this.port.ouvrirSeance(this.ouverture()),
      (seance) => {
        this.sessionId.set(seance.sessionId);
        this.code.set(seance.code);
        this.statut.set('ouverte');
        this.ecouterLeFlux(seance.sessionId);
      },
      () => undefined,
    );
  }

  protected demarrer(): void {
    const session = this.sessionId();
    if (session === null || this.statut() !== 'ouverte') {
      return;
    }
    this.suivre(
      this.port.demarrer(session),
      () => undefined,
      (abouti) => {
        if (abouti) {
          this.statut.set('en_cours');
        }
      },
    );
  }

  protected suivant(): void {
    this.allerA(this.ecran() + 1);
  }

  protected precedent(): void {
    this.allerA(Math.max(0, this.ecran() - 1));
  }

  allerA(cible: number): void {
    if (!this.armee()) {
      return;
    }
    this.ecran.set(cible);
    this.commander({ ecran: cible });
  }

  protected basculerLeRythme(): void {
    if (!this.armee()) {
      return;
    }
    const vise: PacingMode = this.mode() === 'pilote' ? 'libre' : 'pilote';
    this.mode.set(vise);
    this.commander(
      vise === 'libre' ? { mode: vise, intervalle: INTERVALLE_LIBRE } : { mode: vise },
    );
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
    this.suivre(
      this.port.cloturer(session),
      () => undefined,
      (abouti) => {
        if (!abouti) {
          this.clotureEnVol.set(false);
          return;
        }
        this.statut.set('terminee');
        this.clotureDemandee.set(false);
        this.flux?.close();
      },
    );
  }

  private armee(): boolean {
    return this.sessionId() !== null && !this.commandeEnVol();
  }

  private commander(commande: CommandePilotage): void {
    const session = this.sessionId();
    if (session === null) {
      return;
    }
    this.commandeEnVol.set(true);
    this.suivre(
      this.port.piloter(session, commande),
      () => undefined,
      () => {
        this.commandeEnVol.set(false);
      },
    );
  }

  private suivre<T>(
    source: Observable<T>,
    recevoir: (valeur: T) => void,
    conclure: (abouti: boolean) => void,
  ): void {
    this.chantier = new Promise<void>((resoudre) => {
      source.subscribe({
        next: recevoir,
        error: () => {
          this.echec.set(true);
          conclure(false);
          resoudre();
        },
        complete: () => {
          conclure(true);
          resoudre();
        },
      });
    });
  }

  private ecouterLeFlux(sessionId: string): void {
    this.flux = createSync({ baseUrl: this.baseFlux, sessionId });
    this.flux.onState((etat) => {
      this.participants.set(etat.participants);
      this.annonceLeFlux();
    });
    this.flux.join(PUPITRE);
  }

  private async enregistrerLesBriques(): Promise<void> {
    try {
      const { registerCoursBlocks } = await import('../../../../cours/runtime/core/register');
      await registerCoursBlocks();
      this.briquesPretes.set(true);
    } catch {
      this.echec.set(true);
    }
  }
}
