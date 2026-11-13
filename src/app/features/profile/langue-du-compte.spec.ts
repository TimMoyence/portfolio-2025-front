import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AuthStateService } from '../../core/services/auth-state.service';
import { buildAuthUser } from '../../../testing/factories/auth.factory';
import { formulaireSoumis, monterPageAuth } from '../../../testing/http/page-auth';
import { ProfileComponent } from './profile.component';

describe('Langue des emails du compte au profil', () => {
  it('CPT-03 · affiche et modifie la langue des emails du compte', async () => {
    const user = buildAuthUser({ locale: 'en' });
    const etat = {
      user: signal(user),
      isLoggedIn: signal(true),
      updateUser: jasmine.createSpy('updateUser'),
      hasRole: () => false,
    };
    const { fixture, component, authService } = await monterPageAuth(ProfileComponent, [
      { provide: AuthStateService, useValue: etat },
    ]);
    fixture.detectChanges();
    const hote = fixture.nativeElement as HTMLElement;
    const affichee = hote.textContent ?? '';
    authService.updateProfile.and.returnValue(of({ ...user, locale: 'fr' }));

    component.startEditing();
    fixture.detectChanges();
    hote.querySelector<HTMLInputElement>('input[name="editLocale"][value="fr"]')?.click();
    component.saveProfile(formulaireSoumis());

    expect(affichee).toContain('Langue des emails du compte');
    expect(affichee).toContain('English');
    expect(authService.updateProfile.calls.allArgs()).toEqual([
      [jasmine.objectContaining({ locale: 'fr' })],
    ]);
  });
});
