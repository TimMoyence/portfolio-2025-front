export interface AnimationHandle {
  cancel: () => void;
}

export interface AnimateValueOptions {
  to: number;
  durationMs: number;
  onFrame: (value: number) => void;
  from?: number;
  onComplete?: () => void;
}

/**
 * `onFrame` recoit la valeur interpolee brute : l'arrondi eventuel reste a la
 * charge de l'appelant. Le court-circuit `durationMs <= 0` evite le `NaN` d'une
 * division par zero.
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
