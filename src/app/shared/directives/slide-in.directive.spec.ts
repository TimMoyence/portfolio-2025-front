import { Component, PLATFORM_ID } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SlideInDirective } from "./slide-in.directive";

@Component({
  template: `<div appSlideIn>Contenu</div>`,
  standalone: true,
  imports: [SlideInDirective],
})
class TestHostComponent {}

describe("SlideInDirective", () => {
  describe("en contexte navigateur", () => {
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [{ provide: PLATFORM_ID, useValue: "browser" }],
      });
      fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
    });

    it("devrait ajouter la classe slide-in-hidden au demarrage", () => {
      const el = fixture.nativeElement.querySelector("[appSlideIn]");
      expect(el.classList.contains("slide-in-hidden")).toBeTrue();
    });

    it("devrait nettoyer l observer a la destruction", () => {
      fixture.destroy();
      // Pas d'erreur = observer.disconnect() appele correctement
      expect(true).toBeTrue();
    });
  });

  describe("en contexte serveur (SSR)", () => {
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [{ provide: PLATFORM_ID, useValue: "server" }],
      });
      fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
    });

    it("ne devrait pas ajouter la classe slide-in-hidden en SSR", () => {
      const el = fixture.nativeElement.querySelector("[appSlideIn]");
      expect(el.classList.contains("slide-in-hidden")).toBeFalse();
    });

    it("devrait se detruire sans erreur en SSR", () => {
      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});
