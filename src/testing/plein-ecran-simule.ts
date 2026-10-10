export interface PleinEcranSimule {
  activer(element: Element | null): void;
  restaurer(): void;
}

export function simulerLePleinEcran(): PleinEcranSimule {
  let actif: Element | null = null;
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => actif });
  return {
    activer: (element) => {
      actif = element;
    },
    restaurer: () => Reflect.deleteProperty(document, 'fullscreenElement'),
  };
}
