import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterModule } from "@angular/router";
import { CookieConsentService } from "../../../core/services/cookie-consent.service";

@Component({
  selector: "app-cookie-banner",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./cookie-banner.component.html",
  styleUrl: "./cookie-banner.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookieBannerComponent {
  isVisible = false;
  private readonly consentService = inject(CookieConsentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly content = {
    message: $localize`:cookie.banner.message|Cookie banner message@@cookieBannerMessage:Nous utilisons des cookies essentiels pour faire fonctionner le site et mémoriser vos choix. Aucun cookie analytique ou marketing n’est activé sans votre accord.`,
    settingsLabel: $localize`:cookie.banner.settings|Cookie banner settings link@@cookieBannerSettings:Paramètres des cookies`,
    acceptAll: $localize`:cookie.banner.acceptAll|Cookie banner accept all@@cookieBannerAcceptAll:Tout accepter`,
    essentialOnly: $localize`:cookie.banner.essentialOnly|Cookie banner essential only@@cookieBannerEssentialOnly:Essentiels uniquement`,
  };

  constructor() {
    this.updateVisibility();
    this.consentService.consentChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateVisibility();
      });
  }

  acceptAll(): void {
    this.consentService
      .saveConsent(
        {
          essential: true,
          preferences: true,
          analytics: false,
          marketing: false,
        },
        "banner",
        "accept_all",
      )
      .subscribe({
        next: () => this.updateVisibility(),
        error: () => this.updateVisibility(),
      });
  }

  acceptEssentialOnly(): void {
    this.consentService
      .saveConsent(
        {
          essential: true,
          preferences: false,
          analytics: false,
          marketing: false,
        },
        "banner",
        "essential_only",
      )
      .subscribe({
        next: () => this.updateVisibility(),
        error: () => this.updateVisibility(),
      });
  }

  private updateVisibility(): void {
    this.isVisible = this.consentService.shouldShowBanner();
  }
}
