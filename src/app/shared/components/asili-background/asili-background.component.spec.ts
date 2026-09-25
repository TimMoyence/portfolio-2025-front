import type { ComponentFixture } from '@angular/core/testing';
import { monterSurPlateforme, type PlateformeDeRendu } from '../../../../testing/plateforme';
import { AsiliBackgroundComponent } from './asili-background.component';

const createMotionQueryStub = (
  initialMatches: boolean,
): {
  mql: MediaQueryList;
  handler: ((event: MediaQueryListEvent) => void) | null;
  removeSpy: jasmine.Spy;
  emit: (matches: boolean) => void;
} => {
  const stub = {
    mql: null as unknown as MediaQueryList,
    handler: null as ((event: MediaQueryListEvent) => void) | null,
    removeSpy: jasmine.createSpy('removeEventListener'),
    emit: (matches: boolean): void => {
      stub.handler?.({ matches } as MediaQueryListEvent);
    },
  };
  stub.mql = {
    matches: initialMatches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void): void => {
      stub.handler = listener;
    },
    removeEventListener: stub.removeSpy,
  } as unknown as MediaQueryList;
  return stub;
};

function simulerMouvementReduit(reduit: boolean): ReturnType<typeof createMotionQueryStub> {
  const motionQuery = createMotionQueryStub(reduit);
  spyOn(window, 'matchMedia').and.returnValue(motionQuery.mql);
  return motionQuery;
}

function monterLeFond(plateforme: PlateformeDeRendu): ComponentFixture<AsiliBackgroundComponent> {
  const fixture = monterSurPlateforme(AsiliBackgroundComponent, plateforme);
  fixture.detectChanges();
  return fixture;
}

describe('AsiliBackgroundComponent', () => {
  describe('en SSR', () => {
    it('ne rend pas de <canvas> côté serveur', () => {
      const fixture = monterLeFond('server');
      expect(fixture.nativeElement.querySelector('canvas')).toBeNull();
    });
  });

  describe('en browser', () => {
    it('rend un <canvas> aria-hidden', () => {
      const fixture = monterLeFond('browser');
      const canvas = fixture.nativeElement.querySelector('canvas');
      expect(canvas).not.toBeNull();
      expect(canvas.getAttribute('aria-hidden')).toBe('true');
    });

    it('ne lance PAS de boucle rAF sous prefers-reduced-motion', () => {
      simulerMouvementReduit(true);
      const rafSpy = spyOn(window, 'requestAnimationFrame').and.callThrough();
      monterLeFond('browser');
      expect(rafSpy).not.toHaveBeenCalled();
    });

    it('annule la boucle au destroy', () => {
      simulerMouvementReduit(false);
      const cancelSpy = spyOn(window, 'cancelAnimationFrame').and.callThrough();
      const fixture = monterLeFond('browser');
      fixture.destroy();
      expect(cancelSpy).toHaveBeenCalled();
    });

    it("coupe la boucle quand prefers-reduced-motion s'active en cours de session", () => {
      const motionQuery = simulerMouvementReduit(false);
      const cancelSpy = spyOn(window, 'cancelAnimationFrame').and.callThrough();
      const fixture = monterLeFond('browser');

      expect(motionQuery.handler)
        .withContext('un ecouteur `change` doit etre enregistre')
        .not.toBeNull();

      motionQuery.emit(true);

      expect(cancelSpy).toHaveBeenCalled();
      fixture.destroy();
    });

    it('relance la boucle quand prefers-reduced-motion est desactive en cours de session', () => {
      const motionQuery = simulerMouvementReduit(true);
      const rafSpy = spyOn(window, 'requestAnimationFrame').and.returnValue(1);
      const fixture = monterLeFond('browser');
      expect(rafSpy).not.toHaveBeenCalled();

      motionQuery.emit(false);

      expect(rafSpy).toHaveBeenCalled();
      fixture.destroy();
    });

    it("retire l'ecouteur de prefers-reduced-motion au destroy", () => {
      const motionQuery = simulerMouvementReduit(true);
      const fixture = monterLeFond('browser');

      fixture.destroy();

      expect(motionQuery.removeSpy).toHaveBeenCalledWith('change', jasmine.any(Function));
    });
  });
});
