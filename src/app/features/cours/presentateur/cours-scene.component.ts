import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  DerouleCours,
  EcranContent,
  EcranDeroule,
  PilotageEcran,
} from '../../../../cours/content/types';
import type {
  EtatSession,
  ResultatsDuFlux,
  StatutFlux,
  Sync,
} from '../../../../cours/runtime/core/sync';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import { CREATEUR_FLUX_FORMATEUR, ouvrirLeFluxFormateur } from '../cours-flux.token';
import type { DirectEcran } from '../../../shared/slides/session/contrat-hote';
import { CoursPresentationComponent } from '../../../shared/slides/session/cours-presentation.component';
import { annexeFormateurDeLEcran } from './annexe-formateur';
import { chantierApresRendu } from './chantier-apres-rendu';
import { directDeLEcranCourant } from '../direct-de-l-ecran';
import { CoursBandeauCorrectionComponent } from './cours-bandeau-correction.component';
import { correctionsAffichees } from './corrections-affichees';
import { CoursResultatsProjetesComponent } from './cours-resultats-projetes.component';
import { sourceCorrigeePar } from './sources-de-correction';

type Chargement = 'chargement' | 'succes' | 'echec';

const SEUIL_DE_PROJECTION = 5;

function ecranProjete(ecran: EcranDeroule): EcranContent {
  return {
    id: ecran.id,
    type: ecran.type,
    titre: ecran.titre ?? null,
    duree: ecran.duree,
    interactif: ecran.interactif,
    donnees: ecran.donnees,
    ...(ecran.cadrageDuRenvoi === undefined ? {} : { cadrageDuRenvoi: ecran.cadrageDuRenvoi }),
  };
}

