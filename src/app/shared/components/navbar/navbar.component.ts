import { CommonModule, isPlatformBrowser } from "@angular/common";
import type { ElementRef, OnInit } from "@angular/core";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  Inject,
  PLATFORM_ID,
  ViewChild,
  inject,
} from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { AuthStateService } from "../../../core/services/auth-state.service";
import type { NavLink } from "../../models/navbar.model";
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
export class NavbarComponent implements OnInit {
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

  readonly openMenuLabel = $localize`:navbar.menu.open|Burger button label@@navMenuOpen:Ouvrir le menu principal`;
  readonly closeMenuLabel = $localize`:navbar.menu.close|Burger button label@@navMenuClose:Fermer le menu principal`;
  readonly mobileNavHeading = $localize`:navbar.menu.heading|Mobile nav heading@@navMenuHeading:Menu principal`;
  readonly closeMenuIconLabel = $localize`:navbar.menu.icon.close|Icon label@@navMenuCloseIcon:Fermer le menu`;
  readonly openMenuIconLabel = $localize`:navbar.menu.icon.open|Icon label@@navMenuOpenIcon:Ouvrir le menu`;
  readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  scrolled = false;
  mobileMenuOpen = false;

  isMobile = false;

  @ViewChild("mobileMenuPanel", { static: false })
  mobileMenuPanel?: ElementRef<HTMLElement>;

  @ViewChild("burgerButton", { static: false })
  burgerButton?: ElementRef<HTMLButtonElement>;

  constructor(
    private a11yDialog: A11yDialogService,
    private readonly cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}
  ngOnInit(): void {
    this.updateIsMobileState();
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

  @HostListener("window:resize", [])
  onWindowResize() {
    this.updateIsMobileState();
  }

  logout(): void {
    this.authState.logout();
    this.closeMobileMenu();
    void this.router.navigate(["/"]);
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

    // 2) When mobile menu is open: ESC and Tab inside dialog
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

  private updateIsMobileState(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const isMobileViewport = window.innerWidth < 1024;

    if (this.isMobile === isMobileViewport) return;

    this.isMobile = isMobileViewport;

    if (!this.isMobile) {
      this.mobileMenuOpen = false;
      document.body.style.overflow = "";
    }
    this.cdr.markForCheck();
  }
}
