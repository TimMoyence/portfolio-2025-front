import { TestBed } from "@angular/core/testing";
import { FragmentService } from "./fragment.service";

describe("FragmentService", () => {
  let service: FragmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FragmentService],
    });
    service = TestBed.inject(FragmentService);
  });

  it("devrait etre cree", () => {
    expect(service).toBeTruthy();
  });

  describe("reset", () => {
    it("devrait initialiser visibleCount a 0 et isComplete a false pour 3 fragments", () => {
      service.reset(3);

      expect(service.visibleCount()).toBe(0);
      expect(service.isComplete()).toBeFalse();
    });

    it("devrait marquer isComplete a true immediatement quand total vaut 0", () => {
      service.reset(0);

      expect(service.visibleCount()).toBe(0);
      expect(service.isComplete()).toBeTrue();
    });

    it("devrait reinitialiser apres une utilisation precedente", () => {
      service.reset(2);
      service.next();
      service.next();
      expect(service.isComplete()).toBeTrue();

      service.reset(3);

      expect(service.visibleCount()).toBe(0);
      expect(service.isComplete()).toBeFalse();
    });
  });

  describe("next", () => {
    it("devrait reveler les fragments un par un jusqu a completion", () => {
      service.reset(3);

      expect(service.next()).toBeTrue();
      expect(service.visibleCount()).toBe(1);
      expect(service.isComplete()).toBeFalse();

      expect(service.next()).toBeTrue();
      expect(service.visibleCount()).toBe(2);
      expect(service.isComplete()).toBeFalse();

      expect(service.next()).toBeTrue();
      expect(service.visibleCount()).toBe(3);
      expect(service.isComplete()).toBeTrue();
    });

    it("devrait retourner false et ne pas incrementer quand tous les fragments sont visibles", () => {
      service.reset(2);
      service.next();
      service.next();

      expect(service.next()).toBeFalse();
      expect(service.visibleCount()).toBe(2);
    });
  });

  describe("prev", () => {
    it("devrait masquer le dernier fragment revele", () => {
      service.reset(3);
      service.next();
      service.next();
      expect(service.visibleCount()).toBe(2);

      expect(service.prev()).toBeTrue();
      expect(service.visibleCount()).toBe(1);
      expect(service.isComplete()).toBeFalse();
    });

    it("devrait retourner false quand visibleCount vaut 0", () => {
      service.reset(3);

      expect(service.prev()).toBeFalse();
      expect(service.visibleCount()).toBe(0);
    });
  });

  describe("showAll", () => {
    it("devrait reveler tous les fragments d un coup", () => {
      service.reset(5);

      service.showAll();

      expect(service.visibleCount()).toBe(5);
      expect(service.isComplete()).toBeTrue();
    });

    it("devrait fonctionner meme si certains fragments sont deja visibles", () => {
      service.reset(4);
      service.next();
      service.next();

      service.showAll();

      expect(service.visibleCount()).toBe(4);
      expect(service.isComplete()).toBeTrue();
    });
  });
});
