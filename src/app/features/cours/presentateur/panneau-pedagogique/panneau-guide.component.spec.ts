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

  it('affiche uniquement les trois repères utiles à la facilitation', () => {
    const fixture = monter(buildGuideFormateur());

    expect(rubriques(fixture)).toEqual([
      ['question', 'Question à poser'],
      ['reponse', 'Réponse attendue'],
      ['relance', 'Relance'],
    ]);
    for (const terme of racine(fixture).querySelectorAll('dt')) {
      expect(terme.closest('dl')).not.toBeNull();
    }
    expect(racine(fixture).textContent).not.toContain(buildGuideFormateur().aDire ?? '');
    expect(racine(fixture).textContent).not.toContain(buildGuideFormateur().calcul ?? '');
    expect(racine(fixture).textContent).not.toContain(buildGuideFormateur().transition ?? '');
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

  it('n affiche que les repères essentiels servis', () => {
    const fixture = monter({ aDire: 'Regardez la source.', calcul: '12 / 4 = 3' });

    expect(rubriques(fixture).map(([cle]) => cle)).toEqual([]);
    expect(racine(fixture).querySelector('[data-testid="panneau-guide-reveler"]')).toBeNull();
  });

  it('dit qu aucun guide n est fourni pour un ecran sans guide', () => {
    const fixture = monter(undefined);

    expect(racine(fixture).querySelector('[data-testid="panneau-guide-vide"]')).not.toBeNull();
    expect(rubriques(fixture).map(([cle]) => cle)).toEqual([]);
  });
});
