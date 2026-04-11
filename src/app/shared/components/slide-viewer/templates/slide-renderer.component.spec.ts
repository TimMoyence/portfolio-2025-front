import { provideHttpClient } from "@angular/common/http";
import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { APP_CONFIG } from "../../../../core/config/app-config.token";
import { LEAD_MAGNET_PORT } from "../../../../core/ports/lead-magnet.port";
import { buildAppConfig } from "../../../../../testing/factories/app-config.factory";
import { createLeadMagnetPortStub } from "../../../../../testing/factories/lead-magnet.factory";
import { buildSlide } from "../../../../../testing/factories/slide.factory";
import type {
  PromptTemplate,
  Slide,
  SlideLayout,
} from "../../../models/slide.model";
import { SlideRendererComponent } from "./slide-renderer.component";
import { SlideSplitComponent } from "./slide-split.component";

describe("SlideRendererComponent", () => {
  let component: SlideRendererComponent;
  let fixture: ComponentFixture<SlideRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlideRendererComponent],
      providers: [
        // `provideHttpClient`, `provideRouter`, `APP_CONFIG` et `LEAD_MAGNET_PORT`
        // sont requis par le layout `cta` (SlideCtaComponent) qui injecte
        // `LeadMagnetCtaComponent`. On les fournit globalement ici pour permettre
        // a tous les layouts d'etre instancies sans condition.
        provideHttpClient(),
        provideRouter([]),
        { provide: APP_CONFIG, useValue: buildAppConfig() },
        { provide: LEAD_MAGNET_PORT, useValue: createLeadMagnetPortStub() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SlideRendererComponent);
    component = fixture.componentInstance;
  });

  /** Configure les inputs requis et declenche la detection de changements. */
  function setupInputs(
    layout: SlideLayout,
    overrides: Partial<Slide> = {},
  ): void {
    fixture.componentRef.setInput(
      "slide",
      buildSlide({
        id: "renderer-slide",
        title: "Slide test",
        layout,
        stats: [{ value: "42", label: "metric" }],
        gridItems: [{ title: "Item", description: "Desc" }],
        quote: "Une citation",
        quoteAuthor: "Auteur",
        ...overrides,
      }),
    );
    fixture.componentRef.setInput("index", 0);
    fixture.componentRef.setInput("total", 5);
    fixture.detectChanges();
  }

  it("devrait etre cree", () => {
    setupInputs("split");
    expect(component).toBeTruthy();
  });

  describe("rendu par layout", () => {
    it('devrait rendre <app-slide-hero> pour layout "hero"', () => {
      setupInputs("hero");
      expect(
        fixture.nativeElement.querySelector("app-slide-hero"),
      ).toBeTruthy();
    });

    it('devrait rendre <app-slide-split> pour layout "split"', () => {
      setupInputs("split");
      expect(
        fixture.nativeElement.querySelector("app-slide-split"),
      ).toBeTruthy();
    });

    it('devrait rendre <app-slide-stats> pour layout "stats"', () => {
      setupInputs("stats");
      expect(
        fixture.nativeElement.querySelector("app-slide-stats"),
      ).toBeTruthy();
    });

    it('devrait rendre <app-slide-grid> pour layout "grid"', () => {
      setupInputs("grid");
      expect(
        fixture.nativeElement.querySelector("app-slide-grid"),
      ).toBeTruthy();
    });

    it('devrait rendre <app-slide-comparison> pour layout "comparison"', () => {
      setupInputs("comparison");
      expect(
        fixture.nativeElement.querySelector("app-slide-comparison"),
      ).toBeTruthy();
    });

    it('devrait rendre <app-slide-quote> pour layout "quote"', () => {
      setupInputs("quote");
      expect(
        fixture.nativeElement.querySelector("app-slide-quote"),
      ).toBeTruthy();
    });

    it('devrait rendre <app-slide-demo> pour layout "demo"', () => {
      setupInputs("demo");
      expect(
        fixture.nativeElement.querySelector("app-slide-demo"),
      ).toBeTruthy();
    });

    it('devrait rendre <app-slide-cta> pour layout "cta"', () => {
      setupInputs("cta");
      expect(fixture.nativeElement.querySelector("app-slide-cta")).toBeTruthy();
    });

    it("devrait rendre le template split par defaut quand layout est absent", () => {
      fixture.componentRef.setInput(
        "slide",
        buildSlide({
          id: "no-layout",
          title: "Pas de layout",
          layout: undefined,
        }),
      );
      fixture.componentRef.setInput("index", 0);
      fixture.componentRef.setInput("total", 1);
      fixture.detectChanges();

      expect(
        fixture.nativeElement.querySelector("app-slide-split"),
      ).toBeTruthy();
    });
  });

  describe("propagation des outputs depuis les templates enfants", () => {
    it("devrait relayer toggleNotes emis par SlideSplitComponent", () => {
      setupInputs("split");
      const spy = jasmine.createSpy("toggleNotes");
      component.toggleNotes.subscribe(spy);

      const splitDebug = fixture.debugElement.query(
        By.directive(SlideSplitComponent),
      );
      expect(splitDebug).withContext("SlideSplitComponent monte").toBeTruthy();
      splitDebug.componentInstance.toggleNotes.emit(3);

      expect(spy).toHaveBeenCalledWith(3);
    });

    it("devrait relayer sectorChange emis par SlideSplitComponent", () => {
      setupInputs("split");
      const spy = jasmine.createSpy("sectorChange");
      component.sectorChange.subscribe(spy);

      const splitDebug = fixture.debugElement.query(
        By.directive(SlideSplitComponent),
      );
      splitDebug.componentInstance.sectorChange.emit("Coach sportif");

      expect(spy).toHaveBeenCalledWith("Coach sportif");
    });

    it("devrait relayer generate emis par SlideSplitComponent", () => {
      setupInputs("split");
      const spy = jasmine.createSpy("generate");
      component.generate.subscribe(spy);
      const template: PromptTemplate = {
        label: "Votre secteur",
        placeholder: "ex: Coach sportif",
        template: "Secteur : {{sector}}",
      };

      const splitDebug = fixture.debugElement.query(
        By.directive(SlideSplitComponent),
      );
      splitDebug.componentInstance.generate.emit(template);

      expect(spy).toHaveBeenCalledWith(template);
    });

    it("devrait relayer copyPrompt emis par SlideSplitComponent", () => {
      setupInputs("split");
      const spy = jasmine.createSpy("copyPrompt");
      component.copyPrompt.subscribe(spy);

      const splitDebug = fixture.debugElement.query(
        By.directive(SlideSplitComponent),
      );
      splitDebug.componentInstance.copyPrompt.emit();

      expect(spy).toHaveBeenCalled();
    });

    it("devrait propager le clic sur le bouton Notes jusqu au parent", () => {
      // Test de bout en bout : on monte un composant hote qui utilise
      // <app-slide-renderer> avec un binding template reel (toggleNotes).
      // Un clic sur le bouton Notes du SlideSplitComponent doit declencher
      // l'output du renderer, donc mettre a jour le signal du parent.
      @Component({
        standalone: true,
        imports: [SlideRendererComponent],
        template: `
          <app-slide-renderer
            [slide]="slide"
            [index]="0"
            [total]="1"
            [expandedNotes]="expanded()"
            (toggleNotes)="onToggle($event)"
          />
        `,
      })
      class HostComponent {
        readonly expanded = signal<Set<number>>(new Set());
        readonly slide: Slide = buildSlide({
          id: "host-slide",
          title: "Avec notes",
          layout: "split",
          notes: "Notes du presentateur",
        });
        lastIndex: number | null = null;
        onToggle(index: number): void {
          this.lastIndex = index;
        }
      }

      const hostFixture = TestBed.createComponent(HostComponent);
      hostFixture.detectChanges();

      const notesButton: HTMLButtonElement | null =
        hostFixture.nativeElement.querySelector(
          "button[aria-controls='notes-0']",
        );
      expect(notesButton)
        .withContext("Bouton Notes present dans le DOM")
        .toBeTruthy();
      notesButton!.click();
      hostFixture.detectChanges();

      expect(hostFixture.componentInstance.lastIndex).toBe(0);
    });
  });
});
