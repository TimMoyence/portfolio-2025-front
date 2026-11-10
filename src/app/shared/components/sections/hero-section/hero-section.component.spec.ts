import { pageMontee } from '../../../../../testing/page/montage-page';
import { HeroSectionComponent } from './hero-section.component';

describe('HeroSectionComponent', () => {
  const hero = pageMontee(HeroSectionComponent, {
    avantRendu: ({ componentRef }) => {
      componentRef.setInput('contenu', {
        label: 'Connexion',
        title: 'Test heading',
        description: 'A short description',
      });
    },
  });

  it('should create', () => {
    expect(hero.composant).toBeTruthy();
  });

  it('rend le libellé, le titre en h1 et la description', () => {
    expect(hero.racine.querySelector('h1[data-testid="hero-title"]')?.textContent).toContain(
      'Test heading',
    );
    expect(hero.racine.textContent).toContain('Connexion');
    expect(hero.racine.textContent).toContain('A short description');
  });
});
