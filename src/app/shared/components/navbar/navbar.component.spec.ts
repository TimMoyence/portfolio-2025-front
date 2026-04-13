import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { LOCALE_ID, PLATFORM_ID } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, provideRouter } from "@angular/router";
import { AUTH_PORT } from "../../../core/ports/auth.port";
import { AuthStateService } from "../../../core/services/auth-state.service";
import { NavbarComponent } from "./navbar.component";

describe("NavbarComponent", () => {
  describe("en contexte navigateur", () => {
    let component: NavbarComponent;
    let fixture: ComponentFixture<NavbarComponent>;

    beforeEach(async () => {
      localStorage.removeItem("portfolio_jwt");

      await TestBed.configureTestingModule({
        imports: [NavbarComponent],
        providers: [
          { provide: PLATFORM_ID, useValue: "browser" },
          { provide: LOCALE_ID, useValue: "fr" },
          provideRouter([]),
          { provide: ActivatedRoute, useValue: {} },
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
          {
            provide: AUTH_PORT,
            useValue: {
              login: () => ({ subscribe: () => {} }),
              register: () => ({ subscribe: () => {} }),
              me: () => ({ subscribe: () => {} }),
            },
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(NavbarComponent);
      component = fixture.componentInstance;
    });

    it("devrait se creer", () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it("devrait mettre scrolled a true quand scrollY > 50", () => {
      // Simule un scroll
      spyOnProperty(window, "scrollY", "get").and.returnValue(100);
      component.onWindowScroll();
      expect(component.scrolled).toBeTrue();
    });

    it("devrait mettre scrolled a false quand scrollY <= 50", () => {
      spyOnProperty(window, "scrollY", "get").and.returnValue(10);
      component.onWindowScroll();
      expect(component.scrolled).toBeFalse();
    });

    it("getAlternateLocaleLabel devrait retourner EN quand la locale est fr", () => {
      expect(component.getAlternateLocaleLabel()).toBe("EN");
    });

    it("getAlternateLocaleUrl devrait retourner une URL avec la locale alternative", () => {
      const url = component.getAlternateLocaleUrl();
      expect(url).toMatch(/^\/en/);
    });

    it("devrait afficher le bouton login quand non connecte", () => {
      fixture.detectChanges();
      const nav = fixture.nativeElement as HTMLElement;
      const loginBtn = nav.querySelector(
        'button[aria-label="Espace utilisateur"]',
      );
      expect(loginBtn).toBeTruthy();
    });

    it("devrait afficher l'avatar apres login et masquer le bouton login", () => {
      const authState = TestBed.inject(AuthStateService);
      authState.login({
        accessToken: "fake-jwt",
        expiresIn: 3600,
        user: {
          id: "u1",
          email: "test@example.com",
          firstName: "Tim",
          lastName: "Test",
          phone: null,
          isActive: true,
          roles: ["weather", "budget"],
        },
      });
      fixture.detectChanges();

      const nav = fixture.nativeElement as HTMLElement;
      const loginBtn = nav.querySelector(
        'button[aria-label="Espace utilisateur"]',
      );
      expect(loginBtn).toBeNull();

      const userMenuBtn = nav.querySelector(
        'button[aria-label="Menu utilisateur"]',
      );
      expect(userMenuBtn).toBeTruthy();
    });
  });

  describe("en contexte serveur (SSR)", () => {
    let component: NavbarComponent;
    let fixture: ComponentFixture<NavbarComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [NavbarComponent],
        providers: [
          { provide: PLATFORM_ID, useValue: "server" },
          { provide: LOCALE_ID, useValue: "fr" },
          { provide: ActivatedRoute, useValue: {} },
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
          {
            provide: AUTH_PORT,
            useValue: {
              login: () => ({ subscribe: () => {} }),
              register: () => ({ subscribe: () => {} }),
              me: () => ({ subscribe: () => {} }),
            },
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(NavbarComponent);
      component = fixture.componentInstance;
    });

    it("devrait se creer en SSR", () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it("onWindowScroll ne devrait pas crasher en SSR", () => {
      expect(() => component.onWindowScroll()).not.toThrow();
    });

    it("handleGlobalKeydown ne devrait pas crasher en SSR", () => {
      const event = new KeyboardEvent("keydown", { key: "Escape" });
      expect(() => component.handleGlobalKeydown(event)).not.toThrow();
    });

    it("openMobileMenu ne devrait pas crasher en SSR", () => {
      expect(() => component.openMobileMenu()).not.toThrow();
    });

    it("closeMobileMenu ne devrait pas crasher en SSR", () => {
      expect(() => component.closeMobileMenu()).not.toThrow();
    });

    it("getAlternateLocaleUrl devrait retourner '#' en SSR", () => {
      expect(component.getAlternateLocaleUrl()).toBe("#");
    });

    it("getAlternateLocaleLabel devrait fonctionner en SSR", () => {
      expect(component.getAlternateLocaleLabel()).toBe("EN");
    });
  });
});
