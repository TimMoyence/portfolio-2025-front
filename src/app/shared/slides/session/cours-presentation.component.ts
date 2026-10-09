import { DOCUMENT, isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  PLATFORM_ID,
  signal,
  type TemplateRef,
  untracked,
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
const PART_DU_RENVOI_POURCENT = 60;
const PART_DU_RENVOI_REDUIT_POURCENT = 40;
const LARGEUR_COMPACTE = 700;
const ECHELLE_LISIBLE = 0.8;
const ECHELLE_DU_RENVOI_AVANT_MESURE = 0.46;
const MARGES_DE_LA_TOILE_DU_RENVOI = 48;
const MARGES_EN_LIGNE_DE_LA_TOILE_DU_RENVOI = 64;
const LARGEUR_MINIMALE_DU_RENVOI = 720;
const PAS_D_ELARGISSEMENT_DU_RENVOI = 1.15;
const ELARGISSEMENT_MAXIMAL = 2;
const GAIN_D_ELARGISSEMENT_UTILE = 0.05;
const ESSAIS_D_ELARGISSEMENT = 6;
const REMPLISSAGE_MINIMAL = 0.6;
const PRECISION_D_ELARGISSEMENT = 0.001;
const FICHIER_DE_PIECE_JOINTE =
  /^\/assets\/cours\/[a-z0-9-]+\/[A-Za-z0-9_-]+\.[0-9a-f]{8}\.(xlsx|csv|pdf)$/;

interface Mesure {
  readonly largeur: number;
  readonly hauteur: number;
}

interface MesureDuRenvoi extends Mesure {
  readonly deborde: boolean;
}

function elementsDe(racine: ParentNode): readonly Element[] {
  return [...racine.children].flatMap((element) => [
    element,
    ...elementsDe(element),
    ...(element.shadowRoot === null ? [] : elementsDe(element.shadowRoot)),
  ]);
}

function aUnDefileurRogne(contenu: HTMLElement): boolean {
  return elementsDe(contenu).some((element) => {
    if (element.scrollWidth <= element.clientWidth + 1) {
      return false;
    }
    const { overflowX } = getComputedStyle(element);
    return (overflowX === 'auto' || overflowX === 'scroll') && element.checkVisibility();
  });
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
            [class.cours-toile--renvoi]="renvoiAffiche() !== null"
            [style.transform]="transformation()"
            [style.block-size.px]="hauteurDeToile()"
          >
            <div class="cours-toile__scene">
              <div class="cours-toile__principal" #principal>
                <div
                  class="cours-toile__contenu"
                  #contenu
                  data-testid="cours-contenu"
                  [style.transform]="ajustement()"
                  [style.inline-size.%]="etalement()?.largeur"
                  [style.margin-inline-start.%]="etalement()?.retrait"
                >
                  <app-slide #diapositive [id]="screen.id">
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
                    @if (pieceJointe(); as piece) {
                      @if (mode() === 'projection') {
                        <p class="cours-piece-jointe" data-testid="cours-piece-jointe">
                          <span i18n="@@coursPieceJointeSurLePoste">Sur votre poste :</span>
                          {{ piece.libelle }}
                        </p>
                      } @else {
                        <a
                          class="cours-piece-jointe cours-piece-jointe--lien"
                          data-testid="cours-piece-jointe"
                          [href]="piece.fichier"
                          download
                        >
                          <span i18n="@@coursPieceJointeTelecharger">Télécharger</span>
                          {{ piece.libelle }}
                        </a>
                      }
                    }
                  </app-slide>
                </div>
              </div>
              @if (renvoiAffiche(); as reference) {
                <aside
                  class="cours-renvoi"
                  data-testid="cours-renvoi"
                  [style.transform]="suiviDuRenvoi()"
                >
                  <p class="cours-renvoi__legende" i18n="@@coursRenvoiLegende">
                    Diapositive commentée
                  </p>
                  <div class="cours-renvoi__cadre" #renvoiCadre>
                    <div
                      class="cours-renvoi__toile"
                      [style.transform]="transformationDuRenvoi()"
                      [style.inline-size.px]="toileDuRenvoi()?.largeur"
                      [style.block-size.px]="toileDuRenvoi()?.hauteur"
                    >
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
            </div>
            @if (surimpression(); as calque) {
              <div class="cours-toile__calque">
                <ng-container *ngTemplateOutlet="calque" />
              </div>
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
      flex-direction: column;
      overflow: hidden;
      transform-origin: 0 0;
      color: var(--ink, #0c0902);
      background: var(--cream, #fffaf2);
    }

    .cours-toile__scene {
      display: flex;
      flex: 1 1 0;
      min-block-size: 0;
      inline-size: 100%;
    }

    .cours-toile__calque {
      flex: none;
      inline-size: 100%;
    }

    .cours-toile__principal {
      flex: 1 1 0;
      min-inline-size: 0;
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

    .cours-piece-jointe {
      display: inline-block;
      margin: 1rem 0 0;
      padding: 0.6rem 1.1rem;
      border: 1px solid rgba(12, 9, 2, 0.16);
      border-radius: 0.5rem;
      color: var(--ink, #0c0902);
      background: var(--paper, #ffffff);
      font-size: 1rem;
      line-height: 1.3;
      text-align: center;
    }

    .cours-piece-jointe--lien {
      text-decoration: none;
      cursor: pointer;
    }

    .cours-piece-jointe--lien:hover,
    .cours-piece-jointe--lien:focus-visible {
      border-color: var(--ink, #0c0902);
    }

    .cours-piece-jointe span {
      font-weight: 600;
    }

    .cours-piece-jointe--lien span {
      text-decoration: underline;
    }

    .cours-toile--renvoi .cours-toile__contenu {
      --fp-densite-imposee: 0.6;
      --fp-echelle-imposee: 1;
      --fp-titre-impose: 1.3rem;
      --fp-marge-carte-imposee: 1rem;
      --fp-cardsort-zone-min: 130px;
      --slide-stats-colonne-min: 160px;
      --slide-stats-gouttiere: 1.5rem;
    }

    .cours-toile--renvoi .cours-toile__principal {
      padding-inline-end: 1rem;
    }

    .cours-renvoi {
      display: flex;
      flex: 0 0 ${PART_DU_RENVOI_POURCENT}%;
      min-inline-size: 0;
      flex-direction: column;
      justify-content: center;
      gap: 0.5rem;
      box-sizing: border-box;
      padding: 1rem 1.5rem 1rem 1rem;
      border-inline-start: 1px solid rgba(12, 9, 2, 0.12);
    }

    :host(.cours-presentation--renvoi-reduit) .cours-renvoi {
      flex-basis: ${PART_DU_RENVOI_REDUIT_POURCENT}%;
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
      overflow: visible;
    }

    :host(.cours-presentation--compacte) .cours-toile__scene {
      flex: none;
      flex-direction: column;
    }

    :host(.cours-presentation--compacte) .cours-toile__principal {
      flex: none;
      block-size: auto;
      overflow: visible;
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
    '[class.cours-presentation--renvoi-reduit]': 'renvoiReduit()',
    '[class.cours-presentation--renvoi-masque]': 'renvoiMasque()',
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
  private readonly diapositiveObservee = viewChild('diapositive', { read: ElementRef });
  private readonly renvoiObserve = viewChild<ElementRef<HTMLElement>>('renvoiCadre');
  private readonly contenuDuRenvoiObserve = viewChild('renvoiContenu', { read: ElementRef });
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);
  private readonly injecteur = inject(Injector);
  private readonly cadre = signal<Mesure | null>(null);
  private readonly place = signal<number | null>(null);
  private readonly hauteurDuContenu = signal<number | null>(null);
  private readonly cadreDuRenvoi = signal<Mesure | null>(null);
  private readonly mesureDuRenvoi = signal<MesureDuRenvoi | null>(null);
  private readonly elargissementDuRenvoi = signal(1);
  private readonly defilementDuCadre = signal(0);
  protected readonly renvoiReduit = signal(false);
  protected readonly renvoiMasque = signal(false);
  private readonly elargissement = signal(1);
  private readonly elargissementMesure = signal(1);
  private readonly hauteurNaturelle = signal<number | null>(null);
  private readonly contenuRogne = signal({ rogne: false });
  private essaisRestants = ESSAIS_D_ELARGISSEMENT;
  private readonly echellesEssayees = new Map<number, number>();
  private readonly ecranAffiche = computed(() => this.slide()?.id ?? null);

  protected readonly pieceJointe = computed(() => {
    const pieceJointe = this.slide()?.pieceJointe;
    return pieceJointe !== undefined && FICHIER_DE_PIECE_JOINTE.test(pieceJointe.fichier)
      ? pieceJointe
      : null;
  });

  protected readonly renvoiAffiche = computed(() => {
    const renvoi = this.renvoi();
    return renvoi === null || this.renvoiMasque()
      ? null
      : extraireDuRenvoi(renvoi, this.slide()?.cadrageDuRenvoi);
  });

  protected readonly toileDuRenvoi = computed<Mesure | null>(() => {
    const cadre = this.cadreDuRenvoi();
    if (cadre === null || cadre.largeur === 0 || cadre.hauteur === 0) {
      return null;
    }
    const echelleMinimale = cadre.largeur / LARGEUR_DE_TOILE;
    const echelleDuCadre = Math.min(
      cadre.hauteur / HAUTEUR_DE_TOILE,
      cadre.largeur / LARGEUR_MINIMALE_DU_RENVOI,
    );
    const echelle = Math.max(echelleMinimale, echelleDuCadre / this.elargissementDuRenvoi());
    return { largeur: cadre.largeur / echelle, hauteur: cadre.hauteur / echelle };
  });

  protected readonly transformationDuRenvoi = computed(() => {
    const cadre = this.cadreDuRenvoi();
    const toile = this.toileDuRenvoi();
    if (cadre === null || toile === null) {
      return null;
    }
    const echelle = cadre.largeur / toile.largeur;
    const hauteur = Math.min(
      toile.hauteur,
      (this.mesureDuRenvoi()?.hauteur ?? toile.hauteur) + MARGES_DE_LA_TOILE_DU_RENVOI,
    );
    const decalageY = (cadre.hauteur - hauteur * echelle) / 2;
    return `translate(0px, ${decalageY}px) scale(${echelle})`;
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
    const elargissement = this.elargissement();
    if (reduction === null && elargissement === 1) {
      return null;
    }
    const echelle = this.defilante()
      ? this.reductionLisible()
      : Math.min(1 / elargissement, reduction ?? 1);
    return `scale(${echelle})`;
  });

  protected readonly etalement = computed(() => {
    const elargissement = this.elargissement();
    return elargissement === 1
      ? null
      : { largeur: elargissement * 100, retrait: (1 - elargissement) * 50 };
  });

  protected readonly suiviDuRenvoi = computed(() => {
    const echelle = this.echelleDeToile();
    const defilement = this.defilementDuCadre();
    if (!this.defilante() || echelle === null || echelle === 0 || defilement === 0) {
      return null;
    }
    return `translateY(${defilement / echelle}px)`;
  });

  constructor() {
    effect(() => {
      this.ecranAffiche();
      untracked(() => {
        this.renvoiReduit.set(false);
        this.renvoiMasque.set(false);
        this.elargissement.set(1);
        this.elargissementDuRenvoi.set(1);
        this.essaisRestants = ESSAIS_D_ELARGISSEMENT;
        this.echellesEssayees.clear();
        this.hauteurDuContenu.set(null);
        this.hauteurNaturelle.set(null);
        this.defilementDuCadre.set(0);
      });
      afterNextRender(() => this.remesurerLeContenu(), { injector: this.injecteur });
    });
    effect(() => {
      const reduction = this.reduction();
      const etudiant = this.mode() === 'etudiant';
      const seuil = etudiant ? this.reductionLisible() : ECHELLE_LISIBLE;
      const illisible = reduction !== null && reduction < seuil;
      const { rogne } = this.contenuRogne();
      if (this.renvoi() === null || !(illisible || rogne)) {
        return;
      }
      if (!untracked(this.renvoiReduit)) {
        this.renvoiReduit.set(true);
      } else if (!etudiant || rogne) {
        this.renvoiMasque.set(true);
      }
    });
    effect(() => {
      const place = this.place();
      const contenu = this.hauteurNaturelle();
      const sansEtalement =
        this.mode() === 'etudiant' ||
        this.renvoiAffiche() !== null ||
        Math.abs(this.elargissementMesure() - untracked(this.elargissement)) >
          PRECISION_D_ELARGISSEMENT;
      if (sansEtalement || place === null || contenu === null || contenu === 0) {
        return;
      }
      this.etalerLeContenu(place / contenu);
    });
    effect((onCleanup) => {
      const cadre = this.cadreObserve()?.nativeElement;
      if (cadre === undefined || !this.navigateur || !this.defilante() || this.renvoi() === null) {
        return;
      }
      const suivre = (evenement: Event): void => {
        const defileur = evenement.target;
        if (defileur instanceof Element && !defileur.contains(cadre)) {
          return;
        }
        const haut = defileur instanceof Element ? defileur.getBoundingClientRect().top : 0;
        this.defilementDuCadre.set(Math.max(0, haut - cadre.getBoundingClientRect().top));
      };
      this.document.addEventListener('scroll', suivre, { capture: true, passive: true });
      onCleanup(() => {
        this.document.removeEventListener('scroll', suivre, { capture: true });
        this.defilementDuCadre.set(0);
      });
    });
    this.observer(this.cadreObserve, (element) =>
      this.cadre.set({ largeur: element.clientWidth, hauteur: element.clientHeight }),
    );
    this.observer(this.principalObserve, (element) => {
      const style = getComputedStyle(element);
      const marges =
        Number.parseFloat(style.paddingBlockStart) + Number.parseFloat(style.paddingBlockEnd);
      this.place.set(element.clientHeight - marges);
    });
    this.observer(this.contenuObserve, (element) => this.mesurerLeContenu(element));
    this.observer(this.diapositiveObservee, () => this.remesurerLeContenu());
    this.observer(this.renvoiObserve, (element) =>
      this.cadreDuRenvoi.set({ largeur: element.clientWidth, hauteur: element.clientHeight }),
    );
    this.observer(this.contenuDuRenvoiObserve, (element) =>
      this.mesureDuRenvoi.set({
        largeur: element.offsetWidth,
        hauteur: element.offsetHeight,
        deborde: element.scrollWidth > element.clientWidth + 1 || aUnDefileurRogne(element),
      }),
    );
    effect(() => {
      const toile = this.toileDuRenvoi();
      const mesure = this.mesureDuRenvoi();
      if (
        toile === null ||
        mesure === null ||
        Math.abs(mesure.largeur + MARGES_EN_LIGNE_DE_LA_TOILE_DU_RENVOI - toile.largeur) > 1 ||
        toile.largeur >= LARGEUR_DE_TOILE - 1
      ) {
        return;
      }
      const exces = (mesure.hauteur + MARGES_DE_LA_TOILE_DU_RENVOI) / toile.hauteur;
      if (exces > 1 + PRECISION_D_ELARGISSEMENT || mesure.deborde) {
        const pas = Math.max(PAS_D_ELARGISSEMENT_DU_RENVOI, Math.sqrt(exces));
        this.elargissementDuRenvoi.update((facteur) => facteur * pas);
      }
    });
  }

  private mesurerLeContenu(contenu: HTMLElement): void {
    const diapositive = contenu.firstElementChild;
    this.elargissementMesure.set(Number.parseFloat(contenu.style.inlineSize || '100') / 100);
    this.hauteurDuContenu.set(contenu.offsetHeight);
    this.contenuRogne.set({
      rogne: !untracked(this.compacte) && aUnDefileurRogne(contenu),
    });
    this.hauteurNaturelle.set(
      diapositive instanceof HTMLElement ? diapositive.offsetHeight : contenu.offsetHeight,
    );
  }

  private remesurerLeContenu(): void {
    const contenu = this.contenuObserve()?.nativeElement;
    if (contenu !== undefined) {
      this.mesurerLeContenu(contenu);
    }
  }

  private etalerLeContenu(parLaHauteur: number): void {
    const elargissement = untracked(this.elargissement);
    const remplissage = 1 / (elargissement * parLaHauteur);
    if (elargissement !== 1 && remplissage < REMPLISSAGE_MINIMAL && this.essaisRestants > 0) {
      this.echellesEssayees.clear();
      this.essayer(1);
      return;
    }
    if (elargissement === 1 && parLaHauteur >= ECHELLE_LISIBLE) {
      return;
    }
    this.echellesEssayees.set(elargissement, Math.min(1 / elargissement, parLaHauteur));
    const equilibre = Math.round(Math.sqrt(elargissement / parLaHauteur) * 100) / 100;
    const vise = Math.max(1, Math.min(ELARGISSEMENT_MAXIMAL, equilibre));
    const dejaEssaye = [...this.echellesEssayees.keys()].some(
      (essai) => Math.abs(essai - vise) <= GAIN_D_ELARGISSEMENT_UTILE,
    );
    if (!dejaEssaye && this.essaisRestants > 0) {
      this.essayer(vise);
      return;
    }
    const [meilleur] = [...this.echellesEssayees].reduce<readonly [number, number]>(
      (retenu, essai) => (essai[1] > retenu[1] ? essai : retenu),
      [elargissement, Number.NEGATIVE_INFINITY],
    );
    this.elargissement.set(meilleur);
  }

  private essayer(elargissement: number): void {
    this.essaisRestants -= 1;
    this.elargissement.set(elargissement);
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
