/**
 * Isolation : la classe `anim-ready` vit sur `<html>`, singleton partagé par
 * tous les specs d'une même exécution Karma. On la retire avant ET après chaque
 * test pour immuniser les assertions SSR « pas d'anim-ready » contre une fuite
 * d'état laissée par un spec précédent (ex. home/presentation/offer) qui aurait
 * rendu un `appReveal` en plateforme browser sans nettoyer, quel que soit
 * l'ordre d'exécution randomisé.
 */
export function isolateAnimReady(): void {
  beforeEach(() => {
    document.documentElement.classList.remove('anim-ready');
  });

  afterEach(() => {
    document.documentElement.classList.remove('anim-ready');
  });
}
