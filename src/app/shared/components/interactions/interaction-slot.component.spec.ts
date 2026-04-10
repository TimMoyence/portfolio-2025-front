import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { InteractionSlotComponent } from "./interaction-slot.component";
import {
  buildPollInteraction,
  buildReflectionInteraction,
  buildChecklistInteraction,
  buildSelfRatingInteraction,
} from "../../../../testing/factories/slide.factory";
import type {
  PresentationMode,
  SlideInteractions,
} from "../../models/slide.model";

@Component({
  standalone: true,
  imports: [InteractionSlotComponent],
  template: `<app-interaction-slot
    [interactions]="interactions"
    [mode]="mode"
  />`,
})
class TestHostComponent {
  interactions: SlideInteractions | undefined;
  mode: PresentationMode = "scroll";
}

describe("InteractionSlotComponent", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  it("devrait creer le composant", () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector("app-interaction-slot")).toBeTruthy();
  });

  it("devrait ne rien rendre sans interactions", () => {
    host.interactions = undefined;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector("app-poll-interaction")).toBeNull();
    expect(el.querySelector("app-reflection-interaction")).toBeNull();
  });

  describe("mode scroll", () => {
    beforeEach(() => {
      host.mode = "scroll";
    });

    it("devrait afficher les interactions scroll", () => {
      host.interactions = {
        scroll: [buildReflectionInteraction()],
      };
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector("app-reflection-interaction")).toBeTruthy();
    });

    it("devrait afficher les checklists", () => {
      host.interactions = {
        scroll: [buildChecklistInteraction()],
      };
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector("app-checklist-interaction")).toBeTruthy();
    });

    it("devrait afficher les self-ratings", () => {
      host.interactions = {
        scroll: [buildSelfRatingInteraction()],
      };
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector("app-self-rating-interaction")).toBeTruthy();
    });

    it("devrait ne PAS afficher les interactions present en scroll", () => {
      host.interactions = {
        present: [buildPollInteraction()],
        scroll: [],
      };
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector("app-poll-interaction")).toBeNull();
    });
  });

  describe("mode present", () => {
    beforeEach(() => {
      host.mode = "present";
    });

    it("devrait afficher les polls", () => {
      host.interactions = {
        present: [buildPollInteraction()],
      };
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector("app-poll-interaction")).toBeTruthy();
    });

    it("devrait ne PAS afficher les interactions scroll en present", () => {
      host.interactions = {
        present: [],
        scroll: [buildReflectionInteraction()],
      };
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector("app-reflection-interaction")).toBeNull();
    });
  });

  describe("mode overview", () => {
    it("devrait ne rien afficher en overview", () => {
      host.mode = "overview";
      host.interactions = {
        present: [buildPollInteraction()],
        scroll: [buildReflectionInteraction()],
      };
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector("app-poll-interaction")).toBeNull();
      expect(el.querySelector("app-reflection-interaction")).toBeNull();
    });
  });
});
