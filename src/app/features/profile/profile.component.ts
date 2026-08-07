import { CommonModule } from '@angular/common';
import type { OnInit } from '@angular/core';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { NgForm } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import type { FavoriteCity } from '../../core/models/weather.model';
import type { AuthPort } from '../../core/ports/auth.port';
import { AUTH_PORT } from '../../core/ports/auth.port';
import { AuthStateService } from '../../core/services/auth-state.service';
import type { WeatherPort } from '../../core/ports/weather.port';
import { WEATHER_PORT } from '../../core/ports/weather.port';
import { WeatherLevelService } from '../weather/services/weather-level.service';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import { handleFormSubmit } from '../../shared/utils/form-submit.utils';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RevealOnScrollDirective],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  providers: [WeatherLevelService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private readonly authService: AuthPort = inject(AUTH_PORT);
  readonly authState = inject(AuthStateService);
  readonly levelService = inject(WeatherLevelService);
  private readonly weatherService: WeatherPort = inject(WEATHER_PORT);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  isEditing = signal(false);
  editFirstName = '';
  editLastName = '';
  editPhone = '';
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

  favoriteCities: FavoriteCity[] = [];
  weatherLoading = false;

  ngOnInit(): void {
    if (this.authState.hasRole('weather')) {
      this.loadWeatherPreferences();
    }
  }

  initial(firstName?: string, lastName?: string, email?: string): string {
    const source = firstName || lastName || email || '?';
    return source.charAt(0).toUpperCase();
  }

  logout(): void {
    this.authState.logout();
    void this.router.navigate(['/']);
  }

  startEditing(): void {
    const user = this.authState.user();
    if (!user) return;
    this.editFirstName = user.firstName;
    this.editLastName = user.lastName;
    this.editPhone = user.phone ?? '';
    this.editProfileSuccess = undefined;
    this.editProfileError = undefined;
    this.isEditing.set(true);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
    this.editProfileSuccess = undefined;
    this.editProfileError = undefined;
  }

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

  setPassword(form: NgForm): void {
    this.setPasswordSubmitted = true;
    this.setPasswordSuccess = undefined;
    this.setPasswordError = undefined;
    if (form.invalid) return;

    this.setPasswordLoading = true;

    handleFormSubmit(this.authService.setPassword({ newPassword: this.newPassword }), this.cdr, {
      fallbackError: $localize`:profile.password.error.generic@@profilePasswordErrorGeneric:Impossible de definir le mot de passe pour le moment.`,
      onSuccess: () => {
        this.setPasswordSuccess = $localize`:profile.password.success@@profilePasswordSuccess:Mot de passe defini avec succes.`;
        this.newPassword = '';
        form.resetForm({ newPassword: '' });
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
    });
  }

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
          this.currentPassword = '';
          this.changeNewPassword = '';
          form.resetForm({ currentPassword: '', changeNewPassword: '' });
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

  removeFavoriteCity(city: FavoriteCity): void {
    const previous = this.favoriteCities;
    this.favoriteCities = this.favoriteCities.filter(
      (c) => c.latitude !== city.latitude || c.longitude !== city.longitude,
    );
    this.weatherService
      .updatePreferences({ favoriteCities: this.favoriteCities })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          this.favoriteCities = previous;
          this.cdr.markForCheck();
        },
      });
  }

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
