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
import type { DerouleCours, EcranDeroule } from '../../../../cours/content/types';
import type { EtatSession, Sync } from '../../../../cours/runtime/core/sync';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import { CREATEUR_FLUX_FORMATEUR } from '../cours-flux.token';
import { CoursEcranComponent } from '../ecran/cours-ecran.component';

type Chargement = 'chargement' | 'succes' | 'echec';

@Component({
  selector: 'app-cours-scene',
  standalone: true,
  imports: [CoursEcranComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      inline-size: 100vw;
      block-size: 100vh;
      background-color: #000;
      color: #fff;
      overflow: hidden;
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

    app-cours-ecran {
      display: block;
      inline-size: 100%;
      block-size: 100%;
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
          Préparation de la scène…
        </p>
      }
      @case ('echec') {
        <p
          class="scene-message"
          data-testid="scene-echec"
          role="alert"
          i18n="scene.echec|@@sceneEchec"
        >
          La scène n'a pas pu être affichée.
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
      @if (ecranCourant(); as ecran) {
        <app-cours-ecran [ecran]="ecran" rendu="stage" [role]="'presentateur'" />
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

  readonly ecranCourant = computed<EcranDeroule | null>(
    () => this.deroule()?.ecrans[this.ecran()] ?? null,
  );

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
