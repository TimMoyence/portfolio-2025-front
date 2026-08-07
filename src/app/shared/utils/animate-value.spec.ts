import { animateValue } from './animate-value';
import type { AnimationHandle } from './animate-value';

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

  /** Execute la prochaine frame planifiee avec le timestamp fourni. */
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

  it('devrait produire des frames ease-out croissantes et une frame finale exacte', () => {
    const frames: number[] = [];
    const onComplete = jasmine.createSpy('onComplete');

    animateValue({
      from: 0,
      to: 100,
      durationMs: 100,
      onFrame: (v) => frames.push(v),
      onComplete,
    });

    runFrame(1000); // progress 0 -> value = from
    runFrame(1050); // progress 0.5 -> eased 0.875
    runFrame(1100); // progress 1 -> frame finale = to

    expect(frames[0]).toBe(0);
    expect(frames[1]).toBeCloseTo(87.5, 5); // 100 * (1 - (1 - 0.5)^3)
    expect(frames[frames.length - 1]).toBe(100);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(queue.length).toBe(0); // plus aucune frame planifiee apres completion
  });

  it('devrait transmettre la valeur brute non arrondie a onFrame', () => {
    const frames: number[] = [];

    animateValue({
      from: 0,
      to: 10,
      durationMs: 100,
      onFrame: (v) => frames.push(v),
    });

    runFrame(1000);
    runFrame(1050); // eased 0.875 -> 8.75 (non arrondi)
    runFrame(1100);

    expect(frames[1]).toBeCloseTo(8.75, 5);
    expect(Number.isInteger(frames[1])).toBe(false);
  });

  it('devrait utiliser from=0 par defaut quand from est absent', () => {
    const frames: number[] = [];

    animateValue({
      to: 100,
      durationMs: 100,
      onFrame: (v) => frames.push(v),
    });

    runFrame(1000); // progress 0 -> doit valoir 0

    expect(frames[0]).toBe(0);
  });

  it('devrait interpoler de facon decroissante quand to < from (compte a rebours)', () => {
    const frames: number[] = [];

    animateValue({
      from: 30,
      to: 10,
      durationMs: 100,
      onFrame: (v) => frames.push(v),
    });

    runFrame(1000);
    runFrame(1050); // 30 + (10 - 30) * 0.875 = 12.5
    runFrame(1100);

    expect(frames[0]).toBe(30);
    expect(frames[1]).toBeCloseTo(12.5, 5);
    expect(frames[frames.length - 1]).toBe(10);
  });

  it('devrait rester constant a la valeur cible quand from === to', () => {
    const frames: number[] = [];
    const onComplete = jasmine.createSpy('onComplete');

    animateValue({
      from: 50,
      to: 50,
      durationMs: 100,
      onFrame: (v) => frames.push(v),
      onComplete,
    });

    runFrame(1000);
    runFrame(1050);
    runFrame(1100);

    expect(frames.every((v) => v === 50)).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  describe('durationMs <= 0', () => {
    it('devrait appliquer la fin immediatement quand durationMs === 0 (pas de boucle, pas de NaN)', () => {
      const onFrame = jasmine.createSpy('onFrame');
      const onComplete = jasmine.createSpy('onComplete');

      animateValue({ from: 0, to: 100, durationMs: 0, onFrame, onComplete });

      expect(onFrame).toHaveBeenCalledOnceWith(100);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(queue.length).toBe(0); // aucune frame planifiee
    });

    it('ne devrait jamais transmettre NaN a onFrame pour durationMs === 0', () => {
      const onFrame = jasmine.createSpy('onFrame');

      animateValue({ from: 0, to: 100, durationMs: 0, onFrame });

      const arg = onFrame.calls.mostRecent().args[0] as number;
      expect(Number.isNaN(arg)).toBe(false);
    });

    it('devrait appliquer la fin immediatement quand durationMs < 0', () => {
      const onFrame = jasmine.createSpy('onFrame');
      const onComplete = jasmine.createSpy('onComplete');

      animateValue({ from: 0, to: 100, durationMs: -500, onFrame, onComplete });

      expect(onFrame).toHaveBeenCalledOnceWith(100);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(queue.length).toBe(0);
    });
  });

  it('devrait propager NaN sans le garder (to = NaN) et completer quand meme', () => {
    const frames: number[] = [];
    const onComplete = jasmine.createSpy('onComplete');

    animateValue({
      from: 0,
      to: NaN,
      durationMs: 100,
      onFrame: (v) => frames.push(v),
      onComplete,
    });

    runFrame(1000);
    runFrame(1100); // progress 1 -> onFrame(to) = onFrame(NaN)

    expect(Number.isNaN(frames[frames.length - 1])).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  describe('cancel()', () => {
    it("devrait stopper l'animation et ne pas appeler onComplete", () => {
      const onFrame = jasmine.createSpy('onFrame');
      const onComplete = jasmine.createSpy('onComplete');

      const handle = animateValue({
        from: 0,
        to: 100,
        durationMs: 100,
        onFrame,
        onComplete,
      });

      runFrame(1000); // premiere frame executee
      const callsBeforeCancel = onFrame.calls.count();
      handle.cancel();

      expect(queue.length).toBe(0); // frame suivante annulee
      expect(onFrame.calls.count()).toBe(callsBeforeCancel); // aucune frame de plus
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('devrait etre un no-op apres completion (idempotent)', () => {
      const onComplete = jasmine.createSpy('onComplete');

      const handle = animateValue({
        from: 0,
        to: 100,
        durationMs: 100,
        onFrame: () => {},
        onComplete,
      });

      runFrame(1000);
      runFrame(1100); // complet

      expect(() => handle.cancel()).not.toThrow();
      expect(onComplete).toHaveBeenCalledTimes(1); // pas d'appel supplementaire
    });

    it('devrait empecher tout onFrame quand appele avant la 1re frame', () => {
      const onFrame = jasmine.createSpy('onFrame');
      const onComplete = jasmine.createSpy('onComplete');

      const handle = animateValue({
        from: 0,
        to: 100,
        durationMs: 100,
        onFrame,
        onComplete,
      });

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
      const onFrame = jasmine.createSpy('onFrame');
      const onComplete = jasmine.createSpy('onComplete');

      animateValue({ from: 0, to: 100, durationMs: 100, onFrame, onComplete });

      expect(onFrame).toHaveBeenCalledOnceWith(100);
      expect(onComplete).toHaveBeenCalledTimes(1);
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
