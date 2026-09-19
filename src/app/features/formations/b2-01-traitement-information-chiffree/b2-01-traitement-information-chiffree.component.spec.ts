import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FORMATION_CATALOGUE_PORT } from '../../../core/ports/formation-catalogue.port';
import {
  buildVisualCourse,
  createFormationCataloguePortStub,
} from '../../../../testing/factories/formation-catalogue.factory';
import { B2TraitementInformationChiffreeComponent } from './b2-01-traitement-information-chiffree.component';

describe('B2TraitementInformationChiffreeComponent', () => {
  const catalogue = createFormationCataloguePortStub();

  beforeEach(() => {
    catalogue.lire.and.returnValue(of(buildVisualCourse()));
    TestBed.configureTestingModule({
      imports: [B2TraitementInformationChiffreeComponent],
      providers: [{ provide: FORMATION_CATALOGUE_PORT, useValue: catalogue }],
    });
  });

  it('compose les 72 écrans du catalogue serveur dans le deck partagé', () => {
    const fixture = TestBed.createComponent(B2TraitementInformationChiffreeComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(catalogue.lire).toHaveBeenCalledWith('b2-01-traitement-information-chiffree');
    expect(element.querySelector('app-slide-deck')).not.toBeNull();
    expect(element.querySelectorAll('section.slide')).toHaveSize(72);
    expect(element.querySelector('app-slide-hero')).not.toBeNull();
    expect(element.textContent).toContain('Lire un chiffre');
  });

  it('montre une erreur utile si le catalogue ne répond pas, sans créer un deuxième deck', () => {
    catalogue.lire.and.returnValue(throwError(() => new Error('network')));
    const fixture = TestBed.createComponent(B2TraitementInformationChiffreeComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')).not.toBeNull();
    expect(element.querySelector('app-slide-deck')).toBeNull();
  });
});
