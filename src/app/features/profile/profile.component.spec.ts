import { signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthStateService } from '../../core/services/auth-state.service';
import {
  decrireLaRegleDUnMotDePasseNeuf,
  erreursApresSaisie,
  MOTS_DE_PASSE,
  telephoneBienFormeDeLongueur,
  texteDuBlocDuChamp,
} from '../../../testing/champ-de-formulaire';
import { buildAuthUser, buildSetPasswordPayload } from '../../../testing/factories/auth.factory';
import { refusDuBack } from '../../../testing/factories/probleme-http.factory';
import type { PageAuthMontee } from '../../../testing/page-auth';
import { formulaireSoumis, monterPageAuth } from '../../../testing/page-auth';
import { ProfileComponent } from './profile.component';

const NEW_PASSWORD = buildSetPasswordPayload().newPassword;

function createAuthStateMock(overrides?: Partial<{ hasPassword: boolean; roles: string[] }>) {
  const user = buildAuthUser({
    hasPassword: overrides?.hasPassword ?? false,
    roles: overrides?.roles ?? ['user'],
  });
  return {
    restoreSession: jasmine.createSpy('restoreSession'),
    updateUser: jasmine.createSpy('updateUser'),
    clearSession: jasmine.createSpy('clearSession'),
    logout: jasmine.createSpy('logout'),
    logoutEtAccueil: jasmine.createSpy('logoutEtAccueil'),
    user: signal(user),
    isLoggedIn: signal(true),
    hasRole: (role: string) => user.roles.includes(role),
  };
}

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authService: PageAuthMontee<ProfileComponent>['authService'];
  let authState: ReturnType<typeof createAuthStateMock>;

  async function monter(options?: { hasPassword: boolean }): Promise<void> {
    authState = createAuthStateMock(options);
    ({ fixture, component, authService } = await monterPageAuth(ProfileComponent, [
      { provide: AuthStateService, useValue: authState },
    ]));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await monter();
  });

  it('devrait se creer', () => {
    expect(component).toBeTruthy();
  });

  it('initial renvoie la premiere lettre majuscule (prenom > nom > email)', () => {
    expect(component.initial('Jean', 'Dupont', 'j@d.fr')).toBe('J');
    expect(component.initial('', 'Dupont', 'j@d.fr')).toBe('D');
    expect(component.initial('', '', 'j@d.fr')).toBe('J');
    expect(component.initial()).toBe('?');
  });

  it('initial saute les blancs d un libelle et rend ? quand aucun n en porte', () => {
    expect(component.initial('  jean', 'Dupont')).toBe('J');
    expect(component.initial('   ', ' dupont')).toBe('D');
    expect(component.initial('   ', '', ' ')).toBe('?');
  });

  it("logout revoque la session serveur et redirige vers l'accueil par AuthStateService", () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    component.logout();

    expect(authState.logoutEtAccueil).toHaveBeenCalledOnceWith();
    expect(authState.logout).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('logout ne doit pas se limiter a la purge locale (cookie de refresh a revoquer)', () => {
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    component.logout();

    expect(authState.clearSession).not.toHaveBeenCalled();
  });

  it('appelle setPassword et rafraichit la session', () => {
    authService.setPassword.and.returnValue(of(buildAuthUser({ hasPassword: true })));

    component.newPassword = NEW_PASSWORD;
    component.setPassword(formulaireSoumis());

    expect(authService.setPassword).toHaveBeenCalledWith({
      newPassword: NEW_PASSWORD,
    });
    expect(authState.restoreSession).toHaveBeenCalled();
    expect(component.setPasswordSuccess).toBeDefined();
  });

  it('exige 12 caractères au nouveau mot de passe, comme le back', () => {
    const page: HTMLElement = fixture.nativeElement;

    expect(page.querySelector<HTMLInputElement>('#newPassword')?.minLength).toBe(12);
  });

  describe('règle du back sur chaque mot de passe neuf', () => {
    for (const [hasPassword, selecteur] of [
      [false, '#newPassword'],
      [true, '#changeNewPassword'],
    ] as const) {
      describe(selecteur, () => {
        beforeEach(async () => {
          TestBed.resetTestingModule();
          await monter({ hasPassword });
        });

        decrireLaRegleDUnMotDePasseNeuf(() => fixture, selecteur);
      });
    }

    it('plafonne le mot de passe actuel à 256 caractères sans le rogner, comme le back', async () => {
      TestBed.resetTestingModule();
      await monter({ hasPassword: true });

      expect(await erreursApresSaisie(fixture, '#currentPassword', MOTS_DE_PASSE.tropLong)).toEqual(
        {
          maxlength: { requiredLength: 256, actualLength: 257 },
        },
      );
      expect(await erreursApresSaisie(fixture, '#currentPassword', '   ')).toBeNull();
    });
  });

  it('ne presente plus l atelier retire', () => {
    const page: HTMLElement = fixture.nativeElement;

    expect(page.textContent).not.toMatch(/Atelier|Météo|Sebastian/);
    expect(page.querySelector('a[href^="/atelier"]')).toBeNull();
  });

  describe('mode edition du profil', () => {
    it('startEditing pre-remplit les champs et active le mode edition', () => {
      expect(component.isEditing()).toBeFalse();

      component.startEditing();

      expect(component.isEditing()).toBeTrue();
      expect(component.editFirstName).toBe('Jean');
      expect(component.editLastName).toBe('Dupont');
      expect(component.editPhone).toBe('');
    });

    it('juge le prénom et le nom rognés, requis et comptés en caractères, comme le back', async () => {
      component.startEditing();
      fixture.detectChanges();
      const sourire = String.fromCodePoint(0x1f600);

      for (const selecteur of ['#editFirstName', '#editLastName']) {
        expect(await erreursApresSaisie(fixture, selecteur, '   '))
          .withContext(selecteur)
          .toEqual({ required: true });
        expect(await erreursApresSaisie(fixture, selecteur, sourire.repeat(50)))
          .withContext(selecteur)
          .toBeNull();
        expect(await erreursApresSaisie(fixture, selecteur, 'a'.repeat(51)))
          .withContext(selecteur)
          .toEqual({ maxlength: { requiredLength: 50, actualLength: 51 } });
      }
      expect(texteDuBlocDuChamp(fixture, '#editLastName')).toContain(
        'Ce champ doit contenir au plus 50 caractères.',
      );
    });

    it('accepte un prénom et un nom d un seul caractère, comme le back (B-35)', async () => {
      component.startEditing();
      fixture.detectChanges();

      for (const selecteur of ['#editFirstName', '#editLastName']) {
        for (const unSeul of ['A', '李', String.fromCodePoint(0x1f600)]) {
          expect(await erreursApresSaisie(fixture, selecteur, ` ${unSeul} `))
            .withContext(`${selecteur} ${unSeul}`)
            .toBeNull();
        }
      }
      expect(texteDuBlocDuChamp(fixture, '#editLastName')).not.toContain('au moins');
    });

    it('refuse un téléphone que le back refuse, et le dit sous le champ', async () => {
      component.startEditing();
      fixture.detectChanges();

      expect(await erreursApresSaisie(fixture, '#editPhone', '06 98 a0 32 82')).toEqual({
        phone: true,
      });
      expect(texteDuBlocDuChamp(fixture, '#editPhone')).toContain(
        'Merci d’entrer un numéro de téléphone valide.',
      );
    });

    it('n envoie pas un profil que le back refuserait', () => {
      component.startEditing();

      component.saveProfile(formulaireSoumis(true));

      expect(authService.updateProfile).not.toHaveBeenCalled();
    });

    it('envoie le prénom et le nom rognés, ceux que le back garde', () => {
      authService.updateProfile.and.returnValue(of(buildAuthUser()));
      component.startEditing();
      component.editFirstName = '  Pierre ';
      component.editLastName = ' Martin  ';

      component.saveProfile(formulaireSoumis());

      expect(authService.updateProfile).toHaveBeenCalledWith(
        jasmine.objectContaining({ firstName: 'Pierre', lastName: 'Martin' }),
      );
    });

    it('plafonne le téléphone à 30 caractères, comme le back', async () => {
      component.startEditing();
      fixture.detectChanges();

      expect(
        await erreursApresSaisie(fixture, '#editPhone', telephoneBienFormeDeLongueur(31)),
      ).toEqual({
        maxlength: { requiredLength: 30, actualLength: 31 },
      });
      expect(
        await erreursApresSaisie(fixture, '#editPhone', telephoneBienFormeDeLongueur(30)),
      ).toBeNull();
    });

    it('startEditing pre-remplit le telephone quand il est renseigne', () => {
      authState.user.set(buildAuthUser({ phone: '+33612345678' }));

      component.startEditing();

      expect(component.editPhone).toBe('+33612345678');
    });

    it('cancelEditing revient en mode lecture', () => {
      component.startEditing();
      expect(component.isEditing()).toBeTrue();

      component.cancelEditing();
      expect(component.isEditing()).toBeFalse();
    });

    it('cancelEditing efface les messages de succes et erreur', () => {
      component.editProfileSuccess = 'ok';
      component.editProfileError = 'erreur';

      component.cancelEditing();

      expect(component.editProfileSuccess).toBeUndefined();
      expect(component.editProfileError).toBeUndefined();
    });

    it('saveProfile appelle updateProfile et met a jour le state', () => {
      const updatedUser = buildAuthUser({
        firstName: 'Pierre',
        lastName: 'Martin',
        phone: '+33600000000',
      });
      authService.updateProfile.and.returnValue(of(updatedUser));

      component.startEditing();
      component.editFirstName = 'Pierre';
      component.editLastName = 'Martin';
      component.editPhone = '+33600000000';
      component.saveProfile(formulaireSoumis());

      expect(authService.updateProfile).toHaveBeenCalledWith({
        firstName: 'Pierre',
        lastName: 'Martin',
        phone: '+33600000000',
      });
      expect(authState.updateUser).toHaveBeenCalledWith(updatedUser);
      expect(component.editProfileSuccess).toBeDefined();
      expect(component.isEditing()).toBeFalse();
    });

    it('saveProfile envoie null pour un telephone vide', () => {
      authService.updateProfile.and.returnValue(of(buildAuthUser()));

      component.startEditing();
      component.editPhone = '';
      component.saveProfile(formulaireSoumis());

      expect(authService.updateProfile).toHaveBeenCalledWith(
        jasmine.objectContaining({ phone: null }),
      );
    });

    it('saveProfile envoie null pour un telephone blanc et un telephone renseigne sans ses espaces', () => {
      authService.updateProfile.and.returnValue(of(buildAuthUser()));

      component.startEditing();
      for (const saisie of ['   ', ' +33600000000 ']) {
        component.editPhone = saisie;
        component.saveProfile(formulaireSoumis());
      }

      expect(authService.updateProfile.calls.allArgs().map(([profil]) => profil.phone)).toEqual([
        null,
        '+33600000000',
      ]);
    });

    for (const [statut, attendu] of [
      [400, 'Certaines informations ont été refusées : vérifiez les champs et réessayez.'],
      [
        403,
        'Votre adresse e-mail n’est pas encore vérifiée : ouvrez le lien reçu par e-mail pour activer votre compte.',
      ],
      [500, 'Impossible de mettre à jour le profil pour le moment.'],
    ] as const) {
      it(`saveProfile dit un refus ${statut} par un message localisé et reste en édition`, () => {
        authService.updateProfile.and.returnValue(
          throwError(() => refusDuBack(statut, 'Invalid user phone number')),
        );

        component.startEditing();
        component.saveProfile(formulaireSoumis());

        expect(component.editProfileError).toBe(attendu);
        expect(component.editProfileLoading).toBeFalse();
        expect(component.isEditing()).toBeTrue();
      });
    }
  });

  describe('refus et succès des mots de passe', () => {
    const texte = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

    it('garde lisible le succès de la définition du mot de passe après le rechargement de la session', () => {
      authService.setPassword.and.returnValue(of(buildAuthUser({ hasPassword: true })));
      authState.restoreSession.and.callFake(() =>
        authState.user.set(buildAuthUser({ hasPassword: true })),
      );

      component.newPassword = NEW_PASSWORD;
      component.setPassword(formulaireSoumis());
      fixture.detectChanges();

      expect(texte()).toContain('Changer le mot de passe');
      expect(texte()).toContain('Mot de passe défini avec succès.');
    });

    for (const [statut, attendu] of [
      [
        409,
        'Un mot de passe est déjà défini pour ce compte : utilisez « Changer le mot de passe ».',
      ],
      [400, 'Le nouveau mot de passe n’a pas été accepté : il doit respecter la règle indiquée.'],
    ] as const) {
      it(`setPassword dit un refus ${statut} par un message localisé`, () => {
        authService.setPassword.and.returnValue(
          throwError(() => refusDuBack(statut, 'Password is already configured')),
        );

        component.newPassword = NEW_PASSWORD;
        component.setPassword(formulaireSoumis());

        expect(component.setPasswordError).toBe(attendu);
        expect(component.setPasswordLoading).toBeFalse();
      });
    }

    for (const [statut, detail] of [
      [401, 'Current password is invalid'],
      [400, 'newPassword must be longer than or equal to 12 characters'],
    ] as const) {
      it(`changePassword dit un refus ${statut} par un message localisé, et son succès accentué`, async () => {
        TestBed.resetTestingModule();
        await monter({ hasPassword: true });
        authService.changePassword.and.returnValues(
          throwError(() => refusDuBack(statut, detail)),
          of(buildAuthUser({ hasPassword: true })),
        );
        component.currentPassword = 'actuel';
        component.changeNewPassword = NEW_PASSWORD;

        component.changePassword(formulaireSoumis());
        expect(component.changePasswordError).toBe(
          'Vérifiez votre mot de passe actuel et la règle du nouveau mot de passe.',
        );
        expect(component.changePasswordLoading).toBeFalse();

        component.changePassword(formulaireSoumis());
        fixture.detectChanges();
        expect(texte()).toContain('Mot de passe modifié avec succès.');
      });
    }
  });
});
