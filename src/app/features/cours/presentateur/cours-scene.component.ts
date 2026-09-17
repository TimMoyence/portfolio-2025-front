import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { DerouleCours, EcranContent, ResultatsSeance } from '../../../../cours/content/types';
import type { EtatSession, StatutFlux, Sync } from '../../../../cours/runtime/core/sync';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import { CREATEUR_FLUX_FORMATEUR } from '../cours-flux.token';
import { SlideActivityComponent } from '../../../shared/slides/session/slide-activity.component';
import { SlideComponent } from '../../../shared/slides/deck/slide.component';
import { SlideDeckComponent } from '../../../shared/slides/deck/slide-deck.component';

type Chargement = 'chargement' | 'succes' | 'echec';

@Component({
  selector: 'app-cours-scene',
  standalone: true,
  imports: [SlideActivityComponent, SlideComponent, SlideDeckComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      box-sizing: border-box;
      inline-size: 100%;
      block-size: 100vh;
      background: var(--cream, #fffaf2);
      color: var(--ink, #0c0902);
      overflow: auto;
    }

    .scene-shell {
      min-block-size: 100%;
      padding: clamp(16px, 3vw, 40px);
    }

    .scene-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      max-inline-size: 1500px;
      margin-inline: auto;
      margin-block-end: clamp(16px, 3vw, 32px);
    }

    .scene-toolbar__brand {
      display: grid;
      gap: 0.2rem;
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
      color: var(--ink-mute, #766f63);
      font-family: var(--font-mono, monospace);
      font-size: 0.75rem;
    }

    .scene-fullscreen {
      min-block-size: 42px;
      padding: 0.65rem 0.9rem;
      border: 1px solid rgba(12, 9, 2, 0.16);
      border-radius: 999px;
      background: var(--ivory, #fbf3e6);
      color: var(--teal-deep, #277c70);
      font: inherit;
      font-size: 0.82rem;
      cursor: pointer;
    }

    .scene-fullscreen:hover,
    .scene-fullscreen:focus-visible {
      border-color: var(--teal, #4fb3a2);
      background: rgba(79, 179, 162, 0.14);
    }

    .scene-canvas {
      max-inline-size: 1500px;
      margin-inline: auto;
    }

    app-slide-deck {
      display: block;
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

    app-slide-activity {
      display: block;
      inline-size: 100%;
      min-block-size: 100%;
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
            <span class="scene-toolbar__eyebrow">Projection en direct</span>
            <strong class="scene-toolbar__title">{{
              deroule()?.titre ?? 'Cours en direct'
            }}</strong>
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
              {{ pleinEcran() ? 'Quitter le plein écran' : 'Plein écran' }}
            </button>
          </div>
        </header>
        <main class="scene-canvas">
          @if (ecranCourant(); as ecranAffiche) {
            <app-slide-deck mode="scroll" [allowFullscreen]="false" theme="cours-session">
              <app-slide [id]="ecranAffiche.id">
                <app-slide-activity
                  [slide]="ecranAffiche"
                  render="stage"
                  [role]="'presentateur'"
                  [resultats]="resultats()"
                />
              </app-slide>
            </app-slide-deck>
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
  readonly resultats = signal<ResultatsSeance | null>(null);
  readonly pleinEcran = signal(false);

  readonly statutDuRefus = computed(() => {
    const suivi = this.suiviDuFlux();
    return suivi?.etat === 'refuse' ? suivi.statut : null;
  });

  readonly ecranCourant = computed<EcranContent | null>(() => {
    const ecran = this.deroule()?.ecrans[this.ecran()];
    if (ecran === undefined) {
      return null;
    }
    return {
      id: ecran.id,
      type: ecran.type,
      duree: ecran.duree,
      interactif: ecran.interactif,
      donnees: ecran.donnees,
    };
  });

  private readonly port = inject(FORMATIONS_PORT);
  private readonly creerFluxFormateur = inject(CREATEUR_FLUX_FORMATEUR);

  private flux: Sync | null = null;
  private detruit = false;
  private acheve: () => void = () => undefined;
  private readonly chantier = new Promise<void>((resoudre) => {
    this.acheve = resoudre;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.detruit = true;
      this.flux?.close();
    });
    afterNextRender(() => {
      void this.lireLeDeroule().then(this.acheve);
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
    const flux = this.creerFluxFormateur(this.sessionId());
    flux.onState((etat) => this.suivreLeFlux(etat));
    flux.onResultats((resultats) => this.resultats.set(resultats));
    flux.onStatut((statut) => this.suiviDuFlux.set(statut));
    this.flux = flux;
    flux.ouvrir();
  }

  private suivreLeFlux(etat: EtatSession): void {
    this.ecran.set(etat.ecranCourant);
    if (etat.etat === 'terminee') {
      this.termine.set(true);
      this.flux?.close();
    }
  }
}
