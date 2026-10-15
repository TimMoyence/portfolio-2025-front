export interface IntersectionObserverSimule {
  readonly observe: jasmine.Spy;
  readonly disconnect: jasmine.Spy;
  readonly init: () => IntersectionObserverInit | undefined;
  readonly declencher: (entrees: readonly Partial<IntersectionObserverEntry>[]) => void;
  readonly restaurer: () => void;
}

type FenetreObservable = { IntersectionObserver: unknown };

class ObservateurInerte {
  observe: (cible: Element) => void = () => undefined;
  disconnect: () => void = () => undefined;
  unobserve = (): void => {};
  takeRecords = (): IntersectionObserverEntry[] => [];
  root = null;
  rootMargin = '';
  thresholds = [];
}

function remplacerIntersectionObserver(
  classe: new (
    rappel: IntersectionObserverCallback,
    init?: IntersectionObserverInit,
  ) => ObservateurInerte,
): () => void {
  const original = window.IntersectionObserver;
  (window as unknown as FenetreObservable).IntersectionObserver = classe;
  return () => {
    (window as unknown as FenetreObservable).IntersectionObserver = original;
  };
}

export function installerIntersectionObserverSimule(): IntersectionObserverSimule {
  let rappel: IntersectionObserverCallback | null = null;
  let initRecue: IntersectionObserverInit | undefined;
  const observe = jasmine.createSpy('observe');
  const disconnect = jasmine.createSpy('disconnect');

  const restaurer = remplacerIntersectionObserver(
    class extends ObservateurInerte {
      constructor(cb: IntersectionObserverCallback, init?: IntersectionObserverInit) {
        super();
        rappel = cb;
        initRecue = init;
      }
      override observe = observe;
      override disconnect = disconnect;
    },
  );

  return {
    observe,
    disconnect,
    init: () => initRecue,
    declencher: (entrees) => {
      if (rappel === null) {
        throw new Error('Aucun IntersectionObserver construit');
      }
      rappel(entrees as IntersectionObserverEntry[], {} as IntersectionObserver);
    },
    restaurer,
  };
}

export function installerIntersectionObserverToujoursVisible(): () => void {
  return remplacerIntersectionObserver(
    class extends ObservateurInerte {
      constructor(private readonly rappel: IntersectionObserverCallback) {
        super();
      }
      override observe = (target: Element): void => {
        this.rappel(
          [{ isIntersecting: true, intersectionRatio: 1, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      };
    },
  );
}
