import { type TracesEffets, surveillerEffets } from './effets-briques';

export interface OptionsDeBanc<T extends HTMLElement> {
  readonly balise: string;
  readonly classe: CustomElementConstructor;
  readonly poser: (hote: T) => void;
  readonly instant?: Date | string;
}

export function enregistrerBrique(balise: string, classe: CustomElementConstructor): void {
  if (!customElements.get(balise)) {
    customElements.define(balise, classe);
  }
}

function figerHorloge(instant: Date | string): void {
  jasmine.clock().install();
  jasmine.clock().mockDate(new Date(instant));
}

export function creerBrique<T extends HTMLElement>(balise: string, poser: (hote: T) => void): T {
  const hote = document.createElement(balise) as T;
  poser(hote);
  document.body.appendChild(hote);
  return hote;
}

export function installerBrique<T extends HTMLElement>(options: OptionsDeBanc<T>): TracesEffets {
  const { balise, classe, poser, instant } = options;
  let montee: T | null = null;
  let traces: TracesEffets | null = null;
  const courantes = (): TracesEffets => {
    if (traces === null) {
      throw new Error(`aucune brique ${balise} montee`);
    }
    return traces;
  };

  beforeAll(() => enregistrerBrique(balise, classe));

  beforeEach(() => {
    if (instant !== undefined) {
      figerHorloge(instant);
    }
    montee = creerBrique<T>(balise, (hote) => {
      traces = surveillerEffets(hote);
      poser(hote);
    });
  });

  afterEach(() => {
    courantes().restaurer();
    montee?.remove();
    if (instant !== undefined) {
      jasmine.clock().uninstall();
    }
  });

  return {
    get evenements(): string[] {
      return courantes().evenements;
    },
    get ecritures(): string[] {
      return courantes().ecritures;
    },
    restaurer: (): void => courantes().restaurer(),
  };
}

export function detailsEmis<T>(hote: HTMLElement, evenement: string): T[] {
  const recus: T[] = [];
  hote.addEventListener(evenement, (emis) => recus.push((emis as CustomEvent<T>).detail));
  return recus;
}

export function noeudOmbre(hote: HTMLElement, repere: string): Element | null {
  return hote.shadowRoot?.querySelector(`[data-testid="${repere}"]`) ?? null;
}

export function noeudsOmbre(hote: HTMLElement, repere: string): Element[] {
  return [...(hote.shadowRoot?.querySelectorAll(`[data-testid="${repere}"]`) ?? [])];
}

export function cliquerOmbre(hote: HTMLElement, repere: string): void {
  noeudOmbre(hote, repere)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function libelleOmbre(hote: HTMLElement, repere: string): string {
  return noeudOmbre(hote, repere)?.textContent?.trim().replace(/\s+/g, ' ') ?? '';
}

export function attendreLEnvoiVideRefuse(hote: HTMLElement): void {
  cliquerOmbre(hote, 'valider');
  expect(libelleOmbre(hote, 'retour')).toBe(
    'Saisissez au moins une valeur ou choisissez « Je ne sais pas »',
  );
}

export function attendreLeRenvoiEpuise(
  hote: HTMLElement,
  recus: readonly unknown[],
  envoisAttendus: number,
): void {
  const valider = noeudOmbre(hote, 'valider');
  if (!(valider instanceof HTMLButtonElement)) {
    throw new Error('aucun bouton valider');
  }
  expect(valider.disabled).toBeTrue();
  expect(valider.textContent?.trim()).not.toBe('Renvoyer les cases corrigées');
  cliquerOmbre(hote, 'valider');
  expect(recus.length).toBe(envoisAttendus);
}

export function attendreLaChargeInerte(hote: HTMLElement, repere: string, charge: string): void {
  expect(hote.shadowRoot?.querySelector('img')).toBeNull();
  expect(libelleOmbre(hote, repere)).toBe(charge);
}

export function attributDOption(
  hote: HTMLElement,
  option: string,
  attribut: string,
): string | null | undefined {
  return hote.shadowRoot?.querySelector(`[data-option="${option}"]`)?.getAttribute(attribut);
}

export function attendreLaSeuleOptionFausse(
  hote: HTMLElement,
  fausse: string,
  intacte: string,
): void {
  expect(attributDOption(hote, fausse, 'data-correction')).toBe('fausse');
  expect(attributDOption(hote, intacte, 'data-correction')).toBeNull();
}

export function roleAffiche(hote: HTMLElement): string | null | undefined {
  return hote.shadowRoot?.querySelector('.fp-root')?.getAttribute('data-role');
}

export function texteOmbre(hote: HTMLElement, repere: string): string {
  return noeudOmbre(hote, repere)?.textContent?.trim() ?? '';
}
