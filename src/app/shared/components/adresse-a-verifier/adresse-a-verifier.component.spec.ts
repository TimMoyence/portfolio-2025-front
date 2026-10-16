import { HttpErrorResponse } from '@angular/common/http';
import { TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import type { AuthActionMessage, AuthUser } from '../../../core/models/auth.model';
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
    port.me.and.returnValue(of(buildAuthUser({ email: ADRESSE, emailVerified: false })));
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

  describe('pour une adresse verifiee depuis un autre onglet ou un autre appareil', () => {
    const verifie = buildAuthUser({ email: ADRESSE, emailVerified: true });

    function revenirSurLOnglet(visibilite: DocumentVisibilityState): void {
      spyOnProperty(Document.prototype, 'visibilityState', 'get').and.returnValue(visibilite);
      document.dispatchEvent(new Event('visibilitychange'));
    }

    function relueUneFoisEtEffacee(fixture: ReturnType<typeof monter>): void {
      fixture.detectChanges();
      expect(port.me).toHaveBeenCalledTimes(1);
      expect(lireMarque(fixture, 'adresse-a-verifier')).toBeNull();
    }

    it('relit le compte quand l onglet redevient visible : le bandeau s efface', () => {
      const fixture = monter(false);
      port.me.and.returnValue(of(verifie));

      revenirSurLOnglet('visible');
      relueUneFoisEtEffacee(fixture);
    });

    it('relit le compte toutes les 30 s tant que l onglet reste affiche : le bandeau s efface sans retour sur l onglet', fakeAsync(() => {
      spyOnProperty(Document.prototype, 'visibilityState', 'get').and.returnValue('visible');
      const fixture = monter(false);
      port.me.and.returnValue(of(verifie));

      tick(29_999);
      expect(port.me).not.toHaveBeenCalled();
      tick(1);
      relueUneFoisEtEffacee(fixture);
      tick(60_000);
      expect(port.me).toHaveBeenCalledTimes(1);
      TestBed.inject(AuthStateService).clearSession();
      discardPeriodicTasks();
    }));

    it('ne relit rien toutes les 30 s quand l onglet est en arriere-plan', fakeAsync(() => {
      spyOnProperty(Document.prototype, 'visibilityState', 'get').and.returnValue('hidden');
      monter(false);

      tick(90_000);
      expect(port.me).not.toHaveBeenCalled();
      TestBed.inject(AuthStateService).clearSession();
      discardPeriodicTasks();
    }));

    it('attend la relecture du compte avant de promettre un lien', () => {
      const relu = new Subject<AuthUser>();
      const fixture = monter(false);
      port.me.and.returnValue(relu);

      renvoyer(fixture);
      expect(retour(fixture)?.textContent).not.toContain('un nouveau lien part');
      relu.next(buildAuthUser({ email: ADRESSE, emailVerified: false }));
      relu.complete();
      fixture.detectChanges();
      expect(retour(fixture)?.textContent).toContain('un nouveau lien part');
    });

    it('ne relit rien quand l onglet passe en arriere-plan', () => {
      monter(false);

      revenirSurLOnglet('hidden');

      expect(port.me).not.toHaveBeenCalled();
    });

    it('ne relit rien pour un compte deja verifie', () => {
      monter(true);

      revenirSurLOnglet('visible');

      expect(port.me).not.toHaveBeenCalled();
    });

    it('relit le compte apres un renvoi : le bandeau s efface sans promettre de lien', () => {
      const fixture = monter(false);
      port.me.and.returnValue(of(verifie));

      renvoyer(fixture);

      expect(port.me).toHaveBeenCalledTimes(1);
      expect(lireMarque(fixture, 'adresse-a-verifier')).toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('un nouveau lien part');
    });
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
      refusDuBack(429, 'ThrottlerException: Too Many Requests', { 'Retry-After': '3540' }),
      'Trop de tentatives en peu de temps : réessayez dans 59 min.',
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
