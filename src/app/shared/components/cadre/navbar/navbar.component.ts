import { CommonModule, isPlatformBrowser, ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  HostListener,
  Inject,
  LOCALE_ID,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { LOCALES_DU_SITE, langueDuSite } from '../../../../core/config/locales';
import { cheminEnLocale } from '../../../../core/seo/pages/chemins';
import { BreakpointService } from '../../../../core/services/breakpoint.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import type { DropdownSection, NavLink } from '../../../models/navbar.model';
import { A11yDialogService } from '../../../services/a11y-dialog.service';
import { initialeDe } from '../../../utils/initiale.utils';
import { SvgIconComponent } from '../../svg-icon.component';
import { MarqueComponent } from '../marque/marque.component';
import { ENTREES_DE_FORMATION } from '../../../../core/config/familles-de-formation';
import { CHEMINS_DE_LA_NAVIGATION, nomCourtServi } from '../../../../core/seo/site-servi';

const HORS_FORMATIONS = CHEMINS_DE_LA_NAVIGATION.filter(
  (chemin) => !ENTREES_DE_FORMATION.some(({ lien }) => lien === chemin),
);

const lienDuMenu = (href: string): NavLink => ({ label: nomCourtServi(href), href });

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, SvgIconComponent, MarqueComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  readonly navLinks: NavLink[] = HORS_FORMATIONS.slice(0, -2).map(lienDuMenu);

  readonly aPropos: NavLink = lienDuMenu(HORS_FORMATIONS.at(-2) ?? '');

  readonly cheminDuContact = HORS_FORMATIONS.at(-1) ?? '';

  readonly formationsDropdown: DropdownSection = {
    label: $localize`:navbar.formations.label|Formations dropdown label@@navFormationsLabel:Formation`,
    isOpen: false,
    items: ENTREES_DE_FORMATION,
  };

  @ViewChild('formationTrigger', { static: false })
  formationTrigger?: ElementRef<HTMLButtonElement>;

  readonly openMenuLabel = $localize`:navbar.menu.open|Burger button label@@navMenuOpen:Ouvrir le menu principal`;
  readonly closeMenuLabel = $localize`:navbar.menu.close|Burger button label@@navMenuClose:Fermer le menu principal`;
  readonly mobileNavHeading = $localize`:navbar.menu.heading|Mobile nav heading@@navMenuHeading:Menu principal`;
  readonly closeMenuIconLabel = $localize`:navbar.menu.icon.close|Icon label@@navMenuCloseIcon:Fermer le menu`;
  readonly openMenuIconLabel = $localize`:navbar.menu.icon.open|Icon label@@navMenuOpenIcon:Ouvrir le menu`;
  readonly currentLocale = inject(LOCALE_ID);
  readonly authState = inject(AuthStateService);
  private readonly breakpointService = inject(BreakpointService);

  readonly userInitials = computed(() => {
    const user = this.authState.user();
    return `${initialeDe(user?.firstName)}${initialeDe(user?.lastName)}`;
  });

  readonly avatarColor = computed(() => {
    const user = this.authState.user();
    if (!user) return '#6b7280';
    const name = `${user.firstName ?? ''}${user.lastName ?? ''}`;
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

  get isMobile(): boolean {
    return this.breakpointService.isTabletOrBelow();
  }

  @ViewChild('mobileMenuPanel', { static: false })
  mobileMenuPanel?: ElementRef<HTMLElement>;

  @ViewChild('burgerButton', { static: false })
  burgerButton?: ElementRef<HTMLButtonElement>;

  constructor(
    private a11yDialog: A11yDialogService,
    private readonly cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {
    effect(() => {
      const mobile = this.isMobile;
      if (!mobile && this.mobileMenuOpen) {
        this.mobileMenuOpen = false;
        if (isPlatformBrowser(this.platformId)) {
          document.body.style.overflow = '';
        }
        this.cdr.markForCheck();
      }
    });

    effect(() => {
      this.authState.isLoggedIn();
      this.authState.user();
      this.cdr.markForCheck();
    });
    if (isPlatformBrowser(this.platformId)) {
      const defilement = inject(ViewportScroller);
      const hote = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
      defilement.setOffset(() => [
        0,
        hote.querySelector('nav')?.getBoundingClientRect().bottom ?? 0,
      ]);
      inject(DestroyRef).onDestroy(() => defilement.setOffset([0, 0]));
    }
  }

  getAlternateLocaleUrl(): string {
    if (!isPlatformBrowser(this.platformId)) return '#';
    const targetLocale = langueDuSite(this.currentLocale) === 'fr' ? 'en' : 'fr';
    return cheminEnLocale(window.location.pathname, targetLocale, LOCALES_DU_SITE);
  }

  getAlternateLocaleLabel(): string {
    return langueDuSite(this.currentLocale) === 'fr' ? 'EN' : 'FR';
  }

  @HostListener('window:scroll', [])
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
    this.closeMobileMenu();
    this.authState.logoutEtAccueil();
  }

  toggleUserDropdown(): void {
    this.userDropdownOpen = !this.userDropdownOpen;
    this.cdr.markForCheck();
  }

  closeUserDropdown(): void {
    if (this.userDropdownOpen) {
      this.userDropdownOpen = false;
      this.cdr.markForCheck();
    }
  }

  toggleDropdown(dropdown: DropdownSection): void {
    dropdown.isOpen = !dropdown.isOpen;
    this.cdr.markForCheck();
  }

  cliquerFormation(dropdown: DropdownSection, clic: MouseEvent): void {
    if (clic.detail > 0 && this.surEcranASurvol()) {
      this.setDropdownOpen(dropdown, true);
      return;
    }
    this.toggleDropdown(dropdown);
  }

  openDropdown(dropdown: DropdownSection): void {
    if (this.surEcranASurvol()) {
      this.setDropdownOpen(dropdown, true);
    }
  }

  private surEcranASurvol(): boolean {
    return window.matchMedia('(hover: hover)').matches;
  }

  closeDropdownWhenFocusLeaves(dropdown: DropdownSection, event: FocusEvent): void {
    const menu = event.currentTarget as HTMLElement;
    if (!menu.contains(event.relatedTarget as Node | null)) {
      this.closeDropdown(dropdown);
    }
  }

  @HostListener('document:click', ['$event'])
  closeDropdownOnOutsideClick(event: MouseEvent): void {
    if (!(event.target as Element | null)?.closest('.asili-nav__item--formation')) {
      this.closeDropdown(this.formationsDropdown);
    }
  }

  closeDropdown(dropdown: DropdownSection): void {
    this.setDropdownOpen(dropdown, false);
  }

  private setDropdownOpen(dropdown: DropdownSection, isOpen: boolean): void {
    if (dropdown.isOpen !== isOpen) {
      dropdown.isOpen = isOpen;
      this.cdr.markForCheck();
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.openMobileMenuOnSpace(event)) return;
    if (this.closeTopmostOverlayOnEscape(event)) return;
    this.trapFocusInMobileMenu(event);
  }

  private openMobileMenuOnSpace(event: KeyboardEvent): boolean {
    const burger = this.burgerButton?.nativeElement;
    const isSpace = event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space';
    if (!burger || !isSpace || document.activeElement !== burger) {
      return false;
    }
    event.preventDefault();
    event.stopPropagation();
    this.openMobileMenu();
    return true;
  }

  private closeTopmostOverlayOnEscape(event: KeyboardEvent): boolean {
    if (event.key !== 'Escape') {
      return false;
    }
    if (this.userDropdownOpen) {
      event.preventDefault();
      this.closeUserDropdown();
      return true;
    }
    const openDropdown = [this.formationsDropdown].find((dropdown) => dropdown.isOpen);
    if (openDropdown) {
      event.preventDefault();
      this.closeDropdown(openDropdown);
      if (!this.mobileMenuOpen) {
        this.formationTrigger?.nativeElement.focus();
      }
      return true;
    }
    if (this.mobileMenuOpen) {
      event.preventDefault();
      this.closeMobileMenu();
      return true;
    }
    return false;
  }

  private trapFocusInMobileMenu(event: KeyboardEvent): void {
    if (this.mobileMenuOpen && event.key === 'Tab') {
      this.a11yDialog.trapFocus(event, this.mobileMenuPanel?.nativeElement ?? null);
    }
  }

  openMobileMenu(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.mobileMenuOpen) return this.closeMobileMenu();

    this.mobileMenuOpen = true;
    this.cdr.markForCheck();
    document.body.style.overflow = 'hidden';

    this.a11yDialog.saveFocus();

    requestAnimationFrame(() => {
      const panel = this.mobileMenuPanel?.nativeElement ?? null;
      this.a11yDialog.focusFirstDescendant(panel);
    });
  }

  closeMobileMenu(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.mobileMenuOpen = false;
    this.cdr.markForCheck();
    document.body.style.overflow = '';

    this.a11yDialog.restoreFocus();
  }
}
