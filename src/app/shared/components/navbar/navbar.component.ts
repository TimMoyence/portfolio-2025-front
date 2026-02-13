import { CommonModule } from "@angular/common";
import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  signal,
  ViewChild,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { NavLink } from "../../models/navbar.model";
import { A11yDialogService } from "../../services/a11y-dialog.service";
import { SvgIconComponent } from "../svg-icon.component";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule, RouterModule, SvgIconComponent],
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.scss"],
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
  readonly dropdownChevronLabel = $localize`:navbar.dropdown.chevron|Chevron icon label@@navDropdownChevron:Ouvrir ou fermer la section`;

  // ?  Dropdown sections for the project menu
  // ? Add it when I have the page to present the project in detail
  // dropdownSections = signal<DropdownSection[]>([
  //   {
  //     label: $localize`:navbar.dropdown.projects.label|Dropdown section@@navDropdownProjectsLabel:Projets`,
  //     isOpen: false,
  //     items: [
  //       {
  //         title: $localize`:navbar.dropdown.projects.presq.title|Project link@@navDropdownPresqTitle:Projet Vincent`,
  //         description: $localize`:navbar.dropdown.projects.presq.desc|Project description@@navDropdownPresqDesc:Solution web personnalisée`,
  //         icon: 'planet',
  //         iconAlt: $localize`:navbar.dropdown.projects.presq.iconAlt|Icon alt text@@navDropdownPresqIconAlt:Icône pour un projet client`,
  //         href: '/client-project',
  //       },
  //       {
  //         title: $localize`:navbar.dropdown.projects.sebastian.title|Project link@@navDropdownSebastianTitle:Louisons`,
  //         description: $localize`:navbar.dropdown.projects.sebastian.desc|Project description@@navDropdownSebastianDesc:Site sur mesure pour Louisons`,
  //         icon: 'sebastian',
  //         iconAlt: $localize`:navbar.dropdown.projects.sebastian.iconAlt|Icon alt text@@navDropdownSebastianIconAlt:Icône pour un projet vitrine`,
  //         href: '/client-project',
  //       },
  //       {
  //         title: $localize`:navbar.dropdown.projects.personal.title|Project link@@navDropdownPersonalTitle:Portfolio`,
  //         description: $localize`:navbar.dropdown.projects.personal.desc|Project description@@navDropdownPersonalDesc:Explorations numériques et expériences`,
  //         icon: 'perso',
  //         iconAlt: $localize`:navbar.dropdown.projects.personal.iconAlt|Icon alt text@@navDropdownPersonalIconAlt:Icône représentant l'espace personnel`,
  //         href: '/presentation',
  //       },
  //       {
  //         title: $localize`:navbar.dropdown.projects.professional.title|Project link@@navDropdownProfessionalTitle:Projets clients`,
  //         description: $localize`:navbar.dropdown.projects.professional.desc|Project description@@navDropdownProfessionalDesc:Sites web pour clients et entreprises`,
  //         icon: 'business',
  //         iconAlt: $localize`:navbar.dropdown.projects.professional.iconAlt|Icon alt text@@navDropdownProfessionalIconAlt:Icône représentant le professionnel`,
  //         href: '/client-project',
  //       },
  //     ],
  //   },
  //   // {
  //   //   label: $localize`:navbar.dropdown.dev.label|Dropdown section@@navDropdownDevLabel:Développement`,
  //   //   isOpen: false,
  //   //   items: [
  //   //     {
  //   //       title: $localize`:navbar.dropdown.dev.appMuseum.title|Project link@@navDropdownAppMuseumTitle:App museum`,
  //   //       description: $localize`:navbar.dropdown.dev.appMuseum.desc|Project description@@navDropdownAppMuseumDesc:Expérience muséale interactive et immersive`,
  //   //       icon: 'museum',
  //   //       iconAlt: $localize`:navbar.dropdown.dev.appMuseum.iconAlt|Icon alt text@@navDropdownAppMuseumIconAlt:Icône représentant l'application museum`,
  //   //       href: '/offer',
  //   //     },
  //   //     {
  //   //       title: $localize`:navbar.dropdown.dev.weekAway.title|Project link@@navDropdownWeekAwayTitle:Week Away`,
  //   //       description: $localize`:navbar.dropdown.dev.weekAway.desc|Project description@@navDropdownWeekAwayDesc:Planification de voyages simplifiée`,
  //   //       icon: 'travel',
  //   //       iconAlt: $localize`:navbar.dropdown.dev.weekAway.iconAlt|Icon alt text@@navDropdownWeekAwayIconAlt:Icône représentant Week Away`,
  //   //       href: '/offer',
  //   //     },
  //   //     {
  //   //       title: $localize`:navbar.dropdown.dev.deathCounter.title|Project link@@navDropdownDeathCounterTitle:Death Counter`,
  //   //       description: $localize`:navbar.dropdown.dev.deathCounter.desc|Project description@@navDropdownDeathCounterDesc:Jeu de stratégie et de défi`,
  //   //       icon: 'death-counter',
  //   //       iconAlt: $localize`:navbar.dropdown.dev.deathCounter.iconAlt|Icon alt text@@navDropdownDeathCounterIconAlt:Icône représentant Death Counter`,
  //   //       href: '/presentation',
  //   //     },
  //   //     {
  //   //       title: $localize`:navbar.dropdown.dev.assassin.title|Project link@@navDropdownAssassinTitle:Assassin`,
  //   //       description: $localize`:navbar.dropdown.dev.assassin.desc|Project description@@navDropdownAssassinDesc:Enquête narrative et mystère`,
  //   //       icon: 'assassin',
  //   //       iconAlt: $localize`:navbar.dropdown.dev.assassin.iconAlt|Icon alt text@@navDropdownAssassinIconAlt:Icône représentant Assassin`,
  //   //       href: '/presentation',
  //   //     },
  //   //   ],
  //   // },
  // ]);

  scrolled = false;
  mobileMenuOpen = false;

  isMobile = false;
  currentlyHovered = signal<string | null>(null);

  @ViewChild("mobileMenuPanel", { static: false })
  mobileMenuPanel?: ElementRef<HTMLElement>;

  @ViewChild("burgerButton", { static: false })
  burgerButton?: ElementRef<HTMLButtonElement>;

  constructor(private a11yDialog: A11yDialogService) {}
  ngOnInit(): void {
    this.updateIsMobileState();
  }

  @HostListener("window:scroll", [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 50;
  }

  @HostListener("window:resize", [])
  onWindowResize() {
    this.updateIsMobileState();
  }

  @HostListener("document:keydown", ["$event"])
  handleGlobalKeydown(event: KeyboardEvent): void {
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

  // ? Gestion of the dropdown menus
  // openDropdownMenuAndToggleInMobile(label: string): void {
  //   if (!this.isMobile) this.currentlyHovered.set(label);

  //   this.dropdownSections.update((sections) =>
  //     sections.map((section) => {
  //       if (section.label !== label) {
  //         // Close other sections
  //         return { ...section, isOpen: false };
  //       }

  //       return {
  //         ...section,
  //         isOpen: this.isMobile ? !section.isOpen : true,
  //       };
  //     }),
  //   );
  // }

  // closeOnDesktopDropdownMenu(label: string): void {
  //   if (this.isMobile) return;
  //   setTimeout(() => {
  //     if (this.currentlyHovered() === label) {
  //       return;
  //     }
  //     this.dropdownSections.update((sections) =>
  //       sections.map((section) =>
  //         section.label === label ? { ...section, isOpen: false } : section,
  //       ),
  //     );
  //   }, 150);
  // }

  /**
   * Called on the burger button click.
   */
  openMobileMenu(): void {
    if (this.mobileMenuOpen) return this.closeMobileMenu();

    this.mobileMenuOpen = true;
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
    this.mobileMenuOpen = false;
    document.body.style.overflow = "";

    // ? Close all dropdowns when menu closes
    // this.dropdownSections.update((sections) =>
    //   sections.map((s) => ({ ...s, isOpen: false })),
    // );

    // Restore focus to what opened the menu (e.g. burger button)
    this.a11yDialog.restoreFocus();
  }

  getIconAriaLabel(title: string): string {
    return $localize`:navbar.icon.dynamicLabel|Icon label with item title@@navbarIconLabel:Icône pour ${title}:navItemTitle:.`;
  }

  private updateIsMobileState(): void {
    if (typeof window === "undefined") return;

    const isMobileViewport = window.innerWidth < 1024;

    if (this.isMobile === isMobileViewport) return;

    this.isMobile = isMobileViewport;

    if (!this.isMobile) {
      this.mobileMenuOpen = false;
      document.body.style.overflow = "";
      // ? Close all dropdowns when switching to desktop
      // this.dropdownSections.update((sections) =>
      //   sections.map((section) => ({ ...section, isOpen: false })),
      // );
    }
  }
}
