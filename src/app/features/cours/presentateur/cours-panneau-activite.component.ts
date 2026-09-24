import { PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type {
  EcranDeroule,
  PilotageEcran,
  ProgressionEnigme,
  ResultatQuestion,
  ResultatsSeance,
  VotePhase,
} from '../../../../cours/content/types';
import type { ResultatsDuFlux } from '../../../../cours/runtime/core/sync';
import { identifiantsDuMontage, planDeMontage } from '../../../shared/slides/session/lecture-ecran';
import { objet } from '../../../shared/slides/visual/presentation-v2';

export type CommandeDEcran = { readonly screenId: string } & PilotageEcran;

export type ResultatsDuPupitre = ResultatsSeance &
  Partial<Pick<ResultatsDuFlux, 'jalons' | 'enigmes' | 'bareme'>>;

const PHASES: readonly VotePhase[] = ['vote', 'discussion', 'revote', 'revele'];
const PRODUCTIONS: ReadonlySet<string> = new Set(['fp-sheet', 'fp-table-build', 'fp-cardsort']);
const REVELATIONS_DEDIEES: ReadonlySet<string> = new Set([
  'fp-challenge',
  'fp-sheet',
  'fp-table-build',
]);
const REVELATIONS_SANS_QUESTION: ReadonlySet<string> = new Set(['fp-cardsort', 'fp-escape']);

const LIBELLES_DE_PHASE: Readonly<Record<VotePhase, string>> = {
  vote: $localize`:@@panneauActivitePhaseVote:Vote individuel`,
  discussion: $localize`:@@panneauActivitePhaseDiscussion:Discussion entre voisins`,
  revote: $localize`:@@panneauActivitePhaseRevote:Vote sur le cas jumeau`,
  revele: $localize`:@@panneauActivitePhaseRevele:Révélation`,
};

interface LigneDeCle {
  readonly cle: string;
  readonly justes: number;
  readonly total: number;
}

@Component({
  selector: 'app-cours-panneau-activite',
  standalone: true,
  imports: [PercentPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: grid;
      gap: 1rem;
    }

    .activite-section {
      display: grid;
      gap: 0.5rem;
      padding: var(--s-3, 20px);
      border: 1px solid var(--line, #e4d8c4);
      border-radius: 12px;
      background: var(--ivory, #fbf3e6);
    }

    .activite-section h3 {
      margin: 0;
      font-size: 0.95rem;
    }

    .activite-section table {
      width: 100%;
      border-collapse: collapse;
      font-variant-numeric: tabular-nums;
    }

    .activite-section th,
    .activite-section td {
      padding: 0.25rem 0.4rem;
      border-bottom: 1px solid var(--line, #e4d8c4);
      text-align: start;
    }

    .activite-commandes {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }
  `,
  template: `
    @if (phaseVisible()) {
      <section class="activite-section" data-testid="activite-phase">
        <h3 i18n="@@panneauActivitePhaseTitre">Instruction par les pairs</h3>
        <p>
          <span i18n="@@panneauActivitePhaseCourante">Phase en cours :</span>
          <strong data-testid="activite-phase-courante">{{ libellePhase() }}</strong>
        </p>
        @if (phaseSuivante(); as suivante) {
          <button
            type="button"
            class="control-btn"
            data-testid="activite-phase-suivante"
            [disabled]="pilotageBloque()"
            (click)="passerA(suivante)"
          >
            <span i18n="@@panneauActivitePasserA">Passer à :</span> {{ libelleDe(suivante) }}
          </button>
        }
      </section>
    }
    @if (ecran().type === 'fp-challenge') {
      <section class="activite-section" data-testid="activite-revelation">
        <h3 i18n="@@panneauActiviteRevelationTitre">Pistes du défi</h3>
        <button
          type="button"
          class="control-btn"
          data-testid="activite-reveler"
          [disabled]="pilotageBloque() || pilotage().revele === true"
          (click)="reveler()"
          i18n="@@panneauActiviteReveler"
        >
          Révéler les pistes fausses
        </button>
      </section>
    }
    @if (correctionRevelable()) {
      <section class="activite-section" data-testid="activite-correction">
        <h3 i18n="@@panneauActiviteCorrectionTitre">Correction à l’écran</h3>
        <p i18n="@@panneauActiviteCorrectionAide">
          La correction s’affiche sur l’écran projeté au clic, pas avant.
        </p>
        <button
          type="button"
          class="control-btn"
          data-testid="activite-reveler-correction"
          [disabled]="pilotageBloque() || pilotage().revele === true"
          (click)="reveler()"
        >
          @if (pilotage().revele === true) {
            <ng-container i18n="@@panneauActiviteCorrectionRevelee"
              >Correction révélée</ng-container
            >
          } @else {
            <ng-container i18n="@@panneauActiviteRevelerCorrection"
              >Révéler la correction</ng-container
            >
          }
        </button>
      </section>
    }
    @if (ecran().type === 'fp-recall') {
      <section class="activite-section" data-testid="activite-options-rappel">
        <h3 i18n="@@panneauActiviteOptionsRappelTitre">Options du rappel</h3>
        <button
          type="button"
          class="control-btn"
          data-testid="activite-afficher-options"
          [disabled]="pilotageBloque() || pilotage().optionsAffichees === true"
          (click)="afficherLesOptions()"
          i18n="@@panneauActiviteAfficherOptions"
        >
          Afficher les options maintenant
        </button>
      </section>
    }
    @if (ecran().type === 'fp-sheet') {
      <section class="activite-section" data-testid="activite-correction-feuille">
        <h3 i18n="@@panneauActiviteCorrectionFeuilleTitre">Correction de la feuille</h3>
        <div class="activite-commandes">
          <button
            type="button"
            class="control-btn"
            data-testid="activite-feuille-formules"
            [disabled]="pilotageBloque() || etayage() >= 1"
            (click)="ouvrirLaCorrection()"
            i18n="@@panneauActiviteFeuilleFormules"
          >
            Afficher les formules
          </button>
          <button
            type="button"
            class="control-btn"
            data-testid="activite-feuille-reponses"
            [disabled]="pilotageBloque() || etayage() !== 1"
            (click)="etayer(2)"
            i18n="@@panneauActiviteFeuilleReponses"
          >
            Afficher les réponses
          </button>
        </div>
      </section>
    }
    @if (ecran().type === 'fp-table-build') {
      <section class="activite-section" data-testid="activite-correction-tableau">
        <h3 i18n="@@panneauActiviteCorrectionTableauTitre">Correction du tableau</h3>
        <div class="activite-commandes">
          <button
            type="button"
            class="control-btn"
            data-testid="activite-tableau-coefficients"
            [disabled]="pilotageBloque() || etayage() >= 1"
            (click)="ouvrirLaCorrection()"
            i18n="@@panneauActiviteTableauCoefficients"
          >
            Afficher les coefficients
          </button>
          <button
            type="button"
            class="control-btn"
            data-testid="activite-tableau-valeurs"
            [disabled]="pilotageBloque() || etayage() !== 1"
            (click)="etayer(2)"
            i18n="@@panneauActiviteTableauValeurs"
          >
            Afficher les prix et les indices
          </button>
        </div>
      </section>
    }
    @if (etapes() > 0) {
      <section class="activite-section" data-testid="activite-etayage">
        <h3 i18n="@@panneauActiviteCorrectionExerciceTitre">Correction de l’exercice</h3>
        <p data-testid="activite-etayage-niveau">{{ etayage() }} / {{ etapes() }}</p>
        <div class="activite-commandes">
          <button
            type="button"
            class="control-btn"
            data-testid="activite-etayage-moins"
            [disabled]="pilotageBloque() || etayage() <= 0"
            (click)="etayer(etayage() - 1)"
            i18n="@@panneauActiviteCorrectionMasquer"
          >
            Masquer la dernière correction
          </button>
          <button
            type="button"
            class="control-btn"
            data-testid="activite-etayage-plus"
            [disabled]="pilotageBloque() || etayage() >= etapes()"
            (click)="etayer(etayage() + 1)"
            i18n="@@panneauActiviteCorrectionEtapeSuivante"
          >
            Corriger une étape de plus
          </button>
        </div>
      </section>
    }
    @if (production(); as resultat) {
      <section class="activite-section" data-testid="activite-production">
        <h3 i18n="@@panneauActiviteProductionTitre">Productions reçues</h3>
        <p>
          <span data-testid="activite-production-total">{{ resultat.total }}</span>
          <span i18n="@@panneauActiviteProductionRecues"> production(s) reçue(s)</span>
          @if (resultat.scoreMoyen !== null) {
            ·
            <span i18n="@@panneauActiviteScoreMoyen">score moyen</span>
            <strong data-testid="activite-production-score">{{
              resultat.scoreMoyen | percent
            }}</strong>
          }
        </p>
        @if (lignesDeCle().length > 0) {
          <table data-testid="activite-production-cles">
            <thead>
              <tr>
                <th scope="col" i18n="@@panneauActiviteCle">Élément</th>
                <th scope="col" i18n="@@panneauActiviteJustes">Justes</th>
              </tr>
            </thead>
            <tbody>
              @for (ligne of lignesDeCle(); track ligne.cle) {
                <tr data-testid="activite-production-cle" [attr.data-cle]="ligne.cle">
                  <th scope="row">{{ ligne.cle }}</th>
                  <td>{{ ligne.justes }} / {{ ligne.total }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    }
    @if (ecran().type === 'fp-escape') {
      <section class="activite-section" data-testid="activite-enigmes">
        <h3 i18n="@@panneauActiviteEnigmesTitre">Progression dans le coffre</h3>
        <table>
          <thead>
            <tr>
              <th scope="col" i18n="@@panneauActiviteEnigme">Énigme</th>
              <th scope="col" i18n="@@panneauActiviteOuvertes">Commencée</th>
              <th scope="col" i18n="@@panneauActiviteResolues">Résolue</th>
              <th scope="col" i18n="@@panneauActiviteEpuisees">Épuisée</th>
              <th scope="col" i18n="@@panneauActiviteTentatives">Tentatives moyennes</th>
            </tr>
          </thead>
          <tbody>
            @for (enigme of enigmes(); track enigme.enigmeId) {
              <tr data-testid="activite-enigme" [attr.data-enigme]="enigme.enigmeId">
                <th scope="row">{{ enigme.enigmeId }}</th>
                <td>{{ enigme.ouvertes }}</td>
                <td>{{ enigme.resolues }}</td>
                <td>{{ enigme.epuisees }}</td>
                <td>{{ enigme.tentativesMoyennes }}</td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    }
    @if (ecran().type === 'fp-exit') {
      <section class="activite-section" data-testid="activite-billets">
        <h3 i18n="@@panneauActiviteBilletsTitre">Billets de sortie</h3>
        <p data-testid="activite-billets-recus" i18n="@@panneauActiviteBilletsRecus">
          {{ billetsRecus() }} billets reçus / {{ participants() }} participants
        </p>
      </section>
    }
  `,
})
export class CoursPanneauActiviteComponent {
  readonly ecran = input.required<EcranDeroule>();
  readonly resultats = input<ResultatsDuPupitre | null>(null);
  readonly pilotage = input<PilotageEcran>({});
  readonly participants = input(0);
  readonly sessionId = input<string | null>(null);
  readonly pilotageBloque = input(false);
  readonly corrigeAilleurs = input(false);
  readonly commande = output<CommandeDEcran>();

  private readonly identifiants = computed<readonly string[]>(() =>
    (planDeMontage(this.ecran()) ?? []).flatMap(identifiantsDuMontage),
  );

  protected readonly phaseVisible = computed(
    () =>
      this.ecran().type === 'fp-vote' && objet(this.ecran().donnees?.['questionJumelle']) !== null,
  );

  protected readonly correctionRevelable = computed(() => {
    const ecran = this.ecran();
    return (
      !REVELATIONS_DEDIEES.has(ecran.type) &&
      !this.phaseVisible() &&
      !this.etapesPilotees() &&
      ecran.corriges.length === 0 &&
      (ecran.questions.length > 0 ||
        REVELATIONS_SANS_QUESTION.has(ecran.type) ||
        ecran.corrigeEcran !== null ||
        this.corrigeAilleurs())
    );
  });

  private readonly etapesPilotees = computed(
    () => this.ecran().type === 'fp-worked' && this.ecran().donnees?.['pilote'] === true,
  );

  protected readonly phaseCourante = computed<VotePhase>(() => this.pilotage().phase ?? 'vote');

  protected readonly libellePhase = computed(() => LIBELLES_DE_PHASE[this.phaseCourante()]);

  protected readonly phaseSuivante = computed<VotePhase | null>(
    () => PHASES[PHASES.indexOf(this.phaseCourante()) + 1] ?? null,
  );

  protected readonly etapes = computed(() => {
    const etapes = objet(this.ecran().donnees?.['exemple'])?.['etapes'];
    return this.etapesPilotees() && Array.isArray(etapes) ? etapes.length : 0;
  });

  protected readonly etayage = computed(() => this.pilotage().etayage ?? 0);

  protected readonly production = computed<ResultatQuestion | null>(() => {
    if (!PRODUCTIONS.has(this.ecran().type)) {
      return null;
    }
    const [identifiant] = this.identifiants();
    return this.resultatDe(identifiant ?? '');
  });

  protected readonly lignesDeCle = computed<readonly LigneDeCle[]>(() =>
    Object.entries(this.production()?.parCle ?? {}).map(([cle, compte]) => ({
      cle,
      justes: compte.justes,
      total: compte.total,
    })),
  );

  protected readonly enigmes = computed<readonly ProgressionEnigme[]>(() => {
    const [parcoursId] = this.identifiants();
    return (this.resultats()?.enigmes ?? []).filter((enigme) => enigme.parcoursId === parcoursId);
  });

  protected readonly billetsRecus = computed(() => {
    const [billetId] = this.identifiants();
    return this.resultatDe(billetId ?? '')?.total ?? 0;
  });

  protected libelleDe(phase: VotePhase): string {
    return LIBELLES_DE_PHASE[phase];
  }

  protected passerA(phase: VotePhase): void {
    this.commande.emit({ screenId: this.ecran().id, phase });
  }

  protected reveler(): void {
    this.commande.emit({ screenId: this.ecran().id, revele: true });
  }

  protected ouvrirLaCorrection(): void {
    this.commande.emit({ screenId: this.ecran().id, revele: true, etayage: 1 });
  }

  protected afficherLesOptions(): void {
    this.commande.emit({ screenId: this.ecran().id, optionsAffichees: true });
  }

  protected etayer(etayage: number): void {
    this.commande.emit({ screenId: this.ecran().id, etayage });
  }

  private resultatDe(questionId: string): ResultatQuestion | null {
    return (
      this.resultats()?.questions.find((question) => question.questionId === questionId) ?? null
    );
  }
}
