import type { ComponentFixture } from '@angular/core/testing';
import {
  installerIntersectionObserverSimule,
  type IntersectionObserverSimule,
} from '../../../../testing/factories/intersection-observer.factory';
import type { PlateformeDeRendu } from '../../../../testing/plateforme';
import { decrireSectionAsili } from '../../../../testing/section-asili';
import type { AsiliManifestoLine } from './asili-manifesto.component';
import { AsiliManifestoComponent } from './asili-manifesto.component';

const LINES: readonly AsiliManifestoLine[] = [
  { step: 'Le probleme', html: 'La technologie promet beaucoup,' },
  { html: 'et laisse souvent un <span class="t">flou</span>.' },
  { step: 'La clarte', html: 'Mon metier commence la :' },
];

describe('AsiliManifestoComponent', () => {
  let fixture: ComponentFixture<AsiliManifestoComponent>;

  const monter = decrireSectionAsili(AsiliManifestoComponent, { lines: LINES });

  function setup(plateforme: PlateformeDeRendu = 'browser'): void {
    fixture = monter(plateforme);
  }

  it('rend une ligne .mani-line par entree', () => {
    setup();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const lines = host.querySelectorAll<HTMLElement>('.mani-line');
    expect(lines.length).toBe(LINES.length);
  });

  it("rend le contenu riche avec l'accent .t via innerHTML", () => {
    setup();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const accent = host.querySelector<HTMLElement>('.mani-text .t');
    expect(accent).not.toBeNull();
    expect(accent?.textContent?.trim()).toBe('flou');
  });

  it('affiche le step en .mani-step seulement quand fourni', () => {
    setup();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const steps = host.querySelectorAll<HTMLElement>('.mani-step');
    expect(steps.length).toBe(2);
    expect(steps[0].textContent?.trim()).toBe('Le probleme');
  });

  it('rend toutes les lignes allumees (.lit) au depart : fail-open', () => {
    setup('server');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const lit = host.querySelectorAll<HTMLElement>('.mani-line.lit');
    expect(lit.length).toBe(LINES.length);
  });

  it('reste rendu cote serveur sans logique browser', () => {
    setup('server');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.mani-line').length).toBe(LINES.length);
    expect(host.querySelectorAll('.mani-line.lit').length).toBe(LINES.length);
  });

  describe('scrollytelling browser', () => {
    let observateur: IntersectionObserverSimule;

    beforeEach(() => {
      observateur = installerIntersectionObserverSimule();
    });

    afterEach(() => {
      observateur.restaurer();
    });

    it('retire .lit en mode anime puis observe chaque ligne', () => {
      setup();
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      expect(host.querySelectorAll('.mani-line.lit').length).toBe(0);
      expect(observateur.observe).toHaveBeenCalledTimes(LINES.length);
    });

    it("centre la bande d'observation sur le milieu de l'ecran", () => {
      setup();
      fixture.detectChanges();
      expect(observateur.init()?.rootMargin).toBe('-48% 0px -48% 0px');
    });

    it("allume une ligne quand elle traverse le centre, l'eteint en sortie", () => {
      setup();
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      const line = host.querySelector<HTMLElement>('.mani-line') as HTMLElement;
      expect(line).not.toBeNull();

      observateur.declencher([{ isIntersecting: true, target: line }]);
      expect(line.classList).toContain('lit');

      observateur.declencher([{ isIntersecting: false, target: line }]);
      expect(line.classList).not.toContain('lit');
    });

    it("deconnecte l'observer a la destruction", () => {
      setup();
      fixture.detectChanges();
      fixture.destroy();
      expect(observateur.disconnect).toHaveBeenCalled();
    });
  });
});
