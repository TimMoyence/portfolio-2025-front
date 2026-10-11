type Ecoute = (event: Event) => void;

export interface EventSourceFactice {
  readonly ferme: jasmine.Spy;
  diffuser(nom: string, donnees: string): void;
  couper(): void;
  restaurer(): void;
}

export function installerEventSourceFactice(): EventSourceFactice {
  const ecoutes = new Map<string, Ecoute>();
  const ferme = jasmine.createSpy('close');
  const portee = globalThis as unknown as { EventSource: unknown };
  const original = portee.EventSource;
  let derniere: { onerror: Ecoute | null } | null = null;
  portee.EventSource = function EventSourceFactice() {
    const source = {
      addEventListener: (nom: string, ecoute: Ecoute) => ecoutes.set(nom, ecoute),
      close: ferme,
      onerror: null,
    };
    derniere = source;
    return source;
  };
  return {
    ferme,
    diffuser: (nom, donnees) => ecoutes.get(nom)?.(new MessageEvent(nom, { data: donnees })),
    couper: () => derniere?.onerror?.(new Event('error')),
    restaurer: () => {
      portee.EventSource = original;
    },
  };
}
