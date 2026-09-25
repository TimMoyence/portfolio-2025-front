import { Observable, of } from 'rxjs';
import type { PageAuthMontee } from '../../../testing/page-auth';
import { formulaireSoumis, monterPageAuth } from '../../../testing/page-auth';
import { ForgotPasswordComponent } from './forgot-password.component';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let authService: PageAuthMontee<ForgotPasswordComponent>['authService'];

  beforeEach(async () => {
    const page = await monterPageAuth(ForgotPasswordComponent);
    ({ component, authService } = page);
    page.fixture.detectChanges();
  });

  it('appelle le service quand le formulaire est valide', () => {
    authService.requestPasswordReset.and.returnValue(of({ message: 'Lien envoye' }));

    component.email = 'john@example.com';
    component.submit(formulaireSoumis());

    expect(authService.requestPasswordReset).toHaveBeenCalledWith({
      email: 'john@example.com',
    });
    expect(component.successMessage).toBe('Lien envoye');
  });

  it('ne devrait pas appeler le service si le formulaire est invalide', () => {
    component.submit(formulaireSoumis(true));

    expect(authService.requestPasswordReset).not.toHaveBeenCalled();
    expect(component.submitted).toBeTrue();
  });

  it('devrait afficher le message d erreur en cas d echec', () => {
    authService.requestPasswordReset.and.returnValue(
      new Observable((sub) => sub.error({ error: { message: 'Utilisateur inconnu' } })),
    );

    component.email = 'unknown@example.com';
    component.submit(formulaireSoumis());

    expect(component.errorMessage).toBe('Utilisateur inconnu');
  });
});
