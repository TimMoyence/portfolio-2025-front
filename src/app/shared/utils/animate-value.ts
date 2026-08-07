/** Handle annulable retourne par {@link animateValue}. */
export interface AnimationHandle {
  /** Annule l'animation en cours (idempotent, sans effet si deja terminee). */
  cancel: () => void;
}

/** Options de {@link animateValue}. */
export interface AnimateValueOptions {
  /** Valeur cible finale. */
  to: number;
  /** Duree en millisecondes. */
  durationMs: number;
  /** Appele a chaque frame avec la valeur interpolee (NON arrondie). */
  onFrame: (value: number) => void;
  /** Valeur de depart. Defaut 0. */
  from?: number;
  /** Appele une fois quand l'animation atteint la cible (progress >= 1). */
  onComplete?: () => void;
}

/**
 * Anime une valeur numerique de `from` vers `to` via `requestAnimationFrame`,
 * courbe ease-out cubic `1 - (1 - p)^3`.
 *
 * `onFrame` recoit la valeur interpolee brute `from + (to - from) * eased`
 * (l'arrondi eventuel reste a la charge de l'appelant). La frame finale recoit
 * exactement `to`.
 *
 * Le t0 est capture depuis le timestamp de la 1re frame RAF (aucune dependance
 * a `performance`). Si `durationMs <= 0`, la fin est appliquee immediatement
 * (evite tout `NaN` issu d'une division par zero).
 *
 * SSR-safe : si `requestAnimationFrame` est indisponible (rendu serveur), la
 * valeur finale est appliquee immediatement (`onFrame(to)` puis `onComplete`)
 * et un handle no-op est retourne — aucun acces a `window`.
 *
 * @param options - Voir {@link AnimateValueOptions}
 * @returns Un {@link AnimationHandle} pour annuler l'animation
 */
export function animateValue(options: AnimateValueOptions): AnimationHandle {
  const { to, durationMs, onFrame, from = 0, onComplete } = options;

  if (durationMs <= 0 || typeof requestAnimationFrame !== 'function') {
    onFrame(to);
    onComplete?.();
    return { cancel: () => {} };
  }

  let cancelled = false;
  let rafId: number | null = null;
  let start: number | null = null;

  const step = (timestamp: number): void => {
    if (cancelled) {
      return;
    }
    if (start === null) {
      start = timestamp;
    }
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / durationMs, 1);

    if (progress < 1) {
      const eased = 1 - Math.pow(1 - progress, 3);
      onFrame(from + (to - from) * eased);
      rafId = requestAnimationFrame(step);
    } else {
      onFrame(to);
      rafId = null;
      onComplete?.();
    }
  };

  rafId = requestAnimationFrame(step);

  return {
    cancel: (): void => {
      if (cancelled) {
        return;
      }
      cancelled = true;
      if (rafId !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  };
}
