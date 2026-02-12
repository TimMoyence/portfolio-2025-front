import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { Subscription } from "rxjs";
import { CookieConsentService } from "../../../core/services/cookie-consent.service";

@Component({
  selector: "app-cookie-banner",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./cookie-banner.component.html",
  styleUrl: "./cookie-banner.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookieBannerComponent implements OnInit, OnDestroy {
  isVisible = false;
  private subscription?: Subscription;

  readonly content = {
    message: $localize`:cookie.banner.message|Cookie banner message@@cookieBannerMessage:Nous utilisons des cookies essentiels pour faire fonctionner le site et mémoriser vos choix. Aucun cookie analytique ou marketing n’est activé sans votre accord.`,
    settingsLabel: $localize`:cookie.banner.settings|Cookie banner settings link@@cookieBannerSettings:Paramètres des cookies`,
    acceptAll: $localize`:cookie.banner.acceptAll|Cookie banner accept all@@cookieBannerAcceptAll:Tout accepter`,
    essentialOnly: $localize`:cookie.banner.essentialOnly|Cookie banner essential only@@cookieBannerEssentialOnly:Essentiels uniquement`,
  };

  constructor(private readonly consentService: CookieConsentService) {}

  ngOnInit(): void {
    this.updateVisibility();
    this.subscription = this.consentService.consentChanges$.subscribe(() => {
      this.updateVisibility();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
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
