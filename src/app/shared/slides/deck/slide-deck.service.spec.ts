import { TestBed } from "@angular/core/testing";
import { SlideDeckService } from "./slide-deck.service";

describe("SlideDeckService", () => {
  let service: SlideDeckService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SlideDeckService);
  });

  it("commence sans slide courante et total = 0", () => {
    expect(service.current()).toBeNull();
    expect(service.total()).toBe(0);
    expect(service.mode()).toBe("scroll");
  });

  it("enregistre des slides et met à jour le total", () => {
    service.register("hero");
    service.register("why");
    service.register("cta");
    expect(service.total()).toBe(3);
  });

  it("désinscrit une slide et met à jour le total", () => {
    service.register("hero");
    service.register("why");
    service.unregister("hero");
    expect(service.total()).toBe(1);
  });

  it("goTo(id) change la slide courante si elle est enregistrée", () => {
    service.register("hero");
    service.register("why");
    service.goTo("why");
    expect(service.current()).toBe("why");
  });

  it("goTo(id) ignore les ids non enregistrés", () => {
    service.register("hero");
    service.goTo("inconnue");
    expect(service.current()).toBeNull();
  });

  it("next() avance vers la slide suivante", () => {
    service.register("hero");
    service.register("why");
    service.register("cta");
    service.goTo("hero");
    service.next();
    expect(service.current()).toBe("why");
    service.next();
    expect(service.current()).toBe("cta");
  });

  it("next() reste sur la dernière slide en fin de deck", () => {
    service.register("hero");
    service.register("cta");
    service.goTo("cta");
    service.next();
    expect(service.current()).toBe("cta");
  });

  it("previous() recule vers la slide précédente", () => {
    service.register("hero");
    service.register("why");
    service.goTo("why");
    service.previous();
    expect(service.current()).toBe("hero");
  });

  it("previous() reste sur la première slide en début de deck", () => {
    service.register("hero");
    service.register("why");
    service.goTo("hero");
    service.previous();
    expect(service.current()).toBe("hero");
  });

  it("setMode bascule entre scroll et fullscreen", () => {
    expect(service.mode()).toBe("scroll");
    service.setMode("fullscreen");
    expect(service.mode()).toBe("fullscreen");
    service.setMode("scroll");
    expect(service.mode()).toBe("scroll");
  });

  it("currentIndex() retourne l'index de la slide courante (0-based)", () => {
    service.register("a");
    service.register("b");
    service.register("c");
    service.goTo("b");
    expect(service.currentIndex()).toBe(1);
  });

  it("currentIndex() retourne -1 quand aucune slide courante", () => {
    expect(service.currentIndex()).toBe(-1);
  });
});
