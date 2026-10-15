import { type EscapedHtml, escapeHtml, safeHtml } from './html';

export const DEFILEUR_DE_TABLEAU = 'defileur-de-tableau';

export function dansUnDefileur(tableau: EscapedHtml): EscapedHtml {
  return safeHtml`<div class="${escapeHtml(DEFILEUR_DE_TABLEAU)}">${tableau}</div>`;
}

export function suivreLesDefileurs(racine: ParentNode): void {
  racine.querySelectorAll<HTMLElement>(`.${DEFILEUR_DE_TABLEAU}`).forEach((defileur) => {
    suivreLaSuite(defileur);
  });
}

export function suivreLaSuite(defileur: HTMLElement): () => void {
  const relire = (): void => {
    const passe = defileur.scrollLeft;
    const reste = defileur.scrollWidth - defileur.clientWidth - passe;
    defileur.toggleAttribute('data-suite-avant', passe > 1);
    defileur.toggleAttribute('data-suite-apres', reste > 1);
  };
  const observateur =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => (defileur.isConnected ? relire() : arreter()));
  function arreter(): void {
    defileur.removeEventListener('scroll', relire);
    observateur?.disconnect();
  }
  defileur.addEventListener('scroll', relire, { passive: true });
  observateur?.observe(defileur);
  if (defileur.firstElementChild !== null) {
    observateur?.observe(defileur.firstElementChild);
  }
  relire();
  return arreter;
}
