import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { monterSurPlateforme } from '../../../testing/plateforme';
import { SlideInDirective } from './slide-in.directive';

@Component({
  template: `<div appSlideIn>Contenu</div>`,
  standalone: true,
  imports: [SlideInDirective],
})
class TestHostComponent {}

describe('SlideInDirective', () => {
  describe('en contexte navigateur', () => {
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(() => {
      fixture = monterSurPlateforme(TestHostComponent, 'browser');
      fixture.detectChanges();
    });

    it('devrait ajouter la classe slide-in-hidden au demarrage', () => {
      const el = fixture.nativeElement.querySelector('[appSlideIn]');
      expect(el.classList.contains('slide-in-hidden')).toBeTrue();
    });

    it('devrait nettoyer l observer a la destruction', () => {
      const disconnect = spyOn(IntersectionObserver.prototype, 'disconnect');

      fixture.destroy();

      expect(disconnect).toHaveBeenCalled();
    });
  });

  describe('en contexte serveur (SSR)', () => {
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(() => {
      fixture = monterSurPlateforme(TestHostComponent, 'server');
      fixture.detectChanges();
    });

    it('ne devrait pas ajouter la classe slide-in-hidden en SSR', () => {
      const el = fixture.nativeElement.querySelector('[appSlideIn]');
      expect(el.classList.contains('slide-in-hidden')).toBeFalse();
    });

    it('devrait se detruire sans erreur en SSR', () => {
      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});
