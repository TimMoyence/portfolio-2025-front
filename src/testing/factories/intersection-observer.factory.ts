export interface IntersectionObserverSimule {
  readonly observe: jasmine.Spy;
  readonly disconnect: jasmine.Spy;
  readonly init: () => IntersectionObserverInit | undefined;
  readonly declencher: (entrees: readonly Partial<IntersectionObserverEntry>[]) => void;
  readonly restaurer: () => void;
}

type FenetreObservable = { IntersectionObserver: unknown };

export function installerIntersectionObserverSimule(): IntersectionObserverSimule {
  let rappel: IntersectionObserverCallback | null = null;
  let initRecue: IntersectionObserverInit | undefined;
  const observe = jasmine.createSpy('observe');
  const disconnect = jasmine.createSpy('disconnect');
  const original = window.IntersectionObserver;

  (window as unknown as FenetreObservable).IntersectionObserver = class {
    constructor(cb: IntersectionObserverCallback, init?: IntersectionObserverInit) {
      rappel = cb;
      initRecue = init;
    }
    observe = observe;
    disconnect = disconnect;
    unobserve = (): void => {};
    takeRecords = (): IntersectionObserverEntry[] => [];
    root = null;
    rootMargin = '';
    thresholds = [];
  };

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
    restaurer: () => {
      (window as unknown as FenetreObservable).IntersectionObserver = original;
    },
  };
}
