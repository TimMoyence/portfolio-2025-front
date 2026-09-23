import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  InjectionToken,
  input,
  output,
  Renderer2,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import type { CorrigeEcranPresentateur } from '../../../../cours/content/types';
import type {
  EcranContent,
  RenderMode,
  ResultatsSeance,
  Role,
} from '../../../../cours/content/types';
import { texte } from '../../../../cours/runtime/core/i18n';
import type { Brouillons } from '../../../../cours/runtime/core/storage';
import type { SyntheseConcept } from '../../../core/ports/formations.port';
import { aUnePresentation } from '../visual/presentation-v2';
import { SlideVisualComponent } from '../visual/slide-visual.component';
import type { DirectEcran, EvenementBrique, RetourBrique } from './contrat-hote';
import { evenementsDe } from './evenements-brique';
import {
  ECRAN_VERROUILLE,
  enteteDeQuestionnaire,
  identifiantsDuMontage,
  type Montage,
  planDeMontage,
  PROPRIETES_PAR_BRIQUE,
} from './lecture-ecran';
import { memeValeur, type MontageIdentifie, posesDeReinjection } from './reinjection';

type DonneesFormateur = CorrigeEcranPresentateur | null;

interface MontageActif extends MontageIdentifie {
  readonly element: HTMLElement;
}

interface ReponseVisuelle {
  readonly questionId: string;
  readonly valeur: string;
  readonly dureeMs: number;
}

