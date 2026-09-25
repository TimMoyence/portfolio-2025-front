import { Component } from '@angular/core';
import { isolateAnimReady } from '../../../testing/anim-ready';
import { installerIntersectionObserverSimule } from '../../../testing/factories/intersection-observer.factory';
import { monterSurPlateforme, type PlateformeDeRendu } from '../../../testing/plateforme';
import { RevealOnScrollDirective } from './reveal-on-scroll.directive';

@Component({
  standalone: true,
  imports: [RevealOnScrollDirective],
  template: `<div appReveal [appRevealDelay]="2">contenu</div>`,
})
class HostComponent {}

function rendreLaDivRevelee(plateforme: PlateformeDeRendu): HTMLElement {
  const fixture = monterSurPlateforme(HostComponent, plateforme);
  fixture.detectChanges();
  return fixture.nativeElement.querySelector('div');
}

describe('RevealOnScrollDirective', () => {
  isolateAnimReady();

  describe('en environnement browser', () => {
    it("pose reveal + data-delay sur l'hôte et anim-ready sur <html>", () => {
      const div = rendreLaDivRevelee('browser');
      expect(div.classList).toContain('reveal');
      expect(div.getAttribute('data-delay')).toBe('2');
      expect(document.documentElement.classList).toContain('anim-ready');
    });

    it("ajoute 'in' quand l'IntersectionObserver déclenche", () => {
      const observateur = installerIntersectionObserverSimule();

      const div = rendreLaDivRevelee('browser');
      expect(observateur.observe).toHaveBeenCalled();
      observateur.declencher([{ isIntersecting: true, target: div }]);
      expect(div.classList).toContain('in');
      expect(observateur.disconnect).toHaveBeenCalled();

      observateur.restaurer();
    });
  });

  describe('en environnement SSR', () => {
    it('ne pose aucune classe (fail-open : reste visible)', () => {
      const div = rendreLaDivRevelee('server');
      expect(div.classList).not.toContain('reveal');
      expect(document.documentElement.classList).not.toContain('anim-ready');
    });
  });
});
