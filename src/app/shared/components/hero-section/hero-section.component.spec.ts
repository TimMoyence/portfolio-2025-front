import { pageMontee } from '../../../../testing/montage-page';
import { HeroSectionComponent } from './hero-section.component';

describe('HeroSectionComponent', () => {
  const hero = pageMontee(HeroSectionComponent, {
    avantRendu: ({ componentInstance }) => {
      componentInstance.title = 'Test heading';
      componentInstance.description = 'A short description';
      componentInstance.actions = [
        { label: 'Primary', href: '/presentation' },
        { label: 'Secondary', variant: 'secondary', href: '/contact' },
      ];
    },
  });

  it('should create', () => {
    expect(hero.composant).toBeTruthy();
  });

  it('should render provided title', () => {
    const heading = hero.racine.querySelector('[data-testid="hero-title"]');
    expect(heading?.textContent).toContain('Test heading');
  });

  it('should render actions', () => {
    const buttons = hero.racine.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('Primary');
  });
});
