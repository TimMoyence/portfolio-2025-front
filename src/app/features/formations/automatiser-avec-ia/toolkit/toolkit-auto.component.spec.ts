import {
  decrireToolkitDeFormation,
  verifierFaqDuToolkit,
} from '../../../../../testing/toolkit-de-formation';
import { ToolkitAutoComponent } from './toolkit-auto.component';

describe('ToolkitAutoComponent', () => {
  const rendu = decrireToolkitDeFormation(ToolkitAutoComponent, {
    titre: ['workflow'],
    slug: 'automatiser-avec-ia',
  });

  it('devrait afficher la FAQ (AEO / FAQPage signal)', () => {
    verifierFaqDuToolkit(rendu(), 'details, h3', 1);
  });
});
