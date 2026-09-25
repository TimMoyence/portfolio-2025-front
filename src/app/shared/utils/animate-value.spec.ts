import { animateValue } from './animate-value';
import type { AnimateValueOptions, AnimationHandle } from './animate-value';

/**
 * Harnais de test pilotant manuellement `requestAnimationFrame`.
 *
 * On remplace les globals RAF/CAF par une file de callbacks que l'on vide
 * frame par frame avec des timestamps controles. `performance.now` est fige
 * pour couvrir les deux implementations acceptables du t0 (timestamp de la
 * 1re frame OU performance.now() a l'ordonnancement) : les deux voient le
 * meme instant de depart.
 */
interface FrameEntry {
  id: number;
  cb: FrameRequestCallback;
}

describe('animateValue', () => {
  let queue: FrameEntry[];
  let nextId: number;
  let now: number;
  let originalRaf: typeof globalThis.requestAnimationFrame;
  let originalCaf: typeof globalThis.cancelAnimationFrame;

  function runFrame(timestamp: number): void {
    const entry = queue.shift();
    if (!entry) {
      throw new Error('Aucune frame planifiee');
    }
    now = timestamp;
    entry.cb(timestamp);
  }

  beforeEach(() => {
    queue = [];
    nextId = 1;
    now = 1000;
    originalRaf = globalThis.requestAnimationFrame;
    originalCaf = globalThis.cancelAnimationFrame;

    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback): number => {
      const id = nextId++;
      queue.push({ id, cb });
      return id;
    }) as typeof globalThis.requestAnimationFrame;

    globalThis.cancelAnimationFrame = ((id: number): void => {
      queue = queue.filter((entry) => entry.id !== id);
    }) as typeof globalThis.cancelAnimationFrame;

    spyOn(performance, 'now').and.callFake(() => now);
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRaf;
    globalThis.cancelAnimationFrame = originalCaf;
  });

  it('devrait retourner un handle avec une methode cancel', () => {
    const handle = animateValue({
      to: 100,
      durationMs: 100,
      onFrame: () => {},
    });
    expect(handle).toBeDefined();
    expect(typeof handle.cancel).toBe('function');
  });

  function animerSurFrames(
    bornes: Pick<AnimateValueOptions, 'from' | 'to'>,
    timestamps: readonly number[],
  ): { frames: number[]; onComplete: jasmine.Spy } {
    const frames: number[] = [];
    const onComplete = jasmine.createSpy('onComplete');
    animateValue({ ...bornes, durationMs: 100, onFrame: (v) => frames.push(v), onComplete });
    for (const timestamp of timestamps) {
      runFrame(timestamp);
    }
    return { frames, onComplete };
  }

  function animerDeZeroACent(durationMs: number): {
    handle: AnimationHandle;
    onFrame: jasmine.Spy;
    onComplete: jasmine.Spy;
  } {
    const onFrame = jasmine.createSpy('onFrame');
    const onComplete = jasmine.createSpy('onComplete');
    const handle = animateValue({ from: 0, to: 100, durationMs, onFrame, onComplete });
    return { handle, onFrame, onComplete };
  }

  function attendreLaFinSynchrone(onFrame: jasmine.Spy, onComplete: jasmine.Spy): void {
    expect(onFrame).toHaveBeenCalledOnceWith(100);
    expect(onComplete).toHaveBeenCalledTimes(1);
  }

  const FRAMES_DEBUT_MILIEU_FIN = [1000, 1050, 1100] as const;

  it('devrait produire des frames ease-out croissantes et une frame finale exacte', () => {
    const { frames, onComplete } = animerSurFrames({ from: 0, to: 100 }, FRAMES_DEBUT_MILIEU_FIN);

    expect(frames[0]).toBe(0);
    expect(frames[1]).toBeCloseTo(87.5, 5);
    expect(frames[frames.length - 1]).toBe(100);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(queue.length).toBe(0);
  });

  it('devrait transmettre la valeur brute non arrondie a onFrame', () => {
    const { frames } = animerSurFrames({ from: 0, to: 10 }, FRAMES_DEBUT_MILIEU_FIN);

    expect(frames[1]).toBeCloseTo(8.75, 5);
    expect(Number.isInteger(frames[1])).toBe(false);
  });

  it('devrait utiliser from=0 par defaut quand from est absent', () => {
    const { frames } = animerSurFrames({ to: 100 }, [1000]);

    expect(frames[0]).toBe(0);
  });

  it('devrait interpoler de facon decroissante quand to < from (compte a rebours)', () => {
    const { frames } = animerSurFrames({ from: 30, to: 10 }, FRAMES_DEBUT_MILIEU_FIN);

    expect(frames[0]).toBe(30);
    expect(frames[1]).toBeCloseTo(12.5, 5);
    expect(frames[frames.length - 1]).toBe(10);
  });

  it('devrait rester constant a la valeur cible quand from === to', () => {
    const { frames, onComplete } = animerSurFrames({ from: 50, to: 50 }, FRAMES_DEBUT_MILIEU_FIN);

    expect(frames.every((v) => v === 50)).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  describe('durationMs <= 0', () => {
    it('devrait appliquer la fin immediatement quand durationMs === 0 (pas de boucle, pas de NaN)', () => {
      const { onFrame, onComplete } = animerDeZeroACent(0);

      attendreLaFinSynchrone(onFrame, onComplete);
      expect(queue.length).toBe(0);
    });

    it('ne devrait jamais transmettre NaN a onFrame pour durationMs === 0', () => {
      const { onFrame } = animerDeZeroACent(0);

      const arg = onFrame.calls.mostRecent().args[0] as number;
      expect(Number.isNaN(arg)).toBe(false);
    });

    it('devrait appliquer la fin immediatement quand durationMs < 0', () => {
      const { onFrame, onComplete } = animerDeZeroACent(-500);

      attendreLaFinSynchrone(onFrame, onComplete);
      expect(queue.length).toBe(0);
    });
  });

  it('devrait propager NaN sans le garder (to = NaN) et completer quand meme', () => {
    const { frames, onComplete } = animerSurFrames({ from: 0, to: NaN }, [1000, 1100]);

    expect(Number.isNaN(frames[frames.length - 1])).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  describe('cancel()', () => {
    it("devrait stopper l'animation et ne pas appeler onComplete", () => {
      const { handle, onFrame, onComplete } = animerDeZeroACent(100);

      runFrame(1000);
      const callsBeforeCancel = onFrame.calls.count();
      handle.cancel();

      expect(queue.length).toBe(0);
      expect(onFrame.calls.count()).toBe(callsBeforeCancel);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('devrait etre un no-op apres completion (idempotent)', () => {
      const { handle, onComplete } = animerDeZeroACent(100);

      runFrame(1000);
      runFrame(1100);

      expect(() => handle.cancel()).not.toThrow();
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('devrait empecher tout onFrame quand appele avant la 1re frame', () => {
      const { handle, onFrame, onComplete } = animerDeZeroACent(100);

      handle.cancel();

      expect(queue.length).toBe(0);
      expect(onFrame).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('garde SSR (requestAnimationFrame indisponible)', () => {
    beforeEach(() => {
      (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame = undefined;
    });

    it('devrait appliquer la valeur finale de facon synchrone (onFrame(to) puis onComplete)', () => {
      const { onFrame, onComplete } = animerDeZeroACent(100);

      attendreLaFinSynchrone(onFrame, onComplete);
    });

    it('devrait retourner un handle no-op dont cancel ne jette pas', () => {
      const handle: AnimationHandle = animateValue({
        to: 42,
        durationMs: 100,
        onFrame: () => {},
      });

      expect(typeof handle.cancel).toBe('function');
      expect(() => handle.cancel()).not.toThrow();
    });
  });
});
