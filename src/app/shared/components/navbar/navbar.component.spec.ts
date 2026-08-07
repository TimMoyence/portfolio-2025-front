import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { throwError } from 'rxjs';
import { AUTH_PORT } from '../../../core/ports/auth.port';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { buildAuthSession, createAuthPortStub } from '../../../../testing/factories/auth.factory';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  describe('en contexte navigateur', () => {
    let component: NavbarComponent;
    let fixture: ComponentFixture<NavbarComponent>;
    let authPort: ReturnType<typeof createAuthPortStub>;

    beforeEach(async () => {
      localStorage.removeItem('portfolio_jwt');
      authPort = createAuthPortStub();

      await TestBed.configureTestingModule({
        imports: [NavbarComponent],
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: LOCALE_ID, useValue: 'fr' },
          provideRouter([]),
          { provide: ActivatedRoute, useValue: {} },
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
          { provide: AUTH_PORT, useValue: authPort },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(NavbarComponent);
      component = fixture.componentInstance;
    });

    it('devrait se creer', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('devrait mettre scrolled a true quand scrollY > 50', () => {
      spyOnProperty(window, 'scrollY', 'get').and.returnValue(100);
      component.onWindowScroll();
      expect(component.scrolled).toBeTrue();
    });

    it('devrait mettre scrolled a false quand scrollY <= 50', () => {
      spyOnProperty(window, 'scrollY', 'get').and.returnValue(10);
      component.onWindowScroll();
      expect(component.scrolled).toBeFalse();
    });

    it('getAlternateLocaleLabel devrait retourner EN quand la locale est fr', () => {
      expect(component.getAlternateLocaleLabel()).toBe('EN');
    });

    it('getAlternateLocaleUrl devrait retourner une URL avec la locale alternative', () => {
      const url = component.getAlternateLocaleUrl();
      expect(url).toMatch(/^\/en/);
    });

    it('devrait afficher le logo Asili (image + nom « Asili design »)', () => {
      fixture.detectChanges();
      const nav = fixture.nativeElement as HTMLElement;
      const logo = nav.querySelector('.asili-logo');
      expect(logo).toBeTruthy();
      const img = logo?.querySelector('img');
      expect(img).toBeTruthy();
      expect(img?.getAttribute('alt')).toContain('Asili');
      expect(logo?.querySelector('.asili-logo__name')?.textContent).toContain('Asili design');
    });

    it('devrait exposer le lien primaire « Services » vers /offer', () => {
      fixture.detectChanges();
      const offerLink = component.navLinks.find((link) => link.href === '/offer');
      expect(offerLink?.label).toBe('Services');
    });

    it('devrait exposer le lien primaire « Projets » vers /projets', () => {
      fixture.detectChanges();
      const projetsLink = component.navLinks.find((link) => link.label === 'Projets');
      expect(projetsLink?.href).toBe('/projets');
    });

    it("devrait exposer un lien hub /atelier sur le dropdown L'Atelier", () => {
      fixture.detectChanges();
      expect(component.atelierDropdown.href).toBe('/atelier');

      const nav = fixture.nativeElement as HTMLElement;
      const hubLink = nav.querySelector('a.asili-nav__trigger-label[href="/atelier"]');
      expect(hubLink).toBeTruthy();
      expect(hubLink?.textContent).toContain("L'Atelier");
    });

    it("devrait conserver la bascule du dropdown L'Atelier (chevron)", () => {
      fixture.detectChanges();
      expect(component.atelierDropdown.isOpen).toBeFalse();
      component.toggleAtelierDropdown();
      expect(component.atelierDropdown.isOpen).toBeTrue();
      component.closeAtelierDropdown();
      expect(component.atelierDropdown.isOpen).toBeFalse();
    });

    it('devrait afficher la pill de langue FR/EN', () => {
      fixture.detectChanges();
      const nav = fixture.nativeElement as HTMLElement;
      const lang = nav.querySelector('.asili-lang');
      expect(lang).toBeTruthy();
      expect(lang?.querySelector('.asili-lang__switch')?.textContent).toContain('EN');
    });

    it('devrait afficher le bouton login quand non connecte', () => {
      fixture.detectChanges();
      const nav = fixture.nativeElement as HTMLElement;
      const loginBtn = nav.querySelector('button[aria-label="Espace utilisateur"]');
      expect(loginBtn).toBeTruthy();
    });

    it("devrait afficher l'avatar apres login et masquer le bouton login", () => {
      const authState = TestBed.inject(AuthStateService);
      authState.login({
        accessToken: 'fake-jwt',
        expiresIn: 3600,
        user: {
          id: 'u1',
          email: 'test@example.com',
          firstName: 'Tim',
          lastName: 'Test',
          phone: null,
          isActive: true,
          roles: ['weather'],
        },
      });
      fixture.detectChanges();

      const nav = fixture.nativeElement as HTMLElement;
      const loginBtn = nav.querySelector('button[aria-label="Espace utilisateur"]');
      expect(loginBtn).toBeNull();

      const userMenuBtn = nav.querySelector('button[aria-label="Menu utilisateur"]');
      expect(userMenuBtn).toBeTruthy();
    });

    describe('deconnexion', () => {
      let authState: AuthStateService;

      beforeEach(() => {
        authState = TestBed.inject(AuthStateService);
        authState.login(buildAuthSession());
      });

      it('devrait revoquer la session serveur via authPort.logout()', () => {
        component.logout();

        expect(authPort.logout).toHaveBeenCalledWith();
      });

      it("devrait purger la session locale et rediriger vers l'accueil", () => {
        const navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

        component.logout();

        expect(authState.isLoggedIn()).toBeFalse();
        expect(localStorage.getItem('portfolio_jwt')).toBeNull();
        expect(navigateSpy).toHaveBeenCalledWith(['/']);
      });

      it('devrait deconnecter localement meme si la revocation serveur echoue', () => {
        authPort.logout.and.returnValue(throwError(() => new Error('API injoignable')));
        const navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

        expect(() => component.logout()).not.toThrow();

        expect(authPort.logout).toHaveBeenCalledWith();
        expect(authState.isLoggedIn()).toBeFalse();
        expect(localStorage.getItem('portfolio_jwt')).toBeNull();
        expect(navigateSpy).toHaveBeenCalledWith(['/']);
      });
    });
  });

  describe('en contexte serveur (SSR)', () => {
    let component: NavbarComponent;
    let fixture: ComponentFixture<NavbarComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [NavbarComponent],
        providers: [
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: LOCALE_ID, useValue: 'fr' },
          { provide: ActivatedRoute, useValue: {} },
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
          { provide: AUTH_PORT, useValue: createAuthPortStub() },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(NavbarComponent);
      component = fixture.componentInstance;
    });

    it('devrait se creer en SSR', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('onWindowScroll ne devrait pas crasher en SSR', () => {
      expect(() => component.onWindowScroll()).not.toThrow();
    });

    it('handleGlobalKeydown ne devrait pas crasher en SSR', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      expect(() => component.handleGlobalKeydown(event)).not.toThrow();
    });

    it('openMobileMenu ne devrait pas crasher en SSR', () => {
      expect(() => component.openMobileMenu()).not.toThrow();
    });

    it('closeMobileMenu ne devrait pas crasher en SSR', () => {
      expect(() => component.closeMobileMenu()).not.toThrow();
    });

    it("getAlternateLocaleUrl devrait retourner '#' en SSR", () => {
      expect(component.getAlternateLocaleUrl()).toBe('#');
    });

    it('getAlternateLocaleLabel devrait fonctionner en SSR', () => {
      expect(component.getAlternateLocaleLabel()).toBe('EN');
    });
  });
});
