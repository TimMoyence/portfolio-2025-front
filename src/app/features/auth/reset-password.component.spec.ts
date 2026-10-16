import type { ComponentFixture } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { decrireLaRegleDUnMotDePasseNeuf } from '../../../testing/champ-de-formulaire';
import { buildResetPasswordPayload } from '../../../testing/factories/auth.factory';
import { refusDuBack } from '../../../testing/factories/probleme-http.factory';
import { fournirLaRoute } from '../../../testing/factories/route.factory';
import type { PageAuthMontee } from '../../../testing/page-auth';
import { formulaireSoumis, monterPageAuth } from '../../../testing/page-auth';
import { ResetPasswordComponent } from './reset-password.component';

const NEW_PASSWORD = buildResetPasswordPayload().newPassword;

function envoyerLeNouveauMotDePasse(component: ResetPasswordComponent): void {
  component.motsDePasse = { newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD };
  component.submit(formulaireSoumis());
}

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let authService: PageAuthMontee<ResetPasswordComponent>['authService'];

  beforeEach(async () => {
    const page = await monterPageAuth(ResetPasswordComponent, [
      fournirLaRoute({ requete: { token: 'raw-token' } }),
    ]);
    ({ component, fixture, authService } = page);
    component.ngOnInit();
    fixture.detectChanges();
  });

  it('soumet le reset quand le token est present et le formulaire valide', () => {
    authService.resetPassword.and.returnValue(
      of({ message: 'Mot de passe reinitialise avec succes.' }),
    );

    envoyerLeNouveauMotDePasse(component);

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

      envoyerLeNouveauMotDePasse(component);

      expect(component.errorMessage).toBe(attendu);
      expect(component.isLoading).toBeFalse();
    });
  }

  describe('règle du back sur le nouveau mot de passe', () => {
    decrireLaRegleDUnMotDePasseNeuf(() => fixture, '#newPassword');
  });
});

describe('ResetPasswordComponent — jeton du lien', () => {
  const LIEN_INCOMPLET = 'Le lien de réinitialisation est invalide ou incomplet.';

  async function ouvrirLeLien(
    token: string | null,
  ): Promise<PageAuthMontee<ResetPasswordComponent>> {
    const page = await monterPageAuth(ResetPasswordComponent, [
      fournirLaRoute({ requete: token === null ? {} : { token } }),
    ]);
    page.component.ngOnInit();
    page.fixture.detectChanges();
    return page;
  }

  it('envoie le jeton du lien sans ses blancs', async () => {
    const { component, authService } = await ouvrirLeLien('  raw-token \n');
    authService.resetPassword.and.returnValue(of({ message: 'ok' }));

    envoyerLeNouveauMotDePasse(component);

    expect(authService.resetPassword).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({ token: 'raw-token' }),
    );
  });

  it('dit le lien incomplet des l ouverture quand le jeton est blanc', async () => {
    const { component } = await ouvrirLeLien('   ');

    expect(component.token).toBeNull();
    expect(component.errorMessage).toBe(LIEN_INCOMPLET);
  });

  it('dit le lien incomplet au nouvel envoi et efface le message du precedent', async () => {
    const { component, authService } = await ouvrirLeLien(null);
    component.errorMessage = 'Impossible de réinitialiser le mot de passe.';
    component.successMessage = 'Mot de passe réinitialisé';

    envoyerLeNouveauMotDePasse(component);

    expect(component.submitted).toBeTrue();
    expect(component.successMessage).toBeUndefined();
    expect(component.errorMessage).toBe(LIEN_INCOMPLET);
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('efface l erreur du precedent envoi quand le lien porte un jeton', async () => {
    const { component, authService } = await ouvrirLeLien('raw-token');
    authService.resetPassword.and.returnValue(new Subject<{ message: string }>());
    component.errorMessage = 'Impossible de réinitialiser le mot de passe.';

    envoyerLeNouveauMotDePasse(component);

    expect(component.errorMessage).toBeUndefined();
    expect(component.isLoading).toBeTrue();
  });
});
