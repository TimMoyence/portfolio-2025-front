import { PLATFORM_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { FullscreenAdapter } from "./fullscreen.adapter";

describe("FullscreenAdapter", () => {
  describe("en environnement browser", () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          FullscreenAdapter,
          { provide: PLATFORM_ID, useValue: "browser" },
        ],
      });
    });

    it("appelle requestFullscreen sur l'élément fourni", async () => {
      const adapter = TestBed.inject(FullscreenAdapter);
      const el = document.createElement("div");
      const spy = spyOn(el, "requestFullscreen").and.resolveTo();
      await adapter.enter(el);
      expect(spy).toHaveBeenCalled();
    });

    it("ne lance pas si requestFullscreen indisponible", async () => {
      const adapter = TestBed.inject(FullscreenAdapter);
      const el = { requestFullscreen: undefined } as unknown as HTMLElement;
      await expectAsync(adapter.enter(el)).toBeResolved();
    });

    it("appelle document.exitFullscreen quand sorti", async () => {
      const adapter = TestBed.inject(FullscreenAdapter);
      const spy = spyOn(document, "exitFullscreen").and.resolveTo();
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        get: () => document.body,
      });
      await adapter.exit();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("en environnement SSR", () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          FullscreenAdapter,
          { provide: PLATFORM_ID, useValue: "server" },
        ],
      });
    });

    it("enter() est un no-op en SSR", async () => {
      const adapter = TestBed.inject(FullscreenAdapter);
      const el = document.createElement("div");
      const spy = spyOn(el, "requestFullscreen");
      await adapter.enter(el);
      expect(spy).not.toHaveBeenCalled();
    });

    it("loadSwiperElement() est un no-op en SSR", async () => {
      const adapter = TestBed.inject(FullscreenAdapter);
      await expectAsync(adapter.loadSwiperElement()).toBeResolved();
    });
  });
});
