import { decrireToolkitDeFormation } from '../../../../../testing/toolkit-de-formation';
import { ToolkitAutoComponent } from './toolkit-auto.component';

describe('ToolkitAutoComponent', () => {
  const rendu = decrireToolkitDeFormation(ToolkitAutoComponent, {
    titre: ['workflow'],
    slug: 'automatiser-avec-ia',
  });

  it('devrait afficher la FAQ (AEO / FAQPage signal)', () => {
    expect(rendu().textContent?.toLowerCase()).toContain('questions');
    expect(rendu().querySelectorAll('details, h3').length).toBeGreaterThan(0);
  });
});
