import { decrireDeckDeFormation } from '../../../../testing/deck-de-formation';
import { AutomatiserAvecIaComponent } from './automatiser-avec-ia.component';

describe('AutomatiserAvecIaComponent', () => {
  const rendu = decrireDeckDeFormation(AutomatiserAvecIaComponent);

  it('rend une slide CTA toolkit', () => {
    const cta = rendu().querySelector('app-slide-cta');
    expect(cta).toBeTruthy();
  });
});
