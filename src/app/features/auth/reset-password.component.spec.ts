import { ActivatedRoute, convertToParamMap } from '@angular/router';
import type { ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { decrireLaRegleDUnMotDePasseNeuf } from '../../../testing/champ-de-formulaire';
import { buildResetPasswordPayload } from '../../../testing/factories/auth.factory';
import { refusDuBack } from '../../../testing/factories/probleme-http.factory';
import type { PageAuthMontee } from '../../../testing/page-auth';
import { formulaireSoumis, monterPageAuth } from '../../../testing/page-auth';
import { ResetPasswordComponent } from './reset-password.component';

const NEW_PASSWORD = buildResetPasswordPayload().newPassword;

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let authService: PageAuthMontee<ResetPasswordComponent>['authService'];

  beforeEach(async () => {
    const page = await monterPageAuth(ResetPasswordComponent, [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParamMap: convertToParamMap({ token: 'raw-token' }),
          },
        },
      },
    ]);
    ({ component, fixture, authService } = page);
    component.ngOnInit();
    fixture.detectChanges();
  });

  it('soumet le reset quand le token est present et le formulaire valide', () => {
    authService.resetPassword.and.returnValue(
      of({ message: 'Mot de passe reinitialise avec succes.' }),
    );

    component.motsDePasse = { newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD };

    component.submit(formulaireSoumis());

    expect(authService.resetPassword).toHaveBeenCalledWith({
      token: 'raw-token',
      newPassword: NEW_PASSWORD,
    });
    expect(component.successMessage).toBe(
      'Mot de passe réinitialisé : vous pouvez maintenant vous connecter.',
    );
  });

  for (const [statut, attendu] of [
    [404, 'Ce lien de réinitialisation est invalide ou a expiré : demandez-en un nouveau.'],
    [400, 'Le nouveau mot de passe n’a pas été accepté : il doit respecter la règle indiquée.'],
    [503, 'Impossible de réinitialiser le mot de passe.'],
  ] as const) {
    it(`dit un refus ${statut} par un message localisé, jamais par le texte servi`, () => {
      authService.resetPassword.and.returnValue(
        throwError(() => refusDuBack(statut, 'Lien invalide ou expiré.')),
      );
      component.motsDePasse = { newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD };

      component.submit(formulaireSoumis());

      expect(component.errorMessage).toBe(attendu);
      expect(component.isLoading).toBeFalse();
    });
  }

  describe('règle du back sur le nouveau mot de passe', () => {
    decrireLaRegleDUnMotDePasseNeuf(() => fixture, '#newPassword');
  });
});
