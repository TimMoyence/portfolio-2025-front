import {
  decrireToolkitDeFormation,
  verifierFaqDuToolkit,
} from '../../../../../testing/toolkit-de-formation';
import { ToolkitAuditSeoComponent } from './toolkit-audit-seo.component';

describe('ToolkitAuditSeoComponent', () => {
  const rendu = decrireToolkitDeFormation(ToolkitAuditSeoComponent, {
    titre: ['audit seo'],
    slug: 'audit-seo-diy',
  });

  it('devrait afficher la FAQ (AEO / FAQPage signal)', () => {
    verifierFaqDuToolkit(rendu(), 'h3', 3);
  });
});
