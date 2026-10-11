import { createJournalSpy, type JournalEspion } from './factories/journal.factory';

export function reponseJson(corps: unknown, status = 200): Response {
  return new Response(JSON.stringify(corps), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export interface DoublesDeLecteur {
  readonly appels: jasmine.Spy<typeof fetch>;
  readonly journal: JournalEspion;
  readonly horloge: { maintenant: number };
  readonly dependances: {
    readonly fetch: typeof fetch;
    readonly journal: Pick<Console, 'warn'>;
    readonly maintenant: () => number;
  };
}

export function doublesDeLecteur(instant: number): DoublesDeLecteur {
  const appels = jasmine.createSpy<typeof fetch>('fetch');
  const journal = createJournalSpy();
  const horloge = { maintenant: instant };
  return {
    appels,
    journal,
    horloge,
    dependances: { fetch: appels, journal, maintenant: () => horloge.maintenant },
  };
}