@Component({
  selector: 'app-cours-scene',
  standalone: true,
  imports: [
    CoursPresentationComponent,
    CoursBandeauCorrectionComponent,
    CoursResultatsProjetesComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      box-sizing: border-box;
      inline-size: 100%;
      block-size: 100dvh;
      background: var(--cream, #fffaf2);
      color: var(--ink, #0c0902);
      overflow: hidden;
    }

    .scene-shell {
      display: grid;
      block-size: 100%;
      place-items: stretch;
    }

    .scene-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      position: fixed;
      inset: 0.75rem 0.75rem auto auto;
      z-index: 10;
      margin: 0;
    }

    .scene-toolbar__brand {
      display: none;
    }

    .scene-toolbar__eyebrow {
      color: var(--teal-deep, #277c70);
      font-family: var(--font-mono, monospace);
      font-size: 0.68rem;
      letter-spacing: 0.13em;
      text-transform: uppercase;
    }

    .scene-toolbar__title {
      color: var(--ink, #0c0902);
      font-family: var(--font-display, Georgia, serif);
      font-size: clamp(1.4rem, 2.4vw, 2.2rem);
    }

    .scene-toolbar__actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .scene-counter {
      position: fixed;
      inset: auto 1rem 1rem auto;
      z-index: 10;
      color: var(--ink-mute, #766f63);
      background: rgba(251, 243, 230, 0.9);
      padding: 0.35rem 0.7rem;
      border: 1px solid rgba(12, 9, 2, 0.12);
      border-radius: 999px;
      backdrop-filter: blur(10px);
      font-family: var(--font-mono, monospace);
      font-size: 0.75rem;
    }

    .scene-fullscreen {
      display: inline-grid;
      place-items: center;
      inline-size: 2.5rem;
      block-size: 2.5rem;
      padding: 0;
      border: 1px solid rgba(12, 9, 2, 0.16);
      border-radius: 999px;
      background: var(--ivory, #fbf3e6);
      color: var(--teal-deep, #277c70);
      font: inherit;
      font-size: 0;
      cursor: pointer;
    }

    .scene-fullscreen::before {
      content: '⛶';
      font-size: 1.25rem;
      line-height: 1;
    }

    .scene-fullscreen:hover,
    .scene-fullscreen:focus-visible {
      border-color: var(--teal, #4fb3a2);
      background: rgba(79, 179, 162, 0.14);
    }

    .scene-canvas {
      inline-size: min(100%, 96rem);
      min-block-size: 100%;
      block-size: 100%;
      box-sizing: border-box;
      margin-inline: auto;
      padding: clamp(1rem, 3vw, 2.5rem);
      background: var(--cream, #fffaf2);
      overflow: hidden;
      --slide-min-height: 100%;
    }

    .scene-canvas app-cours-presentation {
      display: block;
      inline-size: 100%;
      block-size: 100%;
    }

    .scene-message {
      display: flex;
      align-items: center;
      justify-content: center;
      inline-size: 100%;
      block-size: 100%;
      margin: 0;
      padding: 2rem;
      box-sizing: border-box;
      font-size: 3rem;
      text-align: center;
    }

    .scene-flux {
      position: fixed;
      inset-block-start: 0.75rem;
      inset-inline-end: 0.75rem;
      z-index: 1;
      inline-size: 0.75rem;
      block-size: 0.75rem;
      margin: 0;
      border-radius: 50%;
      background-color: #6b7280;
      opacity: 0.6;
    }

    .scene-flux[data-etat='connecte'] {
      background-color: var(--success, #6cae3e);
    }

    .scene-flux[data-etat='reconnexion'] {
      background-color: var(--warning, #e6884f);
      opacity: 1;
    }

    .scene-flux[data-etat='refuse'] {
      background-color: var(--danger, #c0563c);
      opacity: 1;
    }
  `,
  template: `
    @switch (lectureDeroule()) {
      @case ('chargement') {
        <p
          class="scene-message"
          data-testid="scene-chargement"
          role="status"
          i18n="scene.chargement|@@sceneChargement"
        >
          Préparation de la projection…
        </p>
      }
      @case ('echec') {
        <p
          class="scene-message"
          data-testid="scene-echec"
          role="alert"
          i18n="scene.echec|@@sceneEchec"
        >
          La projection n'a pas pu être affichée.
        </p>
      }
    }
    @if (termine()) {
      <p
        class="scene-message"
        data-testid="scene-terminee"
        role="status"
        i18n="scene.terminee|@@sceneTerminee"
      >
        La séance est terminée.
      </p>
    } @else {
      <div class="scene-shell">
        <header class="scene-toolbar">
          <div class="scene-toolbar__brand">
            <span
              class="scene-toolbar__eyebrow"
              i18n="scene.projectionEnDirect|@@sceneProjectionEnDirect"
              >Projection en direct</span
            >
            <strong class="scene-toolbar__title">{{ deroule()?.titre ?? titreParDefaut }}</strong>
          </div>
          <div class="scene-toolbar__actions">
            <span class="scene-counter"
              >{{ ecran() + 1 }} / {{ deroule()?.ecrans?.length ?? 0 }}</span
            >
            <button
              type="button"
              class="scene-fullscreen"
              data-testid="scene-plein-ecran"
              (click)="basculerPleinEcran()"
              [attr.aria-pressed]="pleinEcran()"
            >
              @if (pleinEcran()) {
                <ng-container i18n="scene.quitterPleinEcran|@@sceneQuitterPleinEcran"
                  >Quitter le plein écran</ng-container
                >
              } @else {
                <ng-container i18n="scene.pleinEcran|@@scenePleinEcran">Plein écran</ng-container>
              }
            </button>
          </div>
        </header>
        <main class="scene-canvas" data-testid="scene-canvas">
          @if (ecranCourant(); as ecranAffiche) {
            <app-cours-presentation
              mode="projection"
              [slide]="ecranAffiche"
              [resultats]="resultats()"
              [direct]="direct()"
              [donneesFormateur]="annexeDeLEcran()"
              [renvoi]="ecranRenvoye()"
              [surimpression]="correction"
            />
            <ng-template #correction>
              <app-cours-bandeau-correction
                [corrections]="correctionsDeLEcran()"
                [revele]="direct()?.pilotage?.revele === true"
              />
              @if (ecranDuDeroule(); as ecranSource) {
                <app-cours-resultats-projetes
                  [ecran]="ecranSource"
                  [resultats]="resultats()"
                  [sessionId]="sessionId()"
                  [actif]="direct()?.pilotage?.resultatsProjetes === true"
                  [revele]="direct()?.pilotage?.revele === true"
                />
              }
            </ng-template>
          }
        </main>
      </div>
      @if (lectureDeroule() === 'succes') {
        <p
          class="scene-flux"
          data-testid="scene-flux"
          role="status"
          [attr.data-etat]="suiviDuFlux()?.etat ?? 'connexion'"
        >
          <span class="sr-only">
            @switch (suiviDuFlux()?.etat) {
              @case ('connecte') {
                <span i18n="scene.fluxConnecte|@@sceneFluxConnecte">Suivi en direct</span>
              }
              @case ('reconnexion') {
                <span i18n="scene.fluxReconnexion|@@sceneFluxReconnexion"
                  >Suivi interrompu, reconnexion en cours</span
                >
              }
              @case ('refuse') {
                <span i18n="scene.fluxRefuse|@@sceneFluxRefuse"
                  >Suivi refusé par le serveur (statut {{ statutDuRefus() }})</span
                >
              }
              @default {
                <span i18n="scene.fluxConnexion|@@sceneFluxConnexion">Connexion au suivi</span>
              }
            }
          </span>
        </p>
      }
    }
  `,
})
export class CoursSceneComponent {
  readonly sessionId = input.required<string>();

  readonly lectureDeroule = signal<Chargement>('chargement');
  readonly deroule = signal<DerouleCours | null>(null);
  readonly ecran = signal(0);
  readonly termine = signal(false);
  readonly suiviDuFlux = signal<StatutFlux | null>(null);
  readonly resultats = signal<ResultatsDuFlux | null>(null);
  readonly pilotage = signal<Readonly<Record<string, PilotageEcran>>>({});
  readonly pleinEcran = signal(false);

  protected readonly titreParDefaut = $localize`:scene.titreParDefaut|@@sceneTitreParDefaut:Cours en direct`;

  readonly statutDuRefus = computed(() => {
    const suivi = this.suiviDuFlux();
    return suivi?.etat === 'refuse' ? suivi.statut : null;
  });

  readonly ecranDuDeroule = computed<EcranDeroule | null>(
    () => this.deroule()?.ecrans[this.ecran()] ?? null,
  );

  readonly ecranCourant = computed<EcranContent | null>(() => {
    const ecran = this.ecranDuDeroule();
    return ecran === null ? null : ecranProjete(ecran);
  });

  readonly ecranRenvoye = computed<EcranContent | null>(() => {
    const deroule = this.deroule();
    const renvoi = deroule?.ecrans[this.ecran()]?.renvoi;
    const cible = deroule?.ecrans.find(({ id }) => id === renvoi);
    return cible === undefined || this.correctionEncoreVerrouillee(cible)
      ? null
      : ecranProjete(cible);
  });

  private correctionEncoreVerrouillee(ecran: EcranDeroule): boolean {
    const source = sourceCorrigeePar(ecran);
    return source !== null && !this.termine() && this.pilotage()[source]?.revele !== true;
  }

  readonly correctionsDeLEcran = computed(() =>
    correctionsAffichees(this.deroule()?.ecrans[this.ecran()]),
  );

  readonly annexeDeLEcran = computed(() => {
    const ecran = this.deroule()?.ecrans[this.ecran()];
    return ecran === undefined ? null : annexeFormateurDeLEcran(ecran);
  });

  readonly direct = computed<DirectEcran | null>(() =>
    directDeLEcranCourant(
      this.ecranCourant(),
      this.pilotage(),
      this.resultats(),
      SEUIL_DE_PROJECTION,
    ),
  );

  private readonly port = inject(FORMATIONS_PORT);
  private readonly creerFluxFormateur = inject(CREATEUR_FLUX_FORMATEUR);

  private flux: Sync | null = null;
  private detruit = false;
  private readonly chantier = chantierApresRendu(() => this.lireLeDeroule());

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.detruit = true;
      this.flux?.close();
    });
  }

  quandStabilise(): Promise<void> {
    return this.chantier;
  }

  protected async basculerPleinEcran(): Promise<void> {
    if (typeof document === 'undefined') {
      return;
    }
    try {
      if (document.fullscreenElement !== null) {
        await document.exitFullscreen();
      } else if (typeof document.documentElement.requestFullscreen === 'function') {
        await document.documentElement.requestFullscreen();
      }
      this.pleinEcran.set(document.fullscreenElement !== null);
    } catch {
      this.pleinEcran.set(false);
    }
  }

  private async lireLeDeroule(): Promise<void> {
    try {
      const deroule = await firstValueFrom(this.port.lireDeroule(this.sessionId()));
      if (this.detruit) {
        return;
      }
      this.deroule.set(deroule);
      this.lectureDeroule.set('succes');
      this.ecouterLeFlux();
    } catch {
      if (!this.detruit) {
        this.lectureDeroule.set('echec');
      }
    }
  }

  private ecouterLeFlux(): void {
    ouvrirLeFluxFormateur(this.creerFluxFormateur(this.sessionId()), {
      etat: (etat) => this.suivreLeFlux(etat),
      resultats: (resultats) => this.resultats.set(resultats),
      suivi: this.suiviDuFlux,
      retenir: (flux) => {
        this.flux = flux;
      },
    });
  }

  private suivreLeFlux(etat: EtatSession): void {
    this.ecran.set(etat.ecranCourant);
    this.pilotage.set(etat.pilotage);
    if (etat.etat === 'terminee') {
      this.termine.set(true);
      this.flux?.close();
    }
  }
}
