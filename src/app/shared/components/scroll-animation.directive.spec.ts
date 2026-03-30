import { Component, PLATFORM_ID } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ScrollAnimationComponent } from "./scroll-animation.directive";

/**
 * Composant hote pour tester la directive ScrollAnimationComponent.
 */
@Component({
  standalone: true,
  imports: [ScrollAnimationComponent],
  template: `<app-scroll-animation
    ><div class="reveal">Test</div></app-scroll-animation
  >`,
})
class TestHostComponent {}

describe("ScrollAnimationComponent", () => {
  describe("en contexte navigateur", () => {
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [{ provide: PLATFORM_ID, useValue: "browser" }],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
    });

    it("devrait se creer sans erreur", () => {
      fixture.detectChanges();
      expect(fixture.componentInstance).toBeTruthy();
    });
  });

  describe("en contexte serveur (SSR)", () => {
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [{ provide: PLATFORM_ID, useValue: "server" }],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
    });

    it("devrait se creer sans erreur cote serveur", () => {
      fixture.detectChanges();
      expect(fixture.componentInstance).toBeTruthy();
    });

    it("ne devrait pas acceder a window lors de initScrollAnimation en SSR", () => {
      // Si le guard SSR est absent, ngAfterViewInit crashera en accedant a window
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });
});
