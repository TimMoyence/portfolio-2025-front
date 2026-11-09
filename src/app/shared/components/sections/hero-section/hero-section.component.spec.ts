import { pageMontee } from '../../../../../testing/page/montage-page';
import { HeroSectionComponent } from './hero-section.component';

describe('HeroSectionComponent', () => {
  const hero = pageMontee(HeroSectionComponent, {
    avantRendu: ({ componentInstance }) => {
      componentInstance.title = 'Test heading';
      componentInstance.description = 'A short description';
    },
  });

  it('should create', () => {
    expect(hero.composant).toBeTruthy();
  });

  it('should render provided title', () => {
    const heading = hero.racine.querySelector('[data-testid="hero-title"]');
    expect(heading?.textContent).toContain('Test heading');
  });
});
