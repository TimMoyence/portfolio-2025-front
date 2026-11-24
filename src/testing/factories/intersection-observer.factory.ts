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
