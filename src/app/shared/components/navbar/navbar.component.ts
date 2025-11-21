import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
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
    { label: 'Accueil', href: '#' },
    { label: 'Cours', href: '#' },
    { label: 'Présentation', href: '#' },
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
  MenuOpen = false;
  isMobile = false;
  currentlyHovered = signal<string | null>(null);

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

  openOnMobileDropdownMenu(label: string): void {
    console.log('Clicked on', label);

    if (!this.isMobile) return;

    this.dropdownSections.update((sections) =>
      sections.map((section) => ({
        ...section,
        isOpen: section.label === label ? !section.isOpen : false,
      })),
    );
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;

    // Optionnel : fermer les dropdowns aussi
    this.dropdownSections.update((sections) =>
      sections.map((s) => ({ ...s, isOpen: false })),
    );

    document.body.style.overflow = '';
  }

  openOnDesktopDropdownMenu(label: string): void {
    if (this.isMobile) return;

    this.currentlyHovered.set(label);

    this.dropdownSections.update((sections) =>
      sections.map((section) => ({
        ...section,
        isOpen: section.label === label,
      })),
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

  openMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (this.mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  private updateIsMobileState(): void {
    if (typeof window === 'undefined') return;

    const isMobileViewport = window.innerWidth < 768;

    if (this.isMobile === isMobileViewport) return;

    this.isMobile = isMobileViewport;

    if (!this.isMobile) {
      this.mobileMenuOpen = false;
      this.dropdownSections.update((sections) =>
        sections.map((section) => ({ ...section, isOpen: false })),
      );
    }
  }
}
