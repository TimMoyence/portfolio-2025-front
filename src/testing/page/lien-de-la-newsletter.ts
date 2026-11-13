import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import {
  type LienDeLaNewsletter,
  LienDeLaNewsletterComponent,
} from '../../app/features/articles/newsletter/lien-de-la-newsletter.component';
import { NEWSLETTER_PORT } from '../../app/core/ports/newsletter.port';
import { createNewsletterPortStub } from '../factories/newsletter.factory';
import { refusDuBack } from '../factories/serveur/probleme-http.factory';
import { fournirLaRoute } from '../factories/serveur/route.factory';
import { setupTestBed } from '../setup-test-bed';

const BOUTONS: Readonly<Record<LienDeLaNewsletter, string>> = {
  confirmation: 'Confirmer mon abonnement',
  desabonnement: 'Me désabonner',
};

export async function ouvrirLeLienPuisCliquer(
  lien: LienDeLaNewsletter,
  jeton: string,
  options: { readonly statut?: number } = {},
) {
  const port = createNewsletterPortStub();
  if (options.statut !== undefined) {
    const statut = options.statut;
    const refus = throwError(() => refusDuBack(statut));
    port.confirmer.and.returnValue(refus);
    port.seDesabonner.and.returnValue(refus);
  }
  setupTestBed({
    router: true,
    imports: [LienDeLaNewsletterComponent],
    providers: [
      { provide: NEWSLETTER_PORT, useValue: port },
      { provide: LOCALE_ID, useValue: 'fr' },
      fournirLaRoute({ requete: { token: jeton }, donneesFigees: { lien } }),
    ],
  });
  const fixture = TestBed.createComponent(LienDeLaNewsletterComponent);
  fixture.detectChanges();
  const hote = fixture.nativeElement as HTMLElement;
  const appelsAvantLeClic = port.confirmer.calls.count() + port.seDesabonner.calls.count();
  const cible = Array.from(hote.querySelectorAll('button')).find(
    (candidat) => candidat.textContent?.trim() === BOUTONS[lien],
  );
  if (cible === undefined) throw new Error(`bouton absent : ${BOUTONS[lien]}`);
  cible.click();
  await fixture.whenStable();
  fixture.detectChanges();
  return { port, appelsAvantLeClic, hote };
}
