import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { GuideFormateur } from '../../../../../cours/content/types';
import { buildGuideFormateur } from '../../../../../testing/factories/formations.factory';
import { PanneauGuideComponent } from './panneau-guide.component';

type Fixture = ComponentFixture<PanneauGuideComponent>;

function monter(guide: GuideFormateur | undefined, ecranId = 'ecran-1'): Fixture {
  const fixture = TestBed.createComponent(PanneauGuideComponent);
  fixture.componentRef.setInput('guide', guide);
  fixture.componentRef.setInput('ecranId', ecranId);
  fixture.componentRef.setInput('ecranSuivant', 'Le taux global');
  fixture.detectChanges();
  return fixture;
}

function racine(fixture: Fixture): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function rubriques(fixture: Fixture): (string | null)[][] {
  return [...racine(fixture).querySelectorAll('[data-testid="panneau-guide-rubrique"]')].map(
    (rubrique) => [
      rubrique.getAttribute('data-rubrique'),
      rubrique.querySelector('dt')?.textContent?.trim() ?? null,
    ],
  );
}

function reveler(fixture: Fixture): HTMLButtonElement {
  const bouton = racine(fixture).querySelector<HTMLButtonElement>(
    '[data-testid="panneau-guide-reveler"]',
  );
  if (bouton === null) {
    throw new Error('Aucun bouton de révélation dans le guide');
  }
  return bouton;
}

describe('PanneauGuideComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [PanneauGuideComponent] }));

  it('affiche les six rubriques du guide servi, chaque terme dans une liste de definitions', () => {
    const fixture = monter(buildGuideFormateur());

    expect(rubriques(fixture)).toEqual([
      ['aDire', 'À dire'],
      ['question', 'Question à poser'],
      ['reponse', 'Réponse attendue'],
      ['calcul', 'Calcul'],
      ['relance', 'Relance'],
      ['transition', 'Transition'],
    ]);
    for (const terme of racine(fixture).querySelectorAll('dt')) {
      expect(terme.closest('dl')).not.toBeNull();
    }
    expect(racine(fixture).textContent).toContain(buildGuideFormateur().calcul ?? '');
  });

  it('masque la reponse attendue jusqu a la revelation, puis la remasque', () => {
    const fixture = monter(buildGuideFormateur());
    const reponse = buildGuideFormateur().reponse ?? '';

    expect(racine(fixture).textContent).not.toContain(reponse);
    expect(reveler(fixture).getAttribute('aria-expanded')).toBe('false');

    reveler(fixture).click();
    fixture.detectChanges();

    expect(
      racine(fixture).querySelector('[data-testid="panneau-guide-reponse"]')?.textContent?.trim(),
    ).toBe(reponse);
    expect(reveler(fixture).getAttribute('aria-expanded')).toBe('true');

    reveler(fixture).click();
    fixture.detectChanges();

    expect(racine(fixture).textContent).not.toContain(reponse);
  });

  it('remasque la reponse attendue quand l ecran change', () => {
    const fixture = monter(buildGuideFormateur());
    reveler(fixture).click();
    fixture.detectChanges();

    fixture.componentRef.setInput('ecranId', 'ecran-2');
    fixture.detectChanges();

    expect(racine(fixture).textContent).not.toContain(buildGuideFormateur().reponse ?? '');
  });

  it('n affiche que les rubriques servies et annonce l ecran suivant faute de transition', () => {
    const fixture = monter({ aDire: 'Regardez la source.' });

    expect(rubriques(fixture).map(([cle]) => cle)).toEqual(['aDire', 'transition']);
    expect(racine(fixture).textContent).toContain('Le taux global');
    expect(racine(fixture).querySelector('[data-testid="panneau-guide-reveler"]')).toBeNull();
  });

  it('dit qu aucun guide n est fourni pour un ecran sans guide', () => {
    const fixture = monter(undefined);

    expect(racine(fixture).querySelector('[data-testid="panneau-guide-vide"]')).not.toBeNull();
    expect(rubriques(fixture).map(([cle]) => cle)).toEqual(['transition']);
  });
});
