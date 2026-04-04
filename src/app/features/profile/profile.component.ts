import { CommonModule } from "@angular/common";
import type { OnInit } from "@angular/core";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
} from "@angular/core";
import type { NgForm } from "@angular/forms";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import type { FavoriteCity } from "../../core/models/weather.model";
import type { AuthPort } from "../../core/ports/auth.port";
import { AUTH_PORT } from "../../core/ports/auth.port";
import { AuthStateService } from "../../core/services/auth-state.service";
import type { WeatherPort } from "../../core/ports/weather.port";
import { WEATHER_PORT } from "../../core/ports/weather.port";
import { WeatherLevelService } from "../weather/services/weather-level.service";
import { HeroSectionComponent } from "../../shared/components/hero-section/hero-section.component";
import { handleFormSubmit } from "../../shared/utils/form-submit.utils";

/** Page profil utilisateur : identite, mot de passe, preferences meteo. */
@Component({
  selector: "app-profile",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeroSectionComponent],
  templateUrl: "./profile.component.html",
  styleUrl: "./profile.component.scss",
  providers: [WeatherLevelService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private readonly authService: AuthPort = inject(AUTH_PORT);
  readonly authState = inject(AuthStateService);
  readonly levelService = inject(WeatherLevelService);
  private readonly weatherService: WeatherPort = inject(WEATHER_PORT);
  private readonly cdr = inject(ChangeDetectorRef);

  /* — Edition du profil — */
  isEditing = signal(false);
  editFirstName = "";
  editLastName = "";
  editPhone = "";
  editProfileLoading = false;
  editProfileSuccess?: string;
  editProfileError?: string;

  /* — Set password (Google-only) — */
  newPassword = "";
  setPasswordSubmitted = false;
  setPasswordLoading = false;
  setPasswordSuccess?: string;
  setPasswordError?: string;

  /* — Change password — */
  currentPassword = "";
  changeNewPassword = "";
  changePasswordSubmitted = false;
  changePasswordLoading = false;
  changePasswordSuccess?: string;
  changePasswordError?: string;

  /* — Weather — */
  favoriteCities: FavoriteCity[] = [];
  weatherLoading = false;

  readonly hero = {
    label: $localize`:profile.hero.label@@profileHeroLabel:Espace utilisateur`,
    title: $localize`:profile.hero.title@@profileHeroTitle:Votre profil`,
    description: $localize`:profile.hero.description@@profileHeroDescription:Gerez vos informations personnelles et vos parametres de securite.`,
  };

  ngOnInit(): void {
    if (this.authState.hasRole("weather")) {
      this.loadWeatherPreferences();
    }
  }

  /* ========================= EDIT PROFILE ========================= */

  /** Active le mode edition en pre-remplissant les champs avec les valeurs actuelles. */
  startEditing(): void {
    const user = this.authState.user();
    if (!user) return;
    this.editFirstName = user.firstName;
    this.editLastName = user.lastName;
    this.editPhone = user.phone ?? "";
    this.editProfileSuccess = undefined;
    this.editProfileError = undefined;
    this.isEditing.set(true);
  }

  /** Annule l'edition et revient en mode lecture. */
  cancelEditing(): void {
    this.isEditing.set(false);
    this.editProfileSuccess = undefined;
    this.editProfileError = undefined;
  }

  /** Enregistre les modifications du profil via le port auth. */
  saveProfile(): void {
    this.editProfileLoading = true;
    this.editProfileSuccess = undefined;
    this.editProfileError = undefined;

    handleFormSubmit(
      this.authService.updateProfile({
        firstName: this.editFirstName,
        lastName: this.editLastName,
        phone: this.editPhone || null,
      }),
      this.cdr,
      {
        fallbackError: $localize`:profile.edit.error.generic@@profileEditErrorGeneric:Impossible de mettre a jour le profil pour le moment.`,
        onSuccess: (updatedUser) => {
          this.authState.updateUser(updatedUser);
          this.editProfileSuccess = $localize`:profile.edit.success@@profileEditSuccess:Profil mis a jour avec succes.`;
          this.isEditing.set(false);
        },
        onError: (message) => {
          this.editProfileError = message;
          this.editProfileLoading = false;
        },
        onComplete: () => {
          this.editProfileLoading = false;
        },
      },
    );
  }

  /* ========================= SET PASSWORD ========================= */

  setPassword(form: NgForm): void {
    this.setPasswordSubmitted = true;
    this.setPasswordSuccess = undefined;
    this.setPasswordError = undefined;
    if (form.invalid) return;

    this.setPasswordLoading = true;

    handleFormSubmit(
      this.authService.setPassword({ newPassword: this.newPassword }),
      this.cdr,
      {
        fallbackError: $localize`:profile.password.error.generic@@profilePasswordErrorGeneric:Impossible de definir le mot de passe pour le moment.`,
        onSuccess: () => {
          this.setPasswordSuccess = $localize`:profile.password.success@@profilePasswordSuccess:Mot de passe defini avec succes.`;
          this.newPassword = "";
          form.resetForm({ newPassword: "" });
          this.setPasswordSubmitted = false;
          this.authState.restoreSession();
        },
        onError: (message) => {
          this.setPasswordError = message;
          this.setPasswordLoading = false;
        },
        onComplete: () => {
          this.setPasswordLoading = false;
        },
      },
    );
  }

  /* ========================= CHANGE PASSWORD ========================= */

  changePassword(form: NgForm): void {
    this.changePasswordSubmitted = true;
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
        onSuccess: () => {
          this.changePasswordSuccess = $localize`:profile.changePassword.success@@profileChangePasswordSuccess:Mot de passe modifie avec succes.`;
          this.currentPassword = "";
          this.changeNewPassword = "";
          form.resetForm({ currentPassword: "", changeNewPassword: "" });
          this.changePasswordSubmitted = false;
          this.authState.restoreSession();
        },
        onError: (message) => {
          this.changePasswordError = message;
          this.changePasswordLoading = false;
        },
        onComplete: () => {
          this.changePasswordLoading = false;
        },
      },
    );
  }

  /* ========================= WEATHER ========================= */

  removeFavoriteCity(city: FavoriteCity): void {
    this.favoriteCities = this.favoriteCities.filter(
      (c) => c.latitude !== city.latitude || c.longitude !== city.longitude,
    );
    this.weatherService
      .updatePreferences({ favoriteCities: this.favoriteCities })
      .subscribe();
  }

  /** Libelle lisible du niveau meteo. */
  levelLabel(level: string): string {
    const labels: Record<string, string> = {
      discovery: $localize`:profile.weather.level.discovery@@profileWeatherLevelDiscovery:Decouverte`,
      curious: $localize`:profile.weather.level.curious@@profileWeatherLevelCurious:Curieux`,
      expert: $localize`:profile.weather.level.expert@@profileWeatherLevelExpert:Expert`,
    };
    return labels[level] ?? level;
  }

  private loadWeatherPreferences(): void {
    this.weatherLoading = true;
    this.weatherService.getPreferences().subscribe({
      next: (prefs) => {
        this.favoriteCities = prefs.favoriteCities ?? [];
        this.levelService.level.set(prefs.level);
        this.levelService.daysUsed.set(prefs.daysUsed);
        this.weatherLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.weatherLoading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
