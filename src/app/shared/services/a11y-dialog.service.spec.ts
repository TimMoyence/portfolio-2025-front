import { PLATFORM_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { A11yDialogService } from "./a11y-dialog.service";

describe("A11yDialogService", () => {
  describe("en contexte navigateur", () => {
    let service: A11yDialogService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          A11yDialogService,
          { provide: PLATFORM_ID, useValue: "browser" },
        ],
      });
      service = TestBed.inject(A11yDialogService);
    });

    it("devrait etre cree", () => {
      expect(service).toBeTruthy();
    });

    it("devrait sauvegarder et restaurer le focus", () => {
      const btn = document.createElement("button");
      document.body.appendChild(btn);
      btn.focus();

      service.saveFocus();
      service.restoreFocus();

      // Pas d'erreur, le focus a ete restaure
      expect(document.activeElement).toBe(btn);
      document.body.removeChild(btn);
    });
  });

  describe("en contexte serveur (SSR)", () => {
    let service: A11yDialogService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          A11yDialogService,
          { provide: PLATFORM_ID, useValue: "server" },
        ],
      });
      service = TestBed.inject(A11yDialogService);
    });

    it("devrait etre cree en SSR", () => {
      expect(service).toBeTruthy();
    });

    it("saveFocus ne devrait pas crasher en SSR", () => {
      expect(() => service.saveFocus()).not.toThrow();
    });

    it("trapFocus ne devrait pas crasher en SSR", () => {
      const event = new KeyboardEvent("keydown", { key: "Tab" });
      expect(() => service.trapFocus(event, null)).not.toThrow();
    });

    it("restoreFocus ne devrait pas crasher en SSR", () => {
      expect(() => service.restoreFocus()).not.toThrow();
    });

    it("focusFirstDescendant ne devrait pas crasher en SSR", () => {
      expect(() => service.focusFirstDescendant(null)).not.toThrow();
    });
  });
});
