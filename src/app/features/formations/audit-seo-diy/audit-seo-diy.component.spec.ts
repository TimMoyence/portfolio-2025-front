import { decrireDeckDeFormation } from '../../../../testing/deck-de-formation';
import { AuditSeoDiyComponent } from './audit-seo-diy.component';

describe('AuditSeoDiyComponent', () => {
  const rendu = decrireDeckDeFormation(AuditSeoDiyComponent);

  it('rend une slide CTA vers le toolkit audit', () => {
    expect(rendu().querySelector('app-slide-cta')).toBeTruthy();
  });
});
