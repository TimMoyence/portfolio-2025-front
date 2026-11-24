import { decrirePage } from '../../../testing/page/page-decrite';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  const { rendu: compiled } = decrirePage(HomeComponent);

  it('devrait rendre un unique h1 (titre du hero)', () => {
    const headings = compiled().querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0].textContent).toContain('Votre métier mérite mieux');
  });
});
