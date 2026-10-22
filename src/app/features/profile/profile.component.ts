import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
} from '@angular/core';
import type { NgForm } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import type { AuthUser } from '../../core/models/auth.model';
import type { AuthPort } from '../../core/ports/auth.port';
import { AUTH_PORT } from '../../core/ports/auth.port';
import { AuthStateService } from '../../core/services/auth-state.service';
import { FieldErrorsComponent } from '../../shared/components/field-errors/field-errors.component';
import { BornesDeSaisieDirective } from '../../shared/directives/bornes-de-saisie.directive';
import { FormatDeContactDirective } from '../../shared/directives/format-de-contact.directive';
import { MotDePasseNeufDirective } from '../../shared/directives/mot-de-passe-neuf.directive';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import {
  handleFormSubmit,
  INFORMATIONS_REFUSEES,
  MOT_DE_PASSE_NEUF_REFUSE,
} from '../../shared/utils/form-submit.utils';
import { initialeDe } from '../../shared/utils/initiale.utils';
import { zChangePasswordDto, zUpdateProfileDto } from '../../../../contrat/zod.gen';
import { bornesDu, REGLE_D_UN_MOT_DE_PASSE } from '../../shared/utils/regles-de-saisie';
import { telephoneFacultatif } from '../../shared/utils/telephone.utils';

const PROFIL = zUpdateProfileDto.shape;

