import type { ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { erreursApresSaisie, texteDuBlocDuChamp } from '../../../testing/champ-de-formulaire';
import { refusDuBack } from '../../../testing/factories/probleme-http.factory';
import type { PageAuthMontee } from '../../../testing/page-auth';
import { formulaireSoumis, monterPageAuth } from '../../../testing/page-auth';
import { ForgotPasswordComponent } from './forgot-password.component';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authService: PageAuthMontee<ForgotPasswordComponent>['authService'];

  beforeEach(async () => {
    const page = await monterPageAuth(ForgotPasswordComponent);
    ({ component, fixture, authService } = page);
    fixture.detectChanges();
  });

  it('refuse avant l envoi une adresse que le back refuse, et le dit sous le champ', async () => {
    for (const refusee of ['jean', 'jean@gmail', 'jean@exemple.c']) {
      expect(await erreursApresSaisie(fixture, '#email', refusee))
        .withContext(refusee)
        .toEqual({ email: true });
    }
    expect(texteDuBlocDuChamp(fixture, '#email')).toContain('Veuillez renseigner un email valide.');
    expect(await erreursApresSaisie(fixture, '#email', 'jean@exemple.fr')).toBeNull();
  });

  it('appelle le service quand le formulaire est valide, et dit son propre texte de succès', () => {
    authService.requestPasswordReset.and.returnValue(of({ message: 'Lien envoye' }));

    component.email = 'john@example.com';
    component.submit(formulaireSoumis());

    expect(authService.requestPasswordReset).toHaveBeenCalledWith({
      email: 'john@example.com',
    });
    expect(component.successMessage).toBe(
      'Si un compte existe avec cette adresse, un lien de réinitialisation vient de vous être envoyé.',
    );
  });

  it('ne devrait pas appeler le service si le formulaire est invalide', () => {
    component.submit(formulaireSoumis(true));

    expect(authService.requestPasswordReset).not.toHaveBeenCalled();
    expect(component.submitted).toBeTrue();
  });

  it('dit un refus du back par un message localisé, jamais par le texte servi, et rend le bouton', () => {
    authService.requestPasswordReset.and.returnValue(
      throwError(() => refusDuBack(400, ['email must be an email'])),
    );

    component.email = 'unknown@example.com';
    component.submit(formulaireSoumis());

    expect(component.errorMessage).toBe(
      'Cette adresse e-mail n’a pas été acceptée : vérifiez-la et réessayez.',
    );
    expect(component.isLoading).toBeFalse();
  });
});
