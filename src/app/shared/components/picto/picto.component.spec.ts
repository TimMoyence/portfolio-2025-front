import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { PictoComponent, type NomDePicto } from './picto.component';

@Component({
  standalone: true,
  imports: [PictoComponent],
  template: `<svg [appPicto]="nom()" [taille]="taille()"></svg>`,
})
class HotePictoComponent {
  readonly nom = signal<NomDePicto>('coche');
  readonly taille = signal(34);
}

describe('PictoComponent', () => {
  function rendre(nom: NomDePicto, taille = 34): SVGSVGElement {
    setupTestBed({ http: false, imports: [HotePictoComponent] });
    const fixture = TestBed.createComponent(HotePictoComponent);
    fixture.componentInstance.nom.set(nom);
    fixture.componentInstance.taille.set(taille);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector('svg') as SVGSVGElement;
  }

  it('porte le cadre commun des pictos : viewBox 24, sans remplissage, a la taille demandee', () => {
    const svg = rendre('coche', 32);

    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('fill')).toBe('none');
    expect(svg.getAttribute('width')).toBe('32');
    expect(svg.getAttribute('height')).toBe('32');
  });

  it('dessine la coche', () => {
    const chemin = rendre('coche').querySelector('path');

    expect(chemin?.getAttribute('d')).toBe('M5 12.5 10 17l9-10');
    expect(chemin?.getAttribute('stroke-width')).toBe('2');
  });

  const formes: readonly [NomDePicto, readonly string[]][] = [
    ['enveloppe', ['rect', 'path']],
    ['courrier', ['path', 'rect']],
    ['cadenas', ['rect', 'path']],
    ['alerte', ['circle', 'path']],
  ];

  for (const [nom, elements] of formes) {
    it(`dessine le picto ${nom} dans l ordre de ses traces`, () => {
      const svg = rendre(nom);
      const traces = Array.from(svg.children).map((enfant) => enfant.localName);

      expect(traces).toEqual([...elements]);
      expect(Array.from(svg.children).every((enfant) => enfant.namespaceURI === svg.namespaceURI))
        .withContext('les traces vivent dans l espace de noms SVG')
        .toBeTrue();
    });
  }
});
