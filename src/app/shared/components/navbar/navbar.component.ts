import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { A11yDialogService } from '../../services/a11y-dialog.service';
import { SvgIconComponent } from '../svg-icon.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, SvgIconComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  readonly navLinks: NavLink[] = [
    { label: 'Accueil', href: '/' },
    { label: 'Cours', href: '/cours' },
    { label: 'Présentation', href: '/presentation' },
  ];

  dropdownSections = signal<DropdownSection[]>([
    {
      label: 'Projets',
      isOpen: false,
      items: [
        {
          title: 'PresQ',
          description: 'Plateforme de questionnaires interactifs',
          icon: 'planet',
          iconAlt:
            'Presque un icon pour une marque qui fait presque les choses',
          href: 'PresQ',
        },
        {
          title: 'Sebastian',
          description: 'Suivi de consommation et conseils',
          icon: 'sebastian',
          iconAlt: 'Sebastien majordome',
          href: 'Sebastian',
        },
        {
          title: 'Personnel',
          description: 'Explorations numériques et expériences',
          icon: 'perso',
          iconAlt: 'Icon representant le personnel',
          href: 'Personnel',
        },
        {
          title: 'Professionnel',
          description: 'Sites web pour clients et entreprises',
          icon: 'business',
          iconAlt: 'Icon representant le professionnel',
          href: 'Professionnel',
        },
      ],
    },
    {
      label: 'Développement',
      isOpen: false,
      items: [
        {
          title: 'App museum',
          description: 'Expérience muséale interactive et immersive',
          icon: 'museum',
          iconAlt: "représentation de l'application museum",
          href: 'App museum',
        },
        {
          title: 'Week Away',
          description: 'Planification de voyages simplifiée',
          icon: 'travel',
          iconAlt: 'icon de représentation de week away',
          href: 'Week Away',
        },
        {
          title: 'Death Counter',
          description: 'Jeu de stratégie et de défi',
          icon: 'death-counter',
          iconAlt: 'Icon representant le death counter',
          href: 'Death Counter',
        },
        {
          title: 'Assassin',
          description: 'Enquête narrative et mystère',
          icon: 'assassin',
          iconAlt: "Icon representant l'assassin",
          href: 'Assassin',
        },
      ],
    },
  ]);

  scrolled = false;
  mobileMenuOpen = false;

  isMobile = false;
  currentlyHovered = signal<string | null>(null);

  @ViewChild('mobileMenuPanel', { static: false })
  mobileMenuPanel?: ElementRef<HTMLElement>;

  @ViewChild('burgerButton', { static: false })
  burgerButton?: ElementRef<HTMLButtonElement>;

  constructor(private a11yDialog: A11yDialogService) {}
  ngOnInit(): void {
    this.updateIsMobileState();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 50;
  }

  @HostListener('window:resize', [])
  onWindowResize() {
    this.updateIsMobileState();
  }

  @HostListener('document:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent): void {
    const activeElement = document.activeElement as HTMLElement | null;
    const isSpace =
      event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space';

    // 1) SPACE on burger button: open menu + prevent scroll
    if (activeElement === this.burgerButton?.nativeElement && isSpace) {
      event.preventDefault();
      event.stopPropagation();
      this.openMobileMenu();
      return;
    }

    // 2) When mobile menu is open: ESC and Tab inside dialog
    if (this.mobileMenuOpen) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeMobileMenu();
        return;
      }

      if (event.key === 'Tab') {
        this.a11yDialog.trapFocus(
          event,
          this.mobileMenuPanel?.nativeElement ?? null,
        );
      }
    }
  }

  openDropdownMenuAndToggleInMobile(label: string): void {
    if (!this.isMobile) this.currentlyHovered.set(label);

    this.dropdownSections.update((sections) =>
      sections.map((section) => {
        if (section.label !== label) {
          // Close other sections
          return { ...section, isOpen: false };
        }

        return {
          ...section,
          isOpen: this.isMobile ? !section.isOpen : true,
        };
      }),
    );
  }

  closeOnDesktopDropdownMenu(label: string): void {
    if (this.isMobile) return;
    setTimeout(() => {
      if (this.currentlyHovered() === label) {
        return;
      }
      this.dropdownSections.update((sections) =>
        sections.map((section) =>
          section.label === label ? { ...section, isOpen: false } : section,
        ),
      );
    }, 150);
  }

  /**
   * Called on the burger button click.
   */
  openMobileMenu(): void {
    if (this.mobileMenuOpen) return this.closeMobileMenu();

    this.mobileMenuOpen = true;
    document.body.style.overflow = 'hidden';

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
    document.body.style.overflow = '';

    // Close all dropdowns when menu closes
    this.dropdownSections.update((sections) =>
      sections.map((s) => ({ ...s, isOpen: false })),
    );

    // Restore focus to what opened the menu (e.g. burger button)
    this.a11yDialog.restoreFocus();
  }

  private updateIsMobileState(): void {
    if (typeof window === 'undefined') return;

    const isMobileViewport = window.innerWidth < 1024;

    if (this.isMobile === isMobileViewport) return;

    this.isMobile = isMobileViewport;

    if (!this.isMobile) {
      this.mobileMenuOpen = false;
      document.body.style.overflow = '';
      this.dropdownSections.update((sections) =>
        sections.map((section) => ({ ...section, isOpen: false })),
      );
    }
  }
}
