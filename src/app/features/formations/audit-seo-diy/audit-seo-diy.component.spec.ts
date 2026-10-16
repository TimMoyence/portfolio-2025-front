import {
  decrireDeckDeFormation,
  decrireDesAppelsAuContact,
} from '../../../../testing/deck-de-formation';
import { AuditSeoDiyComponent } from './audit-seo-diy.component';

describe('AuditSeoDiyComponent', () => {
  const rendu = decrireDeckDeFormation(AuditSeoDiyComponent);

  it('rend une slide CTA', () => {
    expect(rendu().querySelector('app-slide-cta')).toBeTruthy();
  });

  decrireDesAppelsAuContact(rendu);
});
