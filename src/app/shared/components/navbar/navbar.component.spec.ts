import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { PLATFORM_ID } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { NavbarComponent } from "./navbar.component";

describe("NavbarComponent", () => {
  describe("en contexte navigateur", () => {
    let component: NavbarComponent;
    let fixture: ComponentFixture<NavbarComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [NavbarComponent],
        providers: [
          { provide: PLATFORM_ID, useValue: "browser" },
          { provide: ActivatedRoute, useValue: {} },
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
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
  });

  describe("en contexte serveur (SSR)", () => {
    let component: NavbarComponent;
    let fixture: ComponentFixture<NavbarComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [NavbarComponent],
        providers: [
          { provide: PLATFORM_ID, useValue: "server" },
          { provide: ActivatedRoute, useValue: {} },
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
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
  });
});
