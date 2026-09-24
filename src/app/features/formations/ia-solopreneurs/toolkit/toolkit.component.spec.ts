import { decrireToolkitDeFormation } from '../../../../../testing/toolkit-de-formation';
import { ToolkitComponent } from './toolkit.component';

describe('ToolkitComponent', () => {
  const rendu = decrireToolkitDeFormation(ToolkitComponent, {
    titre: ['toolkit IA', 'solopreneurs'],
    slug: 'ia-solopreneurs',
  });

  it('devrait pointer le lien privacy vers /privacy (sans prefixe de locale)', () => {
    const link = rendu().querySelector('.tk-brand a');
    expect(link?.getAttribute('href')).toBe('/privacy');
  });
});
