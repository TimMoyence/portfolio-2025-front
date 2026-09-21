import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { buildReponseLibreFormateur } from '../../../../../testing/factories/formations.factory';
import { PanneauReponsesLibresComponent } from './panneau-reponses-libres.component';

type Fixture = ComponentFixture<PanneauReponsesLibresComponent>;

const REPONSES = [
  buildReponseLibreFormateur({ id: 'r-1', screenId: 'ecran-1', response: 'Comparer les bases.' }),
  buildReponseLibreFormateur({ id: 'r-2', screenId: 'ecran-2', response: 'Lire la source.' }),
  buildReponseLibreFormateur({ id: 'r-3', screenId: 'ecran-1', response: 'Vérifier l’unité.' }),
];

function monter(ecranId: string): Fixture {
  const fixture = TestBed.createComponent(PanneauReponsesLibresComponent);
  fixture.componentRef.setInput('reponses', REPONSES);
  fixture.componentRef.setInput('ecranId', ecranId);
  fixture.detectChanges();
  return fixture;
}

function textes(fixture: Fixture): string[] {
  return [
    ...(fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid="reponse-libre"]'),
  ].map((element) => element.textContent?.trim() ?? '');
}

describe('PanneauReponsesLibresComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [PanneauReponsesLibresComponent] }));

  it('ne montre que les reponses libres de l ecran courant', () => {
    expect(textes(monter('ecran-1'))).toEqual(['Comparer les bases.', 'Vérifier l’unité.']);
  });

  it('annonce l absence de reponse sur l ecran meme si d autres ecrans en ont recu', () => {
    const fixture = monter('ecran-3');

    expect(textes(fixture)).toEqual([]);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="reponses-libres-vide"]'),
    ).not.toBeNull();
  });
});
