import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CookieConsentPreferences } from "../../core/models/cookie-consent.model";
import { CookieConsentService } from "../../core/services/cookie-consent.service";
import { HeroSectionComponent } from "../../shared/components/hero-section/hero-section.component";

interface ComplianceSection {
  title: string;
  intro: string;
  items: string[];
}

@Component({
  selector: "app-cookie-settings",
  standalone: true,
  imports: [CommonModule, FormsModule, HeroSectionComponent],
  templateUrl: "./cookie-settings.component.html",
  styleUrl: "./cookie-settings.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookieSettingsComponent {
  private readonly consentService = inject(CookieConsentService);

  readonly hero = {
    label: $localize`:cookie.settings.hero.label@@cookieSettingsHeroLabel:Conformité & Cookies`,
    title: $localize`:cookie.settings.hero.title@@cookieSettingsHeroTitle:Vos choix de confidentialité`,
    description: $localize`:cookie.settings.hero.description@@cookieSettingsHeroDescription:Retrouvez ici les informations GDPR et gérez vos préférences de cookies pour l'Union européenne et le Royaume-Uni.`,
  };

  readonly meta = {
    lastUpdated: $localize`:cookie.settings.meta.lastUpdated@@cookieSettingsMetaLastUpdated:Dernière mise à jour : 11 février 2026`,
    version: $localize`:cookie.settings.meta.version@@cookieSettingsMetaVersion:Version de la politique : 2026-02-11`,
    regionNote: $localize`:cookie.settings.meta.region@@cookieSettingsMetaRegion:Ce dispositif s'applique aux visiteurs de l'Union européenne et du Royaume-Uni.`,
  };

  readonly sections: ComplianceSection[] = [
    {
      title: $localize`:cookie.settings.section.gdpr.title@@cookieSettingsGdprTitle:Conformité GDPR (UE & Royaume-Uni)`,
      intro: $localize`:cookie.settings.section.gdpr.intro@@cookieSettingsGdprIntro:Nous traitons les données personnelles de manière transparente, limitée et sécurisée.`,
      items: [
        $localize`:cookie.settings.section.gdpr.item1@@cookieSettingsGdprItem1:Les données collectées sont strictement nécessaires aux finalités annoncées.`,
        $localize`:cookie.settings.section.gdpr.item2@@cookieSettingsGdprItem2:Le consentement est libre, spécifique, informé et peut être retiré à tout moment.`,
        $localize`:cookie.settings.section.gdpr.item3@@cookieSettingsGdprItem3:Les durées de conservation sont limitées et documentées.`,
        $localize`:cookie.settings.section.gdpr.item4@@cookieSettingsGdprItem4:Vous pouvez demander l'accès, la rectification ou la suppression de vos données.`,
      ],
    },
    {
      title: $localize`:cookie.settings.section.cookies.title@@cookieSettingsCookiesTitle:Gestion des cookies`,
      intro: $localize`:cookie.settings.section.cookies.intro@@cookieSettingsCookiesIntro:Nous utilisons uniquement les cookies nécessaires au fonctionnement du site et à la gestion de vos choix.`,
      items: [
        $localize`:cookie.settings.section.cookies.item1@@cookieSettingsCookiesItem1:Cookies essentiels : indispensables pour le fonctionnement et la sécurité.`,
        $localize`:cookie.settings.section.cookies.item2@@cookieSettingsCookiesItem2:Cookies de préférences : optionnels, pour améliorer l'expérience.`,
        $localize`:cookie.settings.section.cookies.item3@@cookieSettingsCookiesItem3:Cookies analytiques et marketing : non utilisés sur ce site pour le moment.`,
        $localize`:cookie.settings.section.cookies.item4@@cookieSettingsCookiesItem4:Aucun cookie non essentiel n'est déposé sans votre accord.`,
      ],
    },
    {
      title: $localize`:cookie.settings.section.logic.title@@cookieSettingsLogicTitle:Logique conditionnelle & activation`,
      intro: $localize`:cookie.settings.section.logic.intro@@cookieSettingsLogicIntro:Les cookies non essentiels restent désactivés tant que vous n'avez pas donné votre accord.`,
      items: [
        $localize`:cookie.settings.section.logic.item1@@cookieSettingsLogicItem1:Le bandeau de consentement s'affiche pour les visiteurs UE/Royaume-Uni.`,
        $localize`:cookie.settings.section.logic.item2@@cookieSettingsLogicItem2:Les scripts non essentiels sont bloqués jusqu'à consentement.`,
        $localize`:cookie.settings.section.logic.item3@@cookieSettingsLogicItem3:Vous pouvez modifier ou retirer votre choix depuis cette page.`,
      ],
    },
    {
      title: $localize`:cookie.settings.section.i18n.title@@cookieSettingsI18nTitle:Internationalisation`,
      intro: $localize`:cookie.settings.section.i18n.intro@@cookieSettingsI18nIntro:Les informations de confidentialité sont présentées en français et en anglais avec un sens juridique équivalent.`,
      items: [
        $localize`:cookie.settings.section.i18n.item1@@cookieSettingsI18nItem1:Les notices et politiques sont affichées dans la langue de l'interface.`,
        $localize`:cookie.settings.section.i18n.item2@@cookieSettingsI18nItem2:Les versions traduites sont alignées sur la version de référence.`,
        $localize`:cookie.settings.section.i18n.item3@@cookieSettingsI18nItem3:La version affichée est enregistrée lors du consentement.`,
      ],
    },
    {
      title: $localize`:cookie.settings.section.audit.title@@cookieSettingsAuditTitle:Documentation & traçabilité`,
      intro: $localize`:cookie.settings.section.audit.intro@@cookieSettingsAuditIntro:Nous conservons des preuves de consentement pour répondre aux exigences d'audit.`,
      items: [
        $localize`:cookie.settings.section.audit.item1@@cookieSettingsAuditItem1:Journalisation de la date, de la version, de la langue et des catégories.`,
        $localize`:cookie.settings.section.audit.item2@@cookieSettingsAuditItem2:Les traces de consentement sont conservées pour démontrer la conformité.`,
        $localize`:cookie.settings.section.audit.item3@@cookieSettingsAuditItem3:Tout retrait de consentement est enregistré.`,
      ],
    },
  ];

  readonly preferenceLabels = {
    title: $localize`:cookie.settings.preferences.title@@cookieSettingsPreferencesTitle:Vos préférences cookies`,
    description: $localize`:cookie.settings.preferences.description@@cookieSettingsPreferencesDescription:Vous pouvez ajuster vos choix à tout moment.`,
    essential: {
      title: $localize`:cookie.settings.preferences.essential.title@@cookieSettingsPreferencesEssentialTitle:Essentiels (obligatoires)`,
      description: $localize`:cookie.settings.preferences.essential.desc@@cookieSettingsPreferencesEssentialDesc:Nécessaires au fonctionnement du site et à la mémorisation de votre choix.`,
    },
    preferences: {
      title: $localize`:cookie.settings.preferences.preferences.title@@cookieSettingsPreferencesOptionalTitle:Préférences`,
      description: $localize`:cookie.settings.preferences.preferences.desc@@cookieSettingsPreferencesOptionalDesc:Permettent d'améliorer votre expérience (langue, affichage).`,
    },
    analytics: {
      title: $localize`:cookie.settings.preferences.analytics.title@@cookieSettingsPreferencesAnalyticsTitle:Analytique (désactivé)`,
      description: $localize`:cookie.settings.preferences.analytics.desc@@cookieSettingsPreferencesAnalyticsDesc:Aucun outil de mesure d'audience n'est actif actuellement.`,
    },
    marketing: {
      title: $localize`:cookie.settings.preferences.marketing.title@@cookieSettingsPreferencesMarketingTitle:Marketing (désactivé)`,
      description: $localize`:cookie.settings.preferences.marketing.desc@@cookieSettingsPreferencesMarketingDesc:Aucun suivi publicitaire n'est actif actuellement.`,
    },
    save: $localize`:cookie.settings.preferences.save@@cookieSettingsPreferencesSave:Enregistrer mes préférences`,
    withdraw: $localize`:cookie.settings.preferences.withdraw@@cookieSettingsPreferencesWithdraw:Retirer mon consentement`,
    saved: $localize`:cookie.settings.preferences.saved@@cookieSettingsPreferencesSaved:Vos préférences ont été enregistrées.`,
    error: $localize`:cookie.settings.preferences.error@@cookieSettingsPreferencesError:Impossible d'enregistrer vos préférences pour le moment.`,
  };

  preferences: CookieConsentPreferences = this.consentService.getPreferences();
  statusMessage?: string;
  isSaving = false;

  savePreferences(): void {
    this.isSaving = true;
    this.statusMessage = undefined;
    this.consentService
      .saveConsent(this.preferences, "settings", "save_preferences")
      .subscribe({
        next: (response) => {
          this.statusMessage =
            response?.httpCode === 201
              ? this.preferenceLabels.saved
              : this.preferenceLabels.error;
        },
        error: () => {
          this.statusMessage = this.preferenceLabels.error;
        },
        complete: () => {
          this.isSaving = false;
        },
      });
  }

  withdrawConsent(): void {
    this.isSaving = true;
    this.statusMessage = undefined;
    const reset = this.consentService.getDefaultPreferences();
    this.preferences = { ...reset };
    this.consentService.withdrawConsent().subscribe({
      next: (response) => {
        this.statusMessage =
          response?.httpCode === 201
            ? this.preferenceLabels.saved
            : this.preferenceLabels.error;
      },
      error: () => {
        this.statusMessage = this.preferenceLabels.error;
      },
      complete: () => {
        this.isSaving = false;
      },
    });
  }
}
