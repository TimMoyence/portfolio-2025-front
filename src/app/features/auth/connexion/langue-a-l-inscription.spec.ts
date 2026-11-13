import { LOCALE_ID } from '@angular/core';
import { of } from 'rxjs';
import { buildLoginCredentials } from '../../../../testing/factories/auth.factory';
import { fournirLaRoute } from '../../../../testing/factories/serveur/route.factory';
import { formulaireSoumis, monterPageAuth } from '../../../../testing/http/page-auth';
import { AuthComponent } from './auth.component';

const MOT_DE_PASSE = buildLoginCredentials().password;

describe('Langue des emails à l inscription', () => {
  it('CPT-01 · inscrit le compte dans la langue cochee', async () => {
    const { fixture, component, authService } = await monterPageAuth(AuthComponent, [
      fournirLaRoute({ donneesFigees: { seoKey: 'register' } }),
      { provide: LOCALE_ID, useValue: 'en-US' },
    ]);
    fixture.detectChanges();
    const hote = fixture.nativeElement as HTMLElement;
    const langue = (code: string) =>
      hote.querySelector<HTMLInputElement>(`input[name="locale"][value="${code}"]`);
    const cocheeParDefaut = langue('en')?.checked;
    authService.register.and.returnValue(of({ message: 'Inscription reçue.' }));

    langue('fr')?.click();
    fixture.detectChanges();
    component.signupForm = {
      ...component.signupForm,
      email: 'jane@mail.com',
      password: MOT_DE_PASSE,
      verifPassword: MOT_DE_PASSE,
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '',
    };
    component.handleSignupSubmit(formulaireSoumis());

    expect(cocheeParDefaut).toBeTrue();
    expect(authService.register.calls.allArgs()).toEqual([
      [jasmine.objectContaining({ email: 'jane@mail.com', locale: 'fr' })],
    ]);
  });
});
