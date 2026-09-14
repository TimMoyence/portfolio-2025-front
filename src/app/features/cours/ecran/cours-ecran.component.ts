import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  effect,
  type ElementRef,
  inject,
  InjectionToken,
  input,
  output,
  Renderer2,
  signal,
  viewChild,
} from '@angular/core';
import type { EcranContent, RenderMode, Role } from '../../../../cours/content/types';

export const PROPRIETES_PAR_BRIQUE: Readonly<Record<string, readonly string[]>> = {
  'fp-quote': ['citation'],
  'fp-story': ['recit'],
  'fp-pro': ['cas'],
  'fp-worked': ['exemple'],
  'fp-concept4': ['definition'],
  'fp-plot': ['definition'],
  'fp-numeric': ['question'],
  'fp-vote': ['question'],
  'fp-recall': ['question'],
  'fp-exit': ['billet'],
};

export interface ReponseBrique {
  readonly questionId: string;
  readonly valeur: number | string;
  readonly dureeMs: number;
}

export const ENREGISTREUR_DES_BRIQUES = new InjectionToken<() => Promise<void>>(
  'ENREGISTREUR_DES_BRIQUES',
  {
    providedIn: 'root',
    factory: () => async () => {
      const { registerCoursBlocks } = await import('../../../../cours/runtime/core/register');
      await registerCoursBlocks();
    },
  },
);

type Donnees = Readonly<Record<string, unknown>>;

interface Montage {
  readonly brique: string;
  readonly donnees: Donnees;
}

const QUESTIONNAIRE = 'questionnaire';

function estObjet(valeur: unknown): valeur is Donnees {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
}

function lireMontage(brique: unknown, donnees: unknown): Montage | null {
  if (typeof brique !== 'string' || !Object.hasOwn(PROPRIETES_PAR_BRIQUE, brique)) {
    return null;
  }
  return { brique, donnees: estObjet(donnees) ? donnees : {} };
}

function lireQuestion(question: unknown): Montage | null {
  return estObjet(question) ? lireMontage(question['brique'], question['donnees']) : null;
}

function planDeMontage(ecran: EcranContent): readonly Montage[] | null {
  if (ecran.type !== QUESTIONNAIRE) {
    const seul = lireMontage(ecran.type, ecran.donnees);
    return seul === null ? null : [seul];
  }
  const questions = ecran.donnees?.['questions'];
  if (!Array.isArray(questions) || questions.length === 0) {
    return null;
  }
  const montages = questions.map(lireQuestion);
  return montages.every((montage): montage is Montage => montage !== null) ? montages : null;
}

function estValeur(valeur: unknown): valeur is number | string {
  return typeof valeur === 'string' || (typeof valeur === 'number' && Number.isFinite(valeur));
}

function lireDuree(duree: unknown): number {
  return typeof duree === 'number' && Number.isInteger(duree) && duree >= 0 ? duree : 0;
}

function lireReponse(detail: unknown): ReponseBrique | null {
  if (!estObjet(detail)) {
    return null;
  }
  const questionId = detail['questionId'] ?? detail['billetId'];
  const valeur = detail['valeur'];
  if (typeof questionId !== 'string' || questionId === '' || !estValeur(valeur)) {
    return null;
  }
  return { questionId, valeur, dureeMs: lireDuree(detail['dureeMs']) };
}

