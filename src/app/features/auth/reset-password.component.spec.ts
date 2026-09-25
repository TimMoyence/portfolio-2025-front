import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { buildResetPasswordPayload } from '../../../testing/factories/auth.factory';
import type { PageAuthMontee } from '../../../testing/page-auth';
import { formulaireSoumis, monterPageAuth } from '../../../testing/page-auth';
import { ResetPasswordComponent } from './reset-password.component';

const NEW_PASSWORD = buildResetPasswordPayload().newPassword;

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
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
    ({ component, authService } = page);
    component.ngOnInit();
    page.fixture.detectChanges();
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
    expect(component.successMessage).toContain('reinitialise');
  });
});
