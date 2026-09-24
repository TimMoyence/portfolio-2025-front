import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import type { EcranContent, ResultatsSeance, Role } from '../../../../cours/content/types';
import type { Brouillons } from '../../../../cours/runtime/core/storage';
import type { SyntheseConcept } from '../../../core/ports/formations.port';
import type { DirectEcran, EvenementBrique, RetourBrique } from './contrat-hote';
import { extraireDuRenvoi } from './extrait-du-renvoi';
import { SlideActivityComponent } from './slide-activity.component';
import { SlideComponent } from '../deck/slide.component';

export type CoursPresentationMode = 'etudiant' | 'formateur' | 'projection';

const LARGEUR_DE_TOILE = 1280;
const HAUTEUR_DE_TOILE = 720;
const LARGEUR_COMPACTE = 700;
const ECHELLE_LISIBLE = 0.8;
const ECHELLE_DU_RENVOI_AVANT_MESURE = 0.46;
const MARGES_DE_LA_TOILE_DU_RENVOI = 48;

interface Mesure {
  readonly largeur: number;
  readonly hauteur: number;
}

@Component({
  selector: 'app-cours-presentation',
  standalone: true,
  imports: [NgTemplateOutlet, SlideActivityComponent, SlideComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (slide(); as current) {
      @for (screen of [current]; track screen.id) {
        <div class="cours-cadre" #cadre data-testid="cours-cadre">
          <div
            class="cours-toile"
            data-testid="cours-toile"
            [class.cours-toile--renvoi]="renvoi() !== null"
            [style.--part-du-renvoi]="partDuRenvoi()"
            [style.transform]="transformation()"
            [style.block-size.px]="hauteurDeToile()"
          >
            <div class="cours-toile__principal" #principal>
              <div
                class="cours-toile__contenu"
                #contenu
                data-testid="cours-contenu"
                [style.transform]="ajustement()"
              >
                <app-slide [id]="screen.id">
                  <app-slide-activity
                    [slide]="screen"
                    [role]="role()"
                    [resultats]="resultats()"
                    [sessionId]="sessionId()"
                    [jeton]="jeton()"
                    [retours]="retours()"
                    [direct]="direct()"
                    [donneesFormateur]="$any(donneesFormateur())"
                    [maitrise]="maitrise()"
                    [brouillons]="brouillons()"
                    (evenement)="evenement.emit($event)"
                  />
                </app-slide>
              </div>
            </div>
            @if (renvoiAffiche(); as reference) {
              <aside class="cours-renvoi" data-testid="cours-renvoi">
                <p class="cours-renvoi__legende" i18n="@@coursRenvoiLegende">
                  Diapositive commentée
                </p>
                <div class="cours-renvoi__cadre" #renvoiCadre>
                  <div class="cours-renvoi__toile" [style.transform]="transformationDuRenvoi()">
                    <app-slide-activity
                      #renvoiContenu
                      [slide]="reference"
                      [role]="role()"
                      [apercu]="true"
                    />
                  </div>
                </div>
              </aside>
            }
            @if (surimpression(); as calque) {
              <ng-container *ngTemplateOutlet="calque" />
            }
          </div>
        </div>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      inline-size: 100%;
      min-inline-size: 0;
      block-size: 100%;
    }

    app-slide {
      display: block;
      inline-size: 100%;
      min-inline-size: 0;
      --slide-min-height: 0;
    }

    .cours-cadre {
      position: relative;
      inline-size: 100%;
      block-size: 100%;
      min-block-size: 0;
      overflow: hidden;
    }

    .cours-toile {
      position: absolute;
      inset-block-start: 0;
      inset-inline-start: 0;
      inline-size: ${LARGEUR_DE_TOILE}px;
      block-size: ${HAUTEUR_DE_TOILE}px;
      display: flex;
      overflow: hidden;
      transform-origin: 0 0;
      color: var(--ink, #0c0902);
      background: var(--cream, #fffaf2);
    }

    .cours-toile__principal {
      flex: 1 1 0;
      min-inline-size: 0;
      block-size: 100%;
      box-sizing: border-box;
      padding: 1.5rem 2rem;
      container-type: size;
      overflow: hidden;
    }

    .cours-toile__contenu {
      --slide-marge-bloc: 0;
      --slide-marge-ligne: 0;
      --fp-densite-imposee: 0.75;
      display: flex;
      flex-direction: column;
      justify-content: safe center;
      min-block-size: 100%;
      transform-origin: 50% 0;
    }

    .cours-toile--renvoi .cours-toile__contenu {
      --fp-densite-imposee: 0.6;
      --fp-echelle-imposee: 1;
      --fp-titre-impose: 1.3rem;
      --fp-marge-carte-imposee: 1rem;
    }

    .cours-toile--renvoi .cours-toile__principal {
      padding-inline-end: 1rem;
    }

    .cours-renvoi {
      display: flex;
      flex: 0 0 var(--part-du-renvoi, 50%);
      min-inline-size: 0;
      flex-direction: column;
      justify-content: center;
      gap: 0.5rem;
      box-sizing: border-box;
      padding: 1rem 1.5rem 1rem 1rem;
      border-inline-start: 1px solid rgba(12, 9, 2, 0.12);
    }

    .cours-renvoi__legende {
      margin: 0;
      color: var(--text-muted, #6d665b);
      font-size: 0.85rem;
      font-weight: 600;
    }

    .cours-renvoi__cadre {
      position: relative;
      box-sizing: border-box;
      flex: 1 1 0;
      min-block-size: 0;
      inline-size: 100%;
      overflow: hidden;
      border: 1px solid rgba(12, 9, 2, 0.16);
      border-radius: 0.5rem;
      background: var(--cream, #fffaf2);
    }

    .cours-renvoi__toile {
      position: absolute;
      inset-block-start: 0;
      inset-inline-start: 0;
      inline-size: ${LARGEUR_DE_TOILE}px;
      block-size: ${HAUTEUR_DE_TOILE}px;
      box-sizing: border-box;
      padding: 1.5rem 2rem;
      container-type: size;
      overflow: hidden;
      transform: scale(${ECHELLE_DU_RENVOI_AVANT_MESURE});
      transform-origin: 0 0;
      pointer-events: none;
    }

    .cours-renvoi__toile app-slide-activity {
      display: block;
    }

    :host(.cours-presentation--formateur) {
      block-size: auto;
    }

    :host(.cours-presentation--formateur) .cours-cadre {
      block-size: auto;
      aspect-ratio: 16 / 9;
    }

    :host(.cours-presentation--compacte) .cours-cadre {
      block-size: auto;
      overflow: visible;
    }

    :host(.cours-presentation--compacte) .cours-toile {
      position: static;
      inline-size: 100%;
      block-size: auto;
      flex-direction: column;
      overflow: visible;
    }

    :host(.cours-presentation--compacte) .cours-toile__principal {
      block-size: auto;
      padding: 1rem;
      container-type: inline-size;
    }

    :host(.cours-presentation--defilante) .cours-cadre,
    :host(.cours-presentation--defilante) .cours-toile,
    :host(.cours-presentation--defilante) .cours-toile__principal {
      overflow: visible;
    }

    :host(.cours-presentation--compacte) .cours-renvoi {
      flex-basis: auto;
      border-inline-start: 0;
      border-block-start: 1px solid rgba(12, 9, 2, 0.12);
    }

    :host(.cours-presentation--compacte) .cours-renvoi__cadre {
      flex: none;
      aspect-ratio: 16 / 9;
    }
  `,
  host: {
    '[class.cours-presentation--projection]': "mode() === 'projection'",
    '[class.cours-presentation--formateur]': "mode() === 'formateur'",
    '[class.cours-presentation--compacte]': 'compacte()',
    '[class.cours-presentation--defilante]': 'defilante()',
  },
})
export class CoursPresentationComponent {
  readonly mode = input<CoursPresentationMode>('etudiant');
  readonly slide = input<EcranContent | null>(null);
  readonly resultats = input<ResultatsSeance | null>(null);
  readonly sessionId = input<string | null>(null);
  readonly jeton = input('');
  readonly retours = input<ReadonlyMap<string, readonly RetourBrique[]>>(new Map());
  readonly direct = input<DirectEcran | null>(null);
  readonly donneesFormateur = input<unknown>(null);
  readonly maitrise = input<readonly SyntheseConcept[] | null>(null);
  readonly brouillons = input<Brouillons | null>(null);
  readonly renvoi = input<EcranContent | null>(null);
  readonly surimpression = input<TemplateRef<unknown> | null>(null);
  readonly evenement = output<EvenementBrique>();

  private readonly cadreObserve = viewChild<ElementRef<HTMLElement>>('cadre');
  private readonly principalObserve = viewChild<ElementRef<HTMLElement>>('principal');
  private readonly contenuObserve = viewChild<ElementRef<HTMLElement>>('contenu');
  private readonly renvoiObserve = viewChild<ElementRef<HTMLElement>>('renvoiCadre');
  private readonly contenuDuRenvoiObserve = viewChild('renvoiContenu', { read: ElementRef });
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly cadre = signal<Mesure | null>(null);
  private readonly place = signal<number | null>(null);
  private readonly hauteurDuContenu = signal<number | null>(null);
  private readonly cadreDuRenvoi = signal<Mesure | null>(null);
  private readonly hauteurDuRenvoi = signal<number | null>(null);

  protected readonly renvoiAffiche = computed(() => {
    const renvoi = this.renvoi();
    return renvoi === null ? null : extraireDuRenvoi(renvoi, this.slide()?.cadrageDuRenvoi);
  });

  protected readonly partDuRenvoi = computed(() => {
    const part = this.slide()?.cadrageDuRenvoi?.part;
    return part === undefined ? null : `${part}%`;
  });

  protected readonly transformationDuRenvoi = computed(() => {
    const cadre = this.cadreDuRenvoi();
    if (cadre === null || cadre.largeur === 0) {
      return null;
    }
    const hauteur = Math.min(
      HAUTEUR_DE_TOILE,
      (this.hauteurDuRenvoi() ?? HAUTEUR_DE_TOILE) + MARGES_DE_LA_TOILE_DU_RENVOI,
    );
    const echelle = Math.min(cadre.largeur / LARGEUR_DE_TOILE, cadre.hauteur / hauteur);
    const decalageX = (cadre.largeur - LARGEUR_DE_TOILE * echelle) / 2;
    const decalageY = (cadre.hauteur - hauteur * echelle) / 2;
    return `translate(${decalageX}px, ${decalageY}px) scale(${echelle})`;
  });

  protected readonly role = computed<Role>(() =>
    this.mode() === 'etudiant' ? 'etudiant' : 'presentateur',
  );

  protected readonly compacte = computed(() => {
    const cadre = this.cadre();
    return this.mode() === 'etudiant' && cadre !== null && cadre.largeur < LARGEUR_COMPACTE;
  });

  private readonly echelleDeToile = computed(() => {
    const cadre = this.cadre();
    if (cadre === null || this.compacte()) {
      return null;
    }
    return Math.min(cadre.largeur / LARGEUR_DE_TOILE, cadre.hauteur / HAUTEUR_DE_TOILE);
  });

  protected readonly hauteurDeToile = computed(() => {
    const cadre = this.cadre();
    const echelle = this.echelleDeToile();
    if (this.mode() !== 'etudiant' || cadre === null || echelle === null || echelle === 0) {
      return null;
    }
    return Math.max(HAUTEUR_DE_TOILE, cadre.hauteur / echelle);
  });

  protected readonly transformation = computed(() => {
    const cadre = this.cadre();
    const echelle = this.echelleDeToile();
    if (cadre === null || echelle === null) {
      return null;
    }
    const hauteur = this.hauteurDeToile() ?? HAUTEUR_DE_TOILE;
    const decalageX = (cadre.largeur - LARGEUR_DE_TOILE * echelle) / 2;
    const decalageY = this.defilante() ? 0 : (cadre.hauteur - hauteur * echelle) / 2;
    return `translate(${decalageX}px, ${decalageY}px) scale(${echelle})`;
  });

  private readonly reduction = computed(() => {
    const place = this.place();
    const contenu = this.hauteurDuContenu();
    if (this.compacte() || place === null || contenu === null || contenu <= place + 1) {
      return null;
    }
    return place / contenu;
  });

  private readonly reductionLisible = computed(() => {
    const echelle = this.echelleDeToile();
    return echelle === null ? ECHELLE_LISIBLE : ECHELLE_LISIBLE / Math.max(1, echelle);
  });

  protected readonly defilante = computed(() => {
    const reduction = this.reduction();
    return this.mode() === 'etudiant' && reduction !== null && reduction < this.reductionLisible();
  });

  protected readonly ajustement = computed(() => {
    const reduction = this.reduction();
    if (reduction === null) {
      return null;
    }
    return `scale(${this.defilante() ? this.reductionLisible() : reduction})`;
  });

  constructor() {
    this.observer(this.cadreObserve, (element) =>
      this.cadre.set({ largeur: element.clientWidth, hauteur: element.clientHeight }),
    );
    this.observer(this.principalObserve, (element) => {
      const style = getComputedStyle(element);
      const marges =
        Number.parseFloat(style.paddingBlockStart) + Number.parseFloat(style.paddingBlockEnd);
      this.place.set(element.clientHeight - marges);
    });
    this.observer(this.contenuObserve, (element) =>
      this.hauteurDuContenu.set(element.offsetHeight),
    );
    this.observer(this.renvoiObserve, (element) =>
      this.cadreDuRenvoi.set({ largeur: element.clientWidth, hauteur: element.clientHeight }),
    );
    this.observer(this.contenuDuRenvoiObserve, (element) =>
      this.hauteurDuRenvoi.set(element.offsetHeight),
    );
  }

  private observer(
    cible: () => ElementRef<HTMLElement> | undefined,
    mesurer: (element: HTMLElement) => void,
  ): void {
    effect((onCleanup) => {
      const element = cible()?.nativeElement;
      if (element === undefined || !this.navigateur || typeof ResizeObserver === 'undefined') {
        return;
      }
      const observateur = new ResizeObserver(() => mesurer(element));
      observateur.observe(element);
      onCleanup(() => observateur.disconnect());
    });
  }
}
