import { Component, PLATFORM_ID, signal } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { BottomSheetComponent } from "./bottom-sheet.component";

/** Composant hote pour tester le bottom sheet avec content projection. */
@Component({
  standalone: true,
  imports: [BottomSheetComponent],
  template: `
    <app-bottom-sheet
      [open]="open()"
      [title]="title"
      (openChange)="open.set($event)"
    >
      <p class="test-content">Contenu projete</p>
    </app-bottom-sheet>
  `,
})
class TestHostComponent {
  open = signal(false);
  title = "Titre test";
}

describe("BottomSheetComponent", () => {
  describe("en contexte navigateur (desktop)", () => {
    let host: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent, NoopAnimationsModule],
        providers: [{ provide: PLATFORM_ID, useValue: "browser" }],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it("devrait se creer", () => {
      const sheet = fixture.debugElement.query(
        (el) => el.name === "app-bottom-sheet",
      );
      expect(sheet).toBeTruthy();
    });

    it("ne devrait rien afficher quand open=false", () => {
      const overlay = fixture.nativeElement.querySelector(
        '[data-testid="bottom-sheet-overlay"]',
      );
      expect(overlay).toBeNull();
    });

    it("devrait afficher le panel quand open=true", fakeAsync(() => {
      host.open.set(true);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const panel = fixture.nativeElement.querySelector(
        '[data-testid="bottom-sheet-panel"]',
      );
      expect(panel).toBeTruthy();
    }));

    it("devrait projeter le contenu", fakeAsync(() => {
      host.open.set(true);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const content = fixture.nativeElement.querySelector(".test-content");
      expect(content).toBeTruthy();
      expect(content.textContent).toContain("Contenu projete");
    }));

    it("devrait afficher le titre", fakeAsync(() => {
      host.open.set(true);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector(
        '[data-testid="bottom-sheet-title"]',
      );
      expect(title).toBeTruthy();
      expect(title.textContent).toContain("Titre test");
    }));

    it("devrait avoir role=dialog et aria-modal=true", fakeAsync(() => {
      host.open.set(true);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const panel = fixture.nativeElement.querySelector(
        '[data-testid="bottom-sheet-panel"]',
      );
      expect(panel).toBeTruthy();
      expect(panel.getAttribute("role")).toBe("dialog");
      expect(panel.getAttribute("aria-modal")).toBe("true");
    }));

    it("devrait emettre openChange(false) au clic sur le bouton fermer", fakeAsync(() => {
      host.open.set(true);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const closeBtn = fixture.nativeElement.querySelector(
        '[data-testid="bottom-sheet-close"]',
      );
      expect(closeBtn).toBeTruthy();
      closeBtn.click();
      fixture.detectChanges();

      expect(host.open()).toBe(false);
    }));

    it("devrait fermer avec la touche Escape", fakeAsync(() => {
      host.open.set(true);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const panel = fixture.nativeElement.querySelector(
        '[data-testid="bottom-sheet-panel"]',
      );
      expect(panel).toBeTruthy();
      panel.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      fixture.detectChanges();

      expect(host.open()).toBe(false);
    }));
  });

  describe("en contexte SSR", () => {
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent, NoopAnimationsModule],
        providers: [{ provide: PLATFORM_ID, useValue: "server" }],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();
    });

    it("devrait se rendre sans erreur cote serveur", () => {
      const panel = fixture.nativeElement.querySelector(
        '[data-testid="bottom-sheet-panel"]',
      );
      expect(panel).toBeTruthy();
    });
  });
});