const CHANGEMENT_DE_MOT_DE_PASSE_REFUSE = $localize`:@@profileChangePasswordErreurSaisie:Vérifiez votre mot de passe actuel et la règle du nouveau mot de passe.`;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    RevealOnScrollDirective,
    FieldErrorsComponent,
    BornesDeSaisieDirective,
    FormatDeContactDirective,
    MotDePasseNeufDirective,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly authService: AuthPort = inject(AUTH_PORT);
  readonly authState = inject(AuthStateService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly regleDUnMotDePasse = REGLE_D_UN_MOT_DE_PASSE;
  protected readonly bornesDuPrenom = bornesDu(PROFIL.firstName.unwrap());
  protected readonly bornesDuNom = bornesDu(PROFIL.lastName.unwrap());
  protected readonly bornesDUnTelephone = bornesDu(PROFIL.phone.unwrap().unwrap());
  protected readonly bornesDUnMotDePasseSaisi = bornesDu(
    zChangePasswordDto.shape.currentPassword,
    true,
  );

  isEditing = signal(false);
  editFirstName = '';
  editLastName = '';
  editPhone = '';
  editProfileSubmitted = false;
  editProfileLoading = false;
  editProfileSuccess?: string;
  editProfileError?: string;

  newPassword = '';
  setPasswordSubmitted = false;
  setPasswordLoading = false;
  setPasswordSuccess?: string;
  setPasswordError?: string;

  currentPassword = '';
  changeNewPassword = '';
  changePasswordSubmitted = false;
  changePasswordLoading = false;
  changePasswordSuccess?: string;
  changePasswordError?: string;

  private readonly libellesIdentite = {
    prenom: $localize`:@@profileFirstNameLabel:Prénom`,
    nom: $localize`:@@profileLastNameLabel:Nom`,
    email: $localize`:@@profileEmailLabel:Email`,
  };

  protected lignesIdentite(user: AuthUser): readonly { libelle: string; valeur: string }[] {
    return [
      { libelle: this.libellesIdentite.prenom, valeur: user.firstName },
      { libelle: this.libellesIdentite.nom, valeur: user.lastName },
      { libelle: this.libellesIdentite.email, valeur: user.email },
    ];
  }

  initial(firstName?: string, lastName?: string, email?: string): string {
    return initialeDe(firstName, lastName, email) || '?';
  }

  logout(): void {
    this.authState.logoutEtAccueil();
  }

  startEditing(): void {
    const user = this.authState.user();
    if (!user) return;
    this.editFirstName = user.firstName;
    this.editLastName = user.lastName;
    this.editPhone = user.phone ?? '';
    this.editProfileSubmitted = false;
    this.editProfileSuccess = undefined;
    this.editProfileError = undefined;
    this.isEditing.set(true);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
    this.editProfileSubmitted = false;
    this.editProfileSuccess = undefined;
    this.editProfileError = undefined;
  }

  saveProfile(form: NgForm): void {
    this.editProfileSubmitted = true;
    this.editProfileSuccess = undefined;
    this.editProfileError = undefined;
    if (form.invalid) return;

    this.editProfileLoading = true;
    handleFormSubmit(
      this.authService.updateProfile({
        firstName: this.editFirstName.trim(),
        lastName: this.editLastName.trim(),
        phone: telephoneFacultatif(this.editPhone),
      }),
      this.cdr,
      {
        fallbackError: $localize`:profile.edit.error.generic@@profileEditErrorGeneric:Impossible de mettre à jour le profil pour le moment.`,
        refus: { 400: INFORMATIONS_REFUSEES },
        onSuccess: (updatedUser) => {
          this.authState.updateUser(updatedUser);
          this.editProfileSuccess = $localize`:profile.edit.success@@profileEditSuccess:Profil mis à jour avec succès.`;
          this.isEditing.set(false);
        },
        onError: (message) => {
          this.editProfileError = message;
        },
        finalement: () => {
          this.editProfileLoading = false;
        },
      },
    );
  }

  setPassword(form: NgForm): void {
    this.setPasswordSubmitted = true;
    this.setPasswordSuccess = undefined;
    this.setPasswordError = undefined;
    if (form.invalid) return;

    this.setPasswordLoading = true;

    handleFormSubmit(this.authService.setPassword({ newPassword: this.newPassword }), this.cdr, {
      fallbackError: $localize`:profile.password.error.generic@@profilePasswordErrorGeneric:Impossible de définir le mot de passe pour le moment.`,
      refus: {
        400: MOT_DE_PASSE_NEUF_REFUSE,
        409: $localize`:@@profilePasswordErreurDejaDefini:Un mot de passe est déjà défini pour ce compte : utilisez « Changer le mot de passe ».`,
      },
      onSuccess: () => {
        this.setPasswordSuccess = $localize`:profile.password.success@@profilePasswordSuccess:Mot de passe défini avec succès.`;
        this.newPassword = '';
        form.resetForm({ newPassword: '' });
        this.setPasswordSubmitted = false;
        this.authState.restoreSession();
      },
      onError: (message) => {
        this.setPasswordError = message;
      },
      finalement: () => {
        this.setPasswordLoading = false;
      },
    });
  }

  changePassword(form: NgForm): void {
    this.changePasswordSubmitted = true;
    this.setPasswordSuccess = undefined;
    this.changePasswordSuccess = undefined;
    this.changePasswordError = undefined;
    if (form.invalid) return;

    this.changePasswordLoading = true;

    handleFormSubmit(
      this.authService.changePassword({
        currentPassword: this.currentPassword,
        newPassword: this.changeNewPassword,
      }),
      this.cdr,
      {
        fallbackError: $localize`:profile.changePassword.error.generic@@profileChangePasswordErrorGeneric:Impossible de changer le mot de passe pour le moment.`,
        refus: {
          400: CHANGEMENT_DE_MOT_DE_PASSE_REFUSE,
          401: CHANGEMENT_DE_MOT_DE_PASSE_REFUSE,
        },
        onSuccess: () => {
          this.changePasswordSuccess = $localize`:profile.changePassword.success@@profileChangePasswordSuccess:Mot de passe modifié avec succès.`;
          this.currentPassword = '';
          this.changeNewPassword = '';
          form.resetForm({ currentPassword: '', changeNewPassword: '' });
          this.changePasswordSubmitted = false;
          this.authState.restoreSession();
        },
        onError: (message) => {
          this.changePasswordError = message;
        },
        finalement: () => {
          this.changePasswordLoading = false;
        },
      },
    );
  }
}
