import { HttpErrorResponse } from '@angular/common/http';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import type { Observable } from 'rxjs';
import { of, throwError } from 'rxjs';
import { refusDuBack } from '../../../testing/factories/probleme-http.factory';
import { monterPageAuth } from '../../../testing/page-auth';
import { VerifyEmailComponent } from './verify-email.component';

async function verifier(
  token: string | null,
  reponse: Observable<{ message: string }> = of({ message: 'Adresse email verifiee avec succes.' }),
) {
  const page = await monterPageAuth(VerifyEmailComponent, [
    {
      provide: ActivatedRoute,
      useValue: { snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) } },
    },
  ]);
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
  }));

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
