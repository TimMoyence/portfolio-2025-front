import { HttpErrorResponse } from '@angular/common/http';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import type { Observable } from 'rxjs';
import { of, throwError } from 'rxjs';
import type { AuthUser } from '../../core/models/auth.model';
import { AuthStateService } from '../../core/services/auth-state.service';
import { buildAuthSession, buildAuthUser } from '../../../testing/factories/auth.factory';
import { refusDuBack } from '../../../testing/factories/probleme-http.factory';
import { monterPageAuth } from '../../../testing/page-auth';
import { VerifyEmailComponent } from './verify-email.component';

async function verifier(
  token: string | null,
  reponse: Observable<{ message: string }> = of({ message: 'Adresse email verifiee avec succes.' }),
  compte: { connecte: AuthUser; relu: Observable<AuthUser> } | null = null,
) {
  const page = await monterPageAuth(VerifyEmailComponent, [
    {
      provide: ActivatedRoute,
      useValue: { snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) } },
    },
  ]);
  if (compte !== null) {
    TestBed.inject(AuthStateService).login(buildAuthSession({ user: compte.connecte }));
    page.authService.me.and.returnValue(compte.relu);
  }
  page.authService.verifyEmail.and.returnValue(reponse);
  const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  page.fixture.detectChanges();
  return { ...page, navigate, texte: () => page.fixture.nativeElement.textContent as string };
}

describe('VerifyEmailComponent', () => {
  it('dit la vérification réussie par son propre texte, puis mène à la connexion', fakeAsync(async () => {
    const { authService, fixture, navigate, texte } = await verifier('a'.repeat(64));

    expect(authService.verifyEmail).toHaveBeenCalledOnceWith('a'.repeat(64));
    fixture.detectChanges();
    expect(texte()).toContain('Votre adresse e-mail est vérifiée : votre compte est activé.');
    expect(texte()).not.toContain('verifiee avec succes');
    expect(texte()).toContain('Vous allez être redirigé vers la page de connexion…');

    tick(3000);
    expect(navigate).toHaveBeenCalledOnceWith(['/login']);
    expect(authService.me).not.toHaveBeenCalled();
  }));

  describe('pour un compte connecte dont l adresse attend sa verification', () => {
    const connecte = buildAuthUser({ email: 'jean@exemple.fr', emailVerified: false });

    async function verifierEnEtantConnecte(relu: Observable<AuthUser>) {
      const { authService } = await verifier('c'.repeat(64), undefined, { connecte, relu });
      expect(authService.me).toHaveBeenCalledTimes(1);
      return TestBed.inject(AuthStateService);
    }

    it('relit le compte apres la verification : son bandeau d adresse a verifier s efface', fakeAsync(async () => {
      const etat = await verifierEnEtantConnecte(of({ ...connecte, emailVerified: true }));

      expect(etat.user()?.emailVerified).toBeTrue();
      expect(etat.isLoggedIn()).toBeTrue();
      tick(3000);
    }));

    it('garde la session ouverte quand le lien verifiait une autre adresse que la sienne', fakeAsync(async () => {
      const etat = await verifierEnEtantConnecte(
        throwError(() => refusDuBack(403, 'Email non verifie')),
      );

      expect(etat.isLoggedIn()).toBeTrue();
      expect(etat.user()).toEqual(connecte);
      tick(3000);
    }));
  });

  for (const [cas, erreur, attendu] of [
    [
      'un lien inconnu, expiré ou déjà utilisé (404)',
      refusDuBack(404, 'Lien invalide ou expiré.'),
      'La vérification a échoué : le lien est invalide ou a expiré.',
    ],
    [
      'un back injoignable',
      new HttpErrorResponse({ status: 0, url: 'https://asilidesign.fr' }),
      'La vérification n’a pas pu aboutir pour le moment : réessayez dans un instant.',
    ],
    [
      'trop de tentatives (429)',
      refusDuBack(429, 'ThrottlerException: Too Many Requests'),
      'Trop de tentatives en peu de temps : patientez quelques minutes avant de réessayer.',
    ],
  ] as const) {
    it(`dit ${cas} par un message localisé, jamais par le texte servi`, async () => {
      const { fixture, texte } = await verifier(
        'b'.repeat(64),
        throwError(() => erreur),
      );

      fixture.detectChanges();
      expect(fixture.componentInstance.errorMessage).toBe(attendu);
      expect(texte()).toContain(attendu);
      expect(texte()).toContain('Retour à la connexion');
    });
  }

  it('n appelle pas le back sans lien, et le dit sans jargon', async () => {
    const { authService, fixture, texte } = await verifier(null);

    fixture.detectChanges();
    expect(authService.verifyEmail).not.toHaveBeenCalled();
    expect(texte()).toContain(
      'Le lien de vérification est incomplet : ouvrez-le depuis l’e-mail reçu.',
    );
  });
});
