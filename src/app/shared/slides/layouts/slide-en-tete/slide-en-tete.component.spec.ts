import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { setupTestBed } from '../../../../../testing/setup-test-bed';
import { SlideEnTeteComponent, type EnTeteDeSlide } from './slide-en-tete.component';

@Component({
  standalone: true,
  imports: [SlideEnTeteComponent],
  template: `<div class="slide-essai" [appSlideEnTete]="enTete()"><ol class="corps"></ol></div>`,
})
class HoteComponent {
  readonly enTete = signal<EnTeteDeSlide>({
    bloc: 'slide-essai',
    titre: 'Titre',
    sousTitre: 'Sous-titre',
  });
}

function monter(enTete?: EnTeteDeSlide): HTMLElement {
  setupTestBed({ http: false, imports: [HoteComponent] });
  const fixture = TestBed.createComponent(HoteComponent);
  if (enTete !== undefined) {
    fixture.componentInstance.enTete.set(enTete);
  }
  fixture.detectChanges();
  return fixture.nativeElement.querySelector('.slide-essai') as HTMLElement;
}

describe('SlideEnTeteComponent', () => {
  it('rend le titre puis le sous-titre du bloc avant le contenu projete', () => {
    const racine = monter();

    expect(Array.from(racine.children, (enfant) => enfant.tagName)).toEqual(['H2', 'P', 'OL']);
    expect(racine.querySelector('h2')?.textContent).toBe('Titre');
    expect(racine.querySelector('p')?.className).toBe('slide-essai__subtitle');
    expect(racine.querySelector('p')?.textContent).toBe('Sous-titre');
  });

  it("n'ajoute a l'element hote que les marqueurs de developpement d'Angular", () => {
    const racine = monter();
    const marqueursAngular = /^(class|_ng|ng-reflect-)/;

    expect(racine.getAttributeNames().filter((nom) => !marqueursAngular.test(nom))).toEqual([]);
  });

  it("n'affiche ni titre ni sous-titre vides", () => {
    const racine = monter({ bloc: 'slide-essai', titre: '', sousTitre: '' });

    expect(racine.querySelector('h2')).toBeNull();
    expect(racine.querySelector('p')).toBeNull();
    expect(racine.querySelector('.corps')).not.toBeNull();
  });
});
