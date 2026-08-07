import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import type { CookieConsentPreferences } from '../../core/models/cookie-consent.model';
import { CookieConsentService } from '../../core/services/cookie-consent.service';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';

/**
 * Page « Préférences cookies ».
 *
 * Restyle Asili porté de `AsiliNewDesign/cookie-settings.html` + `asili-legal.css`
 * (`.lg-hero`, `.ck-list`, `.ck-item`, `.switch`, `.ck-actions`, `.ck-saved`).
 * Quatre catégories (Essentiels / Mesure d'audience / Préférences / Marketing)
 * branchées sur le modèle `CookieConsentPreferences` existant.
 *
 * IMPORTANT : la logique de consentement (`CookieConsentService`) est conservée
 * intégralement — le restyle est purement visuel. Les toggles sont liés aux
 * états `preferences.*` existants et les handlers `savePreferences()` /
 * `withdrawConsent()` appellent le service à l'identique. `acceptAll()` réutilise
 * le contrat `saveConsent(..., "accept_all")` du service (action déjà supportée
 * par le modèle), sans modifier la logique de persistance.
 */
@Component({
  selector: 'app-cookie-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RevealOnScrollDirective],
  templateUrl: './cookie-settings.component.html',
  styleUrl: './cookie-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookieSettingsComponent {
  private readonly consentService = inject(CookieConsentService);

  readonly hero = {
    kicker: $localize`:cookie.settings.hero.kicker@@cookieSettingsHeroLabel:Vos choix`,
    updated: $localize`:cookie.settings.hero.updated@@cookieSettingsMetaLastUpdated:Vous gardez la main — modifiable à tout moment`,
  };

  readonly intro = $localize`:cookie.settings.intro@@cookieSettingsIntro:On utilise le strict nécessaire pour que le site fonctionne, et rien de plus sans votre accord. Réglez chaque catégorie ci-dessous.`;

  readonly categories = {
    essential: {
      title: $localize`:cookie.settings.essential.title@@cookieSettingsPreferencesEssentialTitle:Essentiels`,
      description: $localize`:cookie.settings.essential.desc@@cookieSettingsPreferencesEssentialDesc:Indispensables au fonctionnement du site : connexion, sécurité, mémorisation de vos préférences. Ils ne peuvent pas être désactivés.`,
      tag: $localize`:cookie.settings.essential.tag@@cookieSettingsEssentialTag:Toujours actifs`,
    },
    analytics: {
      title: $localize`:cookie.settings.analytics.title@@cookieSettingsPreferencesAnalyticsTitle:Mesure d'audience`,
      description: $localize`:cookie.settings.analytics.desc@@cookieSettingsPreferencesAnalyticsDesc:Permettraient des statistiques anonymisées pour améliorer le site. L'app est en lancement : on n'en collecte aucune pour l'instant.`,
      tag: $localize`:cookie.settings.analytics.tag@@cookieSettingsAnalyticsTag:Non collecté`,
    },
    preferences: {
      title: $localize`:cookie.settings.preferences.title@@cookieSettingsPreferencesOptionalTitle:Préférences`,
      description: $localize`:cookie.settings.preferences.desc@@cookieSettingsPreferencesOptionalDesc:Mémorisent vos choix d'affichage (langue, réglages) pour une expérience plus fluide d'une visite à l'autre.`,
      tag: $localize`:cookie.settings.preferences.tag@@cookieSettingsPreferencesTag:Confort`,
    },
    marketing: {
      title: $localize`:cookie.settings.marketing.title@@cookieSettingsPreferencesMarketingTitle:Marketing`,
      description: $localize`:cookie.settings.marketing.desc@@cookieSettingsPreferencesMarketingDesc:Permettraient de mesurer l'efficacité de campagnes. Désactivés par défaut — l'app est en lancement, on n'en utilise pas.`,
      tag: $localize`:cookie.settings.marketing.tag@@cookieSettingsMarketingTag:Désactivé par défaut`,
    },
  };

  readonly actions = {
    save: $localize`:cookie.settings.actions.save@@cookieSettingsPreferencesSave:Enregistrer mes choix`,
    acceptAll: $localize`:cookie.settings.actions.acceptAll@@cookieSettingsAcceptAll:Tout accepter`,
    saved: $localize`:cookie.settings.actions.saved@@cookieSettingsPreferencesSaved:Préférences enregistrées`,
    error: $localize`:cookie.settings.actions.error@@cookieSettingsPreferencesError:Impossible d'enregistrer vos préférences pour le moment.`,
  };

  readonly privacyNote = {
    before: $localize`:cookie.settings.privacyNote.before@@cookieSettingsPrivacyNoteBefore:Pour en savoir plus, consultez notre`,
    link: $localize`:cookie.settings.privacyNote.link@@cookieSettingsPrivacyNoteLink:politique de confidentialité`,
  };

  /** Aria-labels des toggles (a11y). */
  readonly toggleAria = {
    essential: $localize`:cookie.settings.aria.essential@@cookieSettingsAriaEssential:Cookies essentiels`,
    analytics: $localize`:cookie.settings.aria.analytics@@cookieSettingsAriaAnalytics:Mesure d'audience`,
    preferences: $localize`:cookie.settings.aria.preferences@@cookieSettingsAriaPreferences:Préférences`,
    marketing: $localize`:cookie.settings.aria.marketing@@cookieSettingsAriaMarketing:Marketing`,
  };

  preferences: CookieConsentPreferences = this.consentService.getPreferences();
  statusMessage?: string;
  showSaved = false;
  isSaving = false;

  /** Enregistre les préférences courantes via le service (logique conservée). */
  savePreferences(): void {
    this.persist(this.consentService.saveConsent(this.preferences, 'settings', 'save_preferences'));
  }

  /**
   * Accepte les catégories réellement activables puis enregistre via le service.
   * Réutilise le contrat `saveConsent(..., "accept_all")` — pas de logique de
   * persistance nouvelle, seulement un état coché avant l'appel. `analytics` et
   * `marketing` restent à `false` : ils ne sont pas collectés (l'app est en
   * lancement) et le service les force de toute façon à `false` — on évite de
   * laisser croire à l'utilisateur qu'ils ont été activés.
   */
  acceptAll(): void {
    this.preferences = {
      essential: true,
      preferences: true,
      analytics: false,
      marketing: false,
    };
    this.persist(this.consentService.saveConsent(this.preferences, 'settings', 'accept_all'));
  }

  /**
   * Retire le consentement : réinitialise sur les valeurs par défaut puis
   * appelle le service (logique conservée à l'identique).
   */
  withdrawConsent(): void {
    const reset = this.consentService.getDefaultPreferences();
    this.preferences = { ...reset };
    this.persist(this.consentService.withdrawConsent());
  }

  /** Abonne un appel de consentement et reflète le résultat dans l'UI. */
  private persist(call: ReturnType<CookieConsentService['saveConsent']>): void {
    this.isSaving = true;
    this.statusMessage = undefined;
    this.showSaved = false;
    call.subscribe({
      next: (response) => {
        if (response?.httpCode === 201) {
          this.statusMessage = this.actions.saved;
          this.showSaved = true;
        } else {
          this.statusMessage = this.actions.error;
        }
      },
      error: () => {
        this.statusMessage = this.actions.error;
      },
      complete: () => {
        this.isSaving = false;
      },
    });
  }
}