@Component({
  selector: 'app-cours-ecran',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #hote
      data-testid="cours-ecran-hote"
      (fp-numeric-submit)="relayer($event)"
      (fp-vote-submit)="relayer($event)"
      (fp-recall-submit)="relayer($event)"
      (fp-exit-submit)="relayer($event)"
    ></div>
    @if (inconnu()) {
      <p
        role="alert"
        data-testid="cours-ecran-inconnu"
        i18n="cours.ecranInconnu|@@coursEcranInconnu"
      >
        Cet écran ne peut pas être affiché : son contenu n’est pas reconnu.
      </p>
    }
    @if (echec()) {
      <p role="alert" data-testid="cours-ecran-echec" i18n="cours.ecranEchec|@@coursEcranEchec">
        Les activités de cet écran n’ont pas pu être chargées. Rechargez la page ; si le problème
        persiste, prévenez votre formateur.
      </p>
    }
  `,
})
export class CoursEcranComponent {
  readonly ecran = input.required<EcranContent>();
  readonly rendu = input<RenderMode>('hand');
  readonly role = input<Role>('etudiant');
  readonly reponse = output<ReponseBrique>();
  readonly pret = signal(false);

  protected readonly inconnu = signal(false);
  protected readonly echec = signal(false);

  private readonly hote = viewChild.required<ElementRef<HTMLElement>>('hote');
  private readonly renderer = inject(Renderer2);
  private readonly enregistrer = inject(ENREGISTREUR_DES_BRIQUES);
  private readonly enregistrement = this.enregistrerApresLeRendu();
  private montage: Promise<void> = this.enregistrement.then(() => undefined);
  private detruit = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.detruit = true;
    });
    effect(() => this.planifierLeMontage(this.ecran(), this.role()));
    effect(() => this.planifierLeRendu(this.rendu()));
  }

  quandMonte(): Promise<void> {
    return this.montage;
  }

  protected relayer(evenement: Event): void {
    const reponse = lireReponse(evenement instanceof CustomEvent ? evenement.detail : null);
    if (reponse !== null) {
      this.reponse.emit(reponse);
    }
  }

  private enregistrerApresLeRendu(): Promise<boolean> {
    return new Promise<void>((resoudre) => {
      afterNextRender(() => resoudre());
    })
      .then(this.enregistrer)
      .then(
        () => true,
        () => false,
      );
  }

  private planifier(operation: (enregistre: boolean) => void): void {
    this.montage = this.enregistrement.then((enregistre) => {
      if (!this.detruit) {
        operation(enregistre);
      }
    });
  }

  private planifierLeMontage(ecran: EcranContent, role: Role): void {
    this.pret.set(false);
    this.planifier((enregistre) => {
      if (enregistre) {
        this.monter(ecran, role);
      } else {
        this.echec.set(true);
      }
    });
  }

  private planifierLeRendu(rendu: RenderMode): void {
    this.planifier(() => {
      for (const brique of Array.from(this.hote().nativeElement.children)) {
        if (brique.getAttribute('render') !== rendu) {
          this.renderer.setAttribute(brique, 'render', rendu);
        }
      }
    });
  }

  private monter(ecran: EcranContent, role: Role): void {
    const hote = this.hote().nativeElement;
    for (const enfant of Array.from(hote.childNodes)) {
      this.renderer.removeChild(hote, enfant);
    }
    const briques = this.construire(planDeMontage(ecran), this.rendu(), role);
    this.inconnu.set(briques === null);
    for (const brique of briques ?? []) {
      this.renderer.appendChild(hote, brique);
    }
    this.pret.set(true);
  }

  private construire(
    plan: readonly Montage[] | null,
    rendu: RenderMode,
    role: Role,
  ): readonly HTMLElement[] | null {
    if (plan === null) {
      return null;
    }
    try {
      return plan.map((montage) => this.creerBrique(montage, rendu, role));
    } catch {
      return null;
    }
  }

  private creerBrique({ brique, donnees }: Montage, rendu: RenderMode, role: Role): HTMLElement {
    const element: HTMLElement = this.renderer.createElement(brique);
    this.renderer.setAttribute(element, 'render', rendu);
    this.renderer.setAttribute(element, 'role', role);
    for (const cle of PROPRIETES_PAR_BRIQUE[brique]) {
      if (Object.hasOwn(donnees, cle)) {
        this.renderer.setProperty(element, cle, donnees[cle]);
      }
    }
    return element;
  }
}
