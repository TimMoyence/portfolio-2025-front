import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type EnvironmentProviders, LOCALE_ID, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { throwError } from 'rxjs';
import { AUTH_PORT } from '../../../core/ports/auth.port';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { buildAuthSession, createAuthPortStub } from '../../../../testing/factories/auth.factory';
import { NavbarComponent } from './navbar.component';

async function monterLaNavbar(
  plateforme: 'browser' | 'server',
  authPort: ReturnType<typeof createAuthPortStub>,
  routeur: EnvironmentProviders[] = [],
): Promise<ComponentFixture<NavbarComponent>> {
  await TestBed.configureTestingModule({
    imports: [NavbarComponent],
    providers: [
      { provide: PLATFORM_ID, useValue: plateforme },
      { provide: LOCALE_ID, useValue: 'fr' },
      ...routeur,
      { provide: ActivatedRoute, useValue: {} },
      provideHttpClient(withInterceptorsFromDi()),
      provideHttpClientTesting(),
      { provide: AUTH_PORT, useValue: authPort },
    ],
  }).compileComponents();

  return TestBed.createComponent(NavbarComponent);
}

describe('NavbarComponent', () => {
  describe('en contexte navigateur', () => {
    let component: NavbarComponent;
    let fixture: ComponentFixture<NavbarComponent>;
    let authPort: ReturnType<typeof createAuthPortStub>;

    beforeEach(async () => {
      authPort = createAuthPortStub();
      fixture = await monterLaNavbar('browser', authPort, [provideRouter([])]);
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

    it('G02 · donne a l entree Formations la meme taille que les autres liens', () => {
      fixture.detectChanges();
      const nav = fixture.nativeElement as HTMLElement;
      const lien = nav.querySelector('a.asili-nav__link:not(.is-mobile)');
      const formations = nav.querySelector('button.asili-nav__trigger');
      expect(lien).withContext('lien de navigation').not.toBeNull();
      expect(formations).withContext('entree Formations').not.toBeNull();

      const style = (element: Element): CSSStyleDeclaration => getComputedStyle(element);
      expect(style(formations as Element).fontSize).toBe(style(lien as Element).fontSize);
      expect(style(formations as Element).lineHeight).toBe(style(lien as Element).lineHeight);
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

    it("ne devrait plus exposer l'ancien Atelier", () => {
      fixture.detectChanges();
      const nav = fixture.nativeElement as HTMLElement;
      expect(nav.textContent).not.toContain("L'Atelier");
      expect(nav.querySelector('[href="/atelier"]')).toBeNull();
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
          roles: ['user'],
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

      function deconnecterSansErreur(): void {
        const navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

        expect(() => component.logout()).not.toThrow();

        expect(authState.isLoggedIn()).toBeFalse();
        expect(navigateSpy).toHaveBeenCalledWith(['/']);
      }

      it("devrait purger la session locale et rediriger vers l'accueil", () => {
        deconnecterSansErreur();
      });

      it('devrait deconnecter localement meme si la revocation serveur echoue', () => {
        authPort.logout.and.returnValue(throwError(() => new Error('API injoignable')));

        deconnecterSansErreur();

        expect(authPort.logout).toHaveBeenCalledWith();
      });
    });
  });

  describe('en contexte serveur (SSR)', () => {
    let component: NavbarComponent;
    let fixture: ComponentFixture<NavbarComponent>;

    beforeEach(async () => {
      fixture = await monterLaNavbar('server', createAuthPortStub());
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
