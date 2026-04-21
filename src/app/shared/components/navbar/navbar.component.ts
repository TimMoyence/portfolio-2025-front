import { CommonModule, isPlatformBrowser } from "@angular/common";
import type { ElementRef } from "@angular/core";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  HostListener,
  Inject,
  LOCALE_ID,
  PLATFORM_ID,
  ViewChild,
  inject,
} from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { BreakpointService } from "../../../core/services/breakpoint.service";
import { AuthStateService } from "../../../core/services/auth-state.service";
import type { DropdownSection, NavLink } from "../../models/navbar.model";
import { A11yDialogService } from "../../services/a11y-dialog.service";
import { SvgIconComponent } from "../svg-icon.component";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule, RouterModule, SvgIconComponent],
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  readonly navLinks: NavLink[] = [
    {
      label: $localize`:navbar.link.presentation|Navbar primary link@@navLinkPresentation:Présentation`,
      href: "/presentation",
    },
    {
      label: $localize`:navbar.link.projects|Navbar primary link@@navLinkProjects:Projets`,
      href: "/client-project",
    },
    {
      label: $localize`:navbar.link.offer|Navbar primary link@@navLinkOfferSpan:Offres`,
      href: "/offer",
    },
  ];

  /** Dropdown "L'Atelier" regroupant les side-projects. */
  readonly atelierDropdown: DropdownSection = {
    label: $localize`:navbar.atelier.label|Atelier dropdown label@@navAtelierLabel:L'Atelier`,
    isOpen: false,
    items: [
      {
        title: $localize`:navbar.atelier.meteo.title|@@navAtelierMeteoTitle:Météo`,
        description: $localize`:navbar.atelier.meteo.desc|@@navAtelierMeteoDesc:Explorez la météo en temps réel`,
        icon: "cloud",
        iconAlt: "Météo",
        href: "/atelier/meteo",
      },
      {
        title: $localize`:navbar.atelier.budget.title|@@navAtelierBudgetTitle:Budget`,
        description: $localize`:navbar.atelier.budget.desc|@@navAtelierBudgetDesc:Gérez votre budget à deux`,
        icon: "business",
        iconAlt: "Budget",
        href: "/atelier/budget",
      },
      {
        title: $localize`:navbar.atelier.sebastian.title|@@navAtelierSebastianTitle:Sebastian`,
        description: $localize`:navbar.atelier.sebastian.desc|@@navAtelierSebastianDesc:Votre majordome personnel`,
        icon: "sebastian",
        iconAlt: "Sebastian",
        href: "/atelier/sebastian",
      },
    ],
  };

  /** Dropdown "Formations" regroupant les presentations et ressources. */
  readonly formationsDropdown: DropdownSection = {
    label: $localize`:navbar.formations.label|Formations dropdown label@@navFormationsLabel:Formations`,
    isOpen: false,
    items: [
      {
        title: $localize`:navbar.formations.ia.title|@@navFormationsIaTitle:IA pour Solopreneurs`,
        description: $localize`:navbar.formations.ia.desc|@@navFormationsIaDesc:Panorama des outils IA pour entrepreneurs`,
        icon: "sparkles",
        iconAlt: "IA",
        href: "/formations/ia-solopreneurs",
      },
      {
        title: $localize`:navbar.formations.auto.title|@@navFormationsAutoTitle:Automatiser avec l'IA`,
        description: $localize`:navbar.formations.auto.desc|@@navFormationsAutoDesc:5 workflows non-tech pour gagner 2h/semaine`,
        icon: "sparkles",
        iconAlt: "Automation",
        href: "/formations/automatiser-avec-ia",
      },
      {
        title: $localize`:navbar.formations.seo.title|@@navFormationsSeoTitle:Audit SEO DIY`,
        description: $localize`:navbar.formations.seo.desc|@@navFormationsSeoDesc:7 checks en 20 min avec 5 outils gratuits`,
        icon: "sparkles",
        iconAlt: "SEO",
        href: "/formations/audit-seo-diy",
      },
      {
        title: $localize`:navbar.formations.all.title|@@navFormationsAllTitle:Toutes les formations`,
        description: $localize`:navbar.formations.all.desc|@@navFormationsAllDesc:Voir le catalogue complet`,
        icon: "sparkles",
        iconAlt: "Liste",
        href: "/formations",
      },
    ],
  };

  readonly openMenuLabel = $localize`:navbar.menu.open|Burger button label@@navMenuOpen:Ouvrir le menu principal`;
  readonly closeMenuLabel = $localize`:navbar.menu.close|Burger button label@@navMenuClose:Fermer le menu principal`;
  readonly mobileNavHeading = $localize`:navbar.menu.heading|Mobile nav heading@@navMenuHeading:Menu principal`;
  readonly closeMenuIconLabel = $localize`:navbar.menu.icon.close|Icon label@@navMenuCloseIcon:Fermer le menu`;
  readonly openMenuIconLabel = $localize`:navbar.menu.icon.open|Icon label@@navMenuOpenIcon:Ouvrir le menu`;
  readonly currentLocale = inject(LOCALE_ID);
  readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly breakpointService = inject(BreakpointService);

  /** Initiales de l'utilisateur connecte (ex: "TM" pour Tim Moyence). */
  readonly userInitials = computed(() => {
    const user = this.authState.user();
    if (!user?.firstName && !user?.lastName) return "";
    const first = (user.firstName ?? "").charAt(0).toUpperCase();
    const last = (user.lastName ?? "").charAt(0).toUpperCase();
    return `${first}${last}`;
  });

  /** Couleur d'avatar derivee d'un hash simple du nom complet. */
  readonly avatarColor = computed(() => {
    const user = this.authState.user();
    if (!user) return "#6b7280"; // gray fallback
    const name = `${user.firstName ?? ""}${user.lastName ?? ""}`;
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 55%, 45%)`;
  });

  scrolled = false;
  mobileMenuOpen = false;
  userDropdownOpen = false;

  /** Delegue au BreakpointService (< 1024px). */
  get isMobile(): boolean {
    return this.breakpointService.isTabletOrBelow();
  }

  @ViewChild("mobileMenuPanel", { static: false })
  mobileMenuPanel?: ElementRef<HTMLElement>;

  @ViewChild("burgerButton", { static: false })
  burgerButton?: ElementRef<HTMLButtonElement>;

  constructor(
    private a11yDialog: A11yDialogService,
    private readonly cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {
    // Ferme le menu mobile si on passe en mode desktop
    effect(() => {
      const mobile = this.isMobile;
      if (!mobile && this.mobileMenuOpen) {
        this.mobileMenuOpen = false;
        if (isPlatformBrowser(this.platformId)) {
          document.body.style.overflow = "";
        }
        this.cdr.markForCheck();
      }
    });

    // Force le re-render quand l'etat auth change.
    // Necessaire car ngSkipHydration (ajoute par Angular SSR) empeche
    // les signal reads dans les ngTemplateOutlet embedded views de
    // declencher correctement markForCheck sur le composant hote.
    effect(() => {
      this.authState.isLoggedIn();
      this.authState.user();
      this.cdr.markForCheck();
    });
  }

  /** Retourne l'URL vers l'autre locale en conservant le chemin courant. */
  getAlternateLocaleUrl(): string {
    if (!isPlatformBrowser(this.platformId)) return "#";
    const targetLocale = this.currentLocale.startsWith("fr") ? "en" : "fr";
    const currentPath = window.location.pathname;
    const pathWithoutLocale = currentPath.replace(/^\/(fr|en)/, "");
    return `/${targetLocale}${pathWithoutLocale || ""}`;
  }

  /** Retourne le label de la langue alternative. */
  getAlternateLocaleLabel(): string {
    return this.currentLocale.startsWith("fr") ? "EN" : "FR";
  }

  @HostListener("window:scroll", [])
  onWindowScroll() {
    if (!isPlatformBrowser(this.platformId)) return;
    const wasScrolled = this.scrolled;
    this.scrolled = window.scrollY > 50;
    if (this.scrolled !== wasScrolled) {
      this.cdr.markForCheck();
    }
  }

  logout(): void {
    this.closeUserDropdown();
    this.authState.logout();
    this.closeMobileMenu();
    void this.router.navigate(["/"]);
  }

  /** Ouvre ou ferme le dropdown utilisateur. */
  toggleUserDropdown(): void {
    this.userDropdownOpen = !this.userDropdownOpen;
    this.cdr.markForCheck();
  }

  /** Ferme le dropdown utilisateur s'il est ouvert. */
  closeUserDropdown(): void {
    if (this.userDropdownOpen) {
      this.userDropdownOpen = false;
      this.cdr.markForCheck();
    }
  }

  /** Ouvre ou ferme le dropdown Atelier. */
  toggleAtelierDropdown(): void {
    this.atelierDropdown.isOpen = !this.atelierDropdown.isOpen;
    this.cdr.markForCheck();
  }

  /** Ouvre le dropdown Atelier. */
  openAtelierDropdown(): void {
    if (!this.atelierDropdown.isOpen) {
      this.atelierDropdown.isOpen = true;
      this.cdr.markForCheck();
    }
  }

  /** Ferme le dropdown Atelier s'il est ouvert. */
  closeAtelierDropdown(): void {
    if (this.atelierDropdown.isOpen) {
      this.atelierDropdown.isOpen = false;
      this.cdr.markForCheck();
    }
  }

  /** Ouvre ou ferme le dropdown Formations. */
  toggleFormationsDropdown(): void {
    this.formationsDropdown.isOpen = !this.formationsDropdown.isOpen;
    this.cdr.markForCheck();
  }

  /** Ouvre le dropdown Formations. */
  openFormationsDropdown(): void {
    if (!this.formationsDropdown.isOpen) {
      this.formationsDropdown.isOpen = true;
      this.cdr.markForCheck();
    }
  }

  /** Ferme le dropdown Formations s'il est ouvert. */
  closeFormationsDropdown(): void {
    if (this.formationsDropdown.isOpen) {
      this.formationsDropdown.isOpen = false;
      this.cdr.markForCheck();
    }
  }

  @HostListener("document:keydown", ["$event"])
  handleGlobalKeydown(event: KeyboardEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const activeElement = document.activeElement as HTMLElement | null;
    const isSpace =
      event.key === " " || event.key === "Spacebar" || event.code === "Space";

    // 1) SPACE on burger button: open menu + prevent scroll
    if (activeElement === this.burgerButton?.nativeElement && isSpace) {
      event.preventDefault();
      event.stopPropagation();
      this.openMobileMenu();
      return;
    }

    // 2) ESC closes dropdowns if open
    if (event.key === "Escape") {
      if (this.userDropdownOpen) {
        event.preventDefault();
        this.closeUserDropdown();
        return;
      }
      if (this.atelierDropdown.isOpen) {
        event.preventDefault();
        this.closeAtelierDropdown();
        return;
      }
      if (this.formationsDropdown.isOpen) {
        event.preventDefault();
        this.closeFormationsDropdown();
        return;
      }
    }

    // 3) When mobile menu is open: ESC and Tab inside dialog
    if (this.mobileMenuOpen) {
      if (event.key === "Escape") {
        event.preventDefault();
        this.closeMobileMenu();
        return;
      }

      if (event.key === "Tab") {
        this.a11yDialog.trapFocus(
          event,
          this.mobileMenuPanel?.nativeElement ?? null,
        );
      }
    }
  }

  /**
   * Called on the burger button click.
   */
  openMobileMenu(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.mobileMenuOpen) return this.closeMobileMenu();

    this.mobileMenuOpen = true;
    this.cdr.markForCheck();
    document.body.style.overflow = "hidden";

    // Save current focus (usually the burger button)
    this.a11yDialog.saveFocus();

    // After the view updates, move focus inside the dialog
    requestAnimationFrame(() => {
      const panel = this.mobileMenuPanel?.nativeElement ?? null;
      this.a11yDialog.focusFirstDescendant(panel);
    });
  }

  /**
   * Called by the close button, backdrop click or Esc key.
   */
  closeMobileMenu(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.mobileMenuOpen = false;
    this.cdr.markForCheck();
    document.body.style.overflow = "";

    // Restore focus to what opened the menu (e.g. burger button)
    this.a11yDialog.restoreFocus();
  }
}
