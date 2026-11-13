import { of } from 'rxjs';
import type { NewsletterPort } from '../../app/core/ports/newsletter.port';

export const MESSAGE_D_ABONNEMENT = 'Message servi par le back, tel quel.';

export function createNewsletterPortStub(): jasmine.SpyObj<NewsletterPort> {
  const stub = jasmine.createSpyObj<NewsletterPort>('NewsletterPort', [
    'sAbonner',
    'confirmer',
    'seDesabonner',
  ]);
  stub.sAbonner.and.returnValue(of({ message: MESSAGE_D_ABONNEMENT }));
  stub.confirmer.and.returnValue(of({ status: 'confirmed', locale: 'fr' }));
  stub.seDesabonner.and.returnValue(of({ status: 'unsubscribed' }));
  return stub;
}
