import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Subject, throwError } from 'rxjs';
import type { AuthActionMessage } from '../../../core/models/auth.model';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { preparerAvecLePortDAuth } from '../../../../testing/etat-auth';
import {
  buildAuthSession,
  buildAuthUser,
  createAuthPortStub,
} from '../../../../testing/factories/auth.factory';
import { refusDuBack } from '../../../../testing/factories/probleme-http.factory';
import { lireMarque } from '../../../../testing/marqueurs-dom';
import { AdresseAVerifierComponent } from './adresse-a-verifier.component';

const ADRESSE = 'jean@exemple.fr';

describe('AdresseAVerifierComponent', () => {
  let port: ReturnType<typeof createAuthPortStub>;

  beforeEach(() => {
    port = createAuthPortStub();
  });

  preparerAvecLePortDAuth(AdresseAVerifierComponent, () => port);

  function monter(emailVerified: boolean | null) {
    if (emailVerified !== null) {
      TestBed.inject(AuthStateService).login(
        buildAuthSession({ user: buildAuthUser({ email: ADRESSE, emailVerified }) }),
      );
    }
    const fixture = TestBed.createComponent(AdresseAVerifierComponent);
    fixture.detectChanges();
    return fixture;
  }

  function renvoyer(fixture: ReturnType<typeof monter>): HTMLButtonElement {
    const bouton = lireMarque(fixture, 'adresse-a-verifier-renvoi') as HTMLButtonElement;
    bouton.click();
    fixture.detectChanges();
    return bouton;
  }

  const retour = (fixture: ReturnType<typeof monter>): HTMLElement | null =>
    lireMarque(fixture, 'adresse-a-verifier-retour');

  it('ne montre rien a un visiteur', () => {
    expect(lireMarque(monter(null), 'adresse-a-verifier')).toBeNull();
  });

  it('ne montre rien a un compte dont l adresse est verifiee', () => {
    expect(lireMarque(monter(true), 'adresse-a-verifier')).toBeNull();
  });

  it('dit a un compte connecte que son adresse n est pas verifiee, puis s efface une fois verifiee', () => {
    const fixture = monter(false);

    expect(lireMarque(fixture, 'adresse-a-verifier')?.textContent).toContain(
      'Votre adresse e-mail n’est pas encore vérifiée : ouvrez le lien reçu par e-mail pour activer votre compte.',
    );
    expect(lireMarque(fixture, 'adresse-a-verifier-renvoi')?.textContent?.trim()).toBe(
      'Renvoyer le lien',
    );

    TestBed.inject(AuthStateService).updateUser(
      buildAuthUser({ email: ADRESSE, emailVerified: true }),
    );
    fixture.detectChanges();

    expect(lireMarque(fixture, 'adresse-a-verifier')).toBeNull();
  });

  it('renvoie le lien a l adresse du compte, attend la reponse, puis dit l envoi par son propre texte', () => {
    const reponse = new Subject<AuthActionMessage>();
    port.resendVerification.and.returnValue(reponse);
    const fixture = monter(false);

    const bouton = renvoyer(fixture);

    expect(port.resendVerification).toHaveBeenCalledOnceWith({ email: ADRESSE });
    expect(bouton.disabled).toBeTrue();

    reponse.next({
      message:
        'Si un compte non verifie existe avec cet email, un nouveau lien de verification a ete envoye.',
    });
    reponse.complete();
    fixture.detectChanges();

    expect(bouton.disabled).toBeFalse();
    expect(retour(fixture)?.getAttribute('role')).toBe('status');
    expect(retour(fixture)?.textContent?.trim()).toBe(
      'Demande reçue : un nouveau lien part vers votre adresse, sauf si trois liens sont déjà partis dans l’heure ; ouvrez alors le plus récent.',
    );
    expect(fixture.nativeElement.textContent).not.toContain('Si un compte non verifie');
  });

  for (const [cas, erreur, attendu] of [
    [
      'une demande refusee (400)',
      refusDuBack(400, 'Trop de demandes de verification. Veuillez reessayer dans une heure.'),
      'Le lien n’a pas pu être renvoyé pour le moment : réessayez dans un instant.',
    ],
    [
      'trop de tentatives (429)',
      refusDuBack(429, 'ThrottlerException: Too Many Requests'),
      'Trop de tentatives en peu de temps : patientez quelques minutes avant de réessayer.',
    ],
    [
      'un back injoignable',
      new HttpErrorResponse({ status: 0, url: 'https://asilidesign.fr' }),
      'Le lien n’a pas pu être renvoyé pour le moment : réessayez dans un instant.',
    ],
  ] as const) {
    it(`dit ${cas} par un message localise, jamais par le texte servi`, () => {
      port.resendVerification.and.returnValue(throwError(() => erreur));
      const fixture = monter(false);

      const bouton = renvoyer(fixture);

      expect(retour(fixture)?.textContent?.trim()).toBe(attendu);
      expect(bouton.disabled).toBeFalse();
      expect(lireMarque(fixture, 'adresse-a-verifier')).not.toBeNull();
    });
  }
});