@Component({
  selector: 'app-slide-activity',
  standalone: true,
  imports: [SlideVisualComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (entete(); as questionnaire) {
      <header class="slide-activity__entete" data-testid="slide-activity-entete">
        <h2 class="slide-activity__intitule">{{ questionnaire.intitule }}</h2>
        <p class="slide-activity__consigne">{{ questionnaire.consigne }}</p>
      </header>
    }
    @if (verrouille()) {
      <div class="slide-activity__verrouille" data-testid="slide-activity-verrouille">
        @if (slide().titre; as titre) {
          <p class="slide-activity__titre">{{ titre }}</p>
        }
        <p class="slide-activity__mention">
          <span>{{ slide().duree }} {{ libelleMinutes }}</span> ·
          <span>{{ libelleVerrouille }}</span>
        </p>
      </div>
    }
    <div
      #host
      class="slide-activity__blocks"
      [hidden]="visual() || verrouille()"
      data-testid="slide-activity-host"
      (fp-numeric-submit)="relayer($event)"
      (fp-vote-submit)="relayer($event)"
      (fp-recall-submit)="relayer($event)"
      (fp-exit-submit)="relayer($event)"
      (fp-spaced-reponse)="relayer($event)"
      (fp-sheet-submit)="relayer($event)"
      (fp-table-build-submit)="relayer($event)"
      (fp-cardsort-submit)="relayer($event)"
      (fp-escape-tentative)="relayer($event)"
      (fp-pulse-change)="relayer($event)"
      (fp-challenge-submit)="relayer($event)"
      (fp-worked-submit)="relayer($event)"
      (fp-pro-submit)="relayer($event)"
      (fp-brouillon)="memoriser($event)"
      (fp-block-error)="showError()"
    ></div>
    @if (visual()) {
      <app-slide-visual
        [slide]="slide()"
        [sessionId]="apercu() ? null : sessionId()"
        [jeton]="jeton()"
        [role]="role()"
        [resultats]="resultats()"
        [prioritaire]="prioritaire()"
        [retours]="retours()"
        (reponse)="relayerVisuel($event)"
      />
    }
    @if (unknown()) {
      <p
        class="slide-activity__message"
        role="alert"
        data-testid="slide-activity-unknown"
        i18n="cours.ecranInconnu|@@coursEcranInconnu"
      >
        Cet écran ne peut pas être affiché : son contenu n’est pas reconnu.
      </p>
    }
    @if (error()) {
      <p
        class="slide-activity__message"
        role="alert"
        data-testid="slide-activity-error"
        i18n="cours.ecranEchec|@@coursEcranEchec"
      >
        Les activités de cet écran n’ont pas pu être chargées.
      </p>
    }
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      min-width: 0;
    }

    .slide-activity__blocks {
      display: grid;
      gap: 1rem;
      width: min(100%, 72rem);
      margin-inline: auto;
    }

    .slide-activity__entete,
    .slide-activity__verrouille {
      display: grid;
      gap: 0.4rem;
      max-width: 72ch;
      margin: 0 auto 1rem;
    }

    .slide-activity__intitule,
    .slide-activity__titre {
      margin: 0;
      font-family: var(--font-display, Georgia, serif);
      font-size: 1.5rem;
      color: var(--ink, #0c0902);
    }

    .slide-activity__consigne,
    .slide-activity__mention {
      margin: 0;
      color: var(--text-muted, #6d665b);
    }

    .slide-activity__message {
      max-width: 60ch;
      margin: 2rem auto;
      color: var(--text-muted, #6d665b);
      text-align: center;
    }

    @container (min-height: 0px) {
      :host(.slide-activity--questionnaire) {
        display: flex;
        flex-direction: column;
        block-size: 100cqh;
        padding: 1.25rem 1.75rem;
        box-sizing: border-box;
      }

      :host(.slide-activity--questionnaire) .slide-activity__entete {
        max-width: none;
        margin: 0 0 0.75rem;
      }

      :host(.slide-activity--questionnaire) .slide-activity__blocks {
        --fp-echelle-scene: 0.7;
        flex: 1 1 0;
        min-height: 0;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-auto-rows: minmax(0, 1fr);
        gap: 0.75rem;
        width: 100%;
      }
    }
  `,
  host: {
    '[class.slide-activity--questionnaire]': 'entete() !== null',
  },
})
export class SlideActivityComponent {
  readonly slide = input.required<EcranContent>();
  readonly render = input<RenderMode>('hand');
  readonly role = input<Role>('etudiant');
  readonly resultats = input<ResultatsSeance | null>(null);
  readonly sessionId = input<string | null>(null);
  readonly jeton = input<string>('');
  readonly retours = input<ReadonlyMap<string, readonly RetourBrique[]>>(new Map());
  readonly direct = input<DirectEcran | null>(null);
  readonly donneesFormateur = input<DonneesFormateur>(null);
  readonly maitrise = input<readonly SyntheseConcept[] | null>(null);
  readonly brouillons = input<Brouillons | null>(null);
  readonly apercu = input(false);
  readonly prioritaire = input(false);
  readonly evenement = output<EvenementBrique>();

  protected readonly visual = computed(() => aUnePresentation(this.slide()));
  protected readonly verrouille = computed(() => this.slide().type === ECRAN_VERROUILLE);
  protected readonly entete = computed(() => enteteDeQuestionnaire(this.slide()));
  protected readonly libelleVerrouille = texte('ecran-verrouille');
  protected readonly libelleMinutes = texte('duree-minutes');

  protected readonly unknown = signal(false);
  protected readonly error = signal(false);

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private readonly renderer = inject(Renderer2);
  private readonly registerBlocks = inject(REGISTER_SLIDE_BLOCKS);
  private readonly registered = this.registerAfterRender();
  private readonly posees = new WeakMap<HTMLElement, Map<string, unknown>>();
  private montes: readonly MontageActif[] = [];
  private cleDeMontage: string | null = null;
  private dernierEmetteur: EventTarget | null = null;
  private destroyed = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
    });
    effect(() => this.scheduleMount(this.slide(), this.render(), this.role(), this.apercu()));
    effect(() => {
      this.retours();
      this.direct();
      this.donneesFormateur();
      this.maitrise();
      untracked(() => this.reinjecter());
    });
  }

  protected relayer(event: Event): void {
    if (!(event instanceof CustomEvent)) {
      return;
    }
    this.dernierEmetteur = event.target;
    if (this.apercu()) {
      return;
    }
    for (const evenement of evenementsDe(event.type, event.detail, this.slide().id)) {
      this.evenement.emit(evenement);
    }
  }

  protected relayerVisuel(reponse: ReponseVisuelle): void {
    if (this.apercu()) {
      return;
    }
    this.evenement.emit({
      kind: 'reponse',
      screenId: this.slide().id,
      questionId: reponse.questionId,
      valeur: reponse.valeur,
      dureeMs: reponse.dureeMs,
    });
  }

  protected memoriser(event: Event): void {
    const brouillons = this.brouillons();
    const cible = event.target;
    if (
      brouillons === null ||
      this.apercu() ||
      !(event instanceof CustomEvent) ||
      !(cible instanceof HTMLElement)
    ) {
      return;
    }
    const detail: unknown = event.detail;
    if (typeof detail === 'object' && detail !== null && 'id' in detail && 'valeur' in detail) {
      const { id, valeur } = detail;
      if (typeof id === 'string' && id !== '') {
        brouillons.ecrire(cible.localName, id, valeur);
      }
    }
  }

  protected showError(): void {
    this.error.set(true);
    this.unknown.set(false);
    this.clearHost();
  }

  private registerAfterRender(): Promise<boolean> {
    return new Promise<void>((resolve) => afterNextRender(resolve)).then(this.registerBlocks).then(
      () => true,
      () => false,
    );
  }

  private scheduleMount(
    slide: EcranContent,
    render: RenderMode,
    role: Role,
    apercu: boolean,
  ): void {
    if (aUnePresentation(slide) || slide.type === ECRAN_VERROUILLE) {
      this.clearHost();
      this.unknown.set(false);
      this.error.set(false);
      return;
    }
    void this.registered.then((registered) => {
      if (this.destroyed) {
        return;
      }
      if (!registered) {
        this.error.set(true);
        return;
      }
      this.mount(slide, render, role, apercu);
    });
  }

  private mount(slide: EcranContent, render: RenderMode, role: Role, apercu: boolean): void {
    const plan = planDeMontage(slide);
    if (plan === null) {
      this.clearHost();
      this.unknown.set(true);
      this.error.set(false);
      return;
    }
    const cle = `${slide.id}|${render}|${role}|${String(apercu)}|${plan.map((montage) => montage.brique).join(',')}`;
    try {
      if (cle === this.cleDeMontage && this.montes.length === plan.length) {
        this.montes = this.montes.map((actif, rang) => this.mettreAJour(actif, plan[rang]));
      } else {
        this.clearHost();
        this.montes = plan.map((montage) => this.creer(montage, render, role, apercu));
        this.cleDeMontage = cle;
      }
      this.unknown.set(false);
      this.error.set(false);
      this.reinjecter();
    } catch {
      this.showError();
    }
  }

  private creer(montage: Montage, render: RenderMode, role: Role, apercu: boolean): MontageActif {
    const element: HTMLElement = this.renderer.createElement(montage.brique);
    this.renderer.setAttribute(element, 'render', render);
    this.renderer.setAttribute(element, 'data-cours-role', role);
    if (apercu) {
      this.renderer.setAttribute(element, 'data-apercu', '');
    }
    this.poserLesDonnees(element, montage.brique, montage.donnees);
    const actif: MontageActif = {
      brique: montage.brique,
      donnees: montage.donnees,
      identifiants: identifiantsDuMontage(montage),
      element,
    };
    this.reprendreLeBrouillon(actif, role, apercu);
    this.renderer.appendChild(this.host().nativeElement, element);
    return actif;
  }

  private mettreAJour(actif: MontageActif, montage: Montage): MontageActif {
    this.poserLesDonnees(actif.element, montage.brique, montage.donnees);
    return { ...actif, donnees: montage.donnees, identifiants: identifiantsDuMontage(montage) };
  }

  private poserLesDonnees(element: HTMLElement, brique: string, donnees: Montage['donnees']): void {
    for (const propriete of PROPRIETES_PAR_BRIQUE[brique] ?? []) {
      if (Object.hasOwn(donnees, propriete)) {
        this.poser(element, propriete, donnees[propriete]);
      }
    }
  }

  private reprendreLeBrouillon(actif: MontageActif, role: Role, apercu: boolean): void {
    const brouillons = this.brouillons();
    const identifiant = actif.identifiants.at(0);
    if (brouillons === null || apercu || role !== 'etudiant' || identifiant === undefined) {
      return;
    }
    const brouillon = brouillons.lire(actif.brique, identifiant);
    if (brouillon !== null && brouillon !== undefined) {
      this.poser(actif.element, 'brouillon', brouillon);
    }
  }

  private reinjecter(): void {
    if (this.montes.length === 0) {
      return;
    }
    const retours = this.retours().get(this.slide().id) ?? [];
    try {
      for (const actif of this.montes) {
        const poses = posesDeReinjection(actif, {
          retours,
          direct: this.direct(),
          render: this.render(),
          role: this.role(),
          donneesFormateur: this.donneesFormateur(),
          maitrise: this.maitrise(),
          dernierEmetteur: actif.element === this.dernierEmetteur,
        });
        for (const [propriete, valeur] of poses) {
          this.poser(actif.element, propriete, valeur);
        }
      }
    } catch {
      this.showError();
    }
  }

  private poser(element: HTMLElement, propriete: string, valeur: unknown): void {
    const connues = this.posees.get(element) ?? new Map<string, unknown>();
    if (connues.has(propriete) && memeValeur(connues.get(propriete), valeur)) {
      return;
    }
    connues.set(propriete, valeur);
    this.posees.set(element, connues);
    this.renderer.setProperty(element, propriete, valeur);
  }

  private clearHost(): void {
    const host = this.host().nativeElement;
    for (const child of Array.from(host.childNodes)) {
      this.renderer.removeChild(host, child);
    }
    this.montes = [];
    this.cleDeMontage = null;
  }
}

const REGISTER_SLIDE_BLOCKS = new InjectionToken<() => Promise<void>>('REGISTER_SLIDE_BLOCKS', {
  providedIn: 'root',
  factory: () => async () => {
    const { registerCoursBlocks } = await import('../../../../cours/runtime/core/register');
    await registerCoursBlocks();
  },
});
