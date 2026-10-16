export function reveillerApres(dureeMs: number): void {
  const auReveil = Date.now() + dureeMs;
  spyOn(Date, 'now').and.returnValue(auReveil);
}

export const UNE_HEURE_MS = 3_600_000;

let reculDeLaPendule = 0;
let retardDeLaMesure = 0;

function lierLaMonotoneALaPendule(): void {
  reculDeLaPendule = 0;
  retardDeLaMesure = 0;
  const monotone = jasmine.isSpy(performance.now)
    ? (performance.now as jasmine.Spy<() => number>)
    : spyOn(performance, 'now');
  monotone.and.callFake(() => Date.now() + reculDeLaPendule - retardDeLaMesure);
}

export function retarderLaMesure(dureeMs: number): void {
  retardDeLaMesure += dureeMs;
}

export function figerLesHorloges(instant: Date | string | number): void {
  jasmine.clock().install();
  jasmine.clock().mockDate(new Date(instant));
  lierLaMonotoneALaPendule();
}

export function reculerLaPendule(dureeMs: number): void {
  reculDeLaPendule += dureeMs;
  jasmine.clock().mockDate(new Date(Date.now() - dureeMs));
}

export interface HorlogesDeSaisie {
  saisirPendant(dureeMs: number): void;
}

export function horlogesDeSaisie(): HorlogesDeSaisie {
  let monotone = 1_000;
  let murale = Date.now() + UNE_HEURE_MS;
  spyOn(performance, 'now').and.callFake(() => monotone);
  spyOn(Date, 'now').and.callFake(() => murale);
  return {
    saisirPendant: (dureeMs) => {
      monotone += dureeMs;
      murale -= UNE_HEURE_MS;
    },
  };
}

export interface ChampsAntiRobotLus {
  readonly formFillDurationMs: unknown;
  readonly heureDeDebutEnvoyee: boolean;
}

export function champsAntiRobotDe(corps: object): ChampsAntiRobotLus {
  return {
    formFillDurationMs: (corps as { formFillDurationMs?: unknown }).formFillDurationMs,
    heureDeDebutEnvoyee: 'formStartedAt' in corps,
  };
}

export function sousHorlogeSimulee(preparer: () => void = () => undefined): void {
  beforeEach(() => {
    jasmine.clock().install();
    lierLaMonotoneALaPendule();
    preparer();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });
}

export function sousHorlogeArreteeA(instant: Date): { readonly reculerDe: (ms: number) => void } {
  sousHorlogeSimulee(() => jasmine.clock().mockDate(instant));
  return { reculerDe: reculerLaPendule };
}
