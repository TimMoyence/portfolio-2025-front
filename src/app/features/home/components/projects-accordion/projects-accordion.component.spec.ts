import { PLATFORM_ID } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ProjectsAccordionComponent } from "./projects-accordion.component";

describe("ProjectsAccordionComponent", () => {
  describe("en contexte navigateur", () => {
    let component: ProjectsAccordionComponent;
    let fixture: ComponentFixture<ProjectsAccordionComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ProjectsAccordionComponent],
        providers: [{ provide: PLATFORM_ID, useValue: "browser" }],
      }).compileComponents();

      fixture = TestBed.createComponent(ProjectsAccordionComponent);
      component = fixture.componentInstance;
    });

    it("devrait se creer", () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });
  });

  describe("en contexte serveur (SSR)", () => {
    let component: ProjectsAccordionComponent;
    let fixture: ComponentFixture<ProjectsAccordionComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ProjectsAccordionComponent],
        providers: [{ provide: PLATFORM_ID, useValue: "server" }],
      }).compileComponents();

      fixture = TestBed.createComponent(ProjectsAccordionComponent);
      component = fixture.componentInstance;
    });

    it("devrait se creer en SSR", () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it("setActiveIndex ne devrait pas crasher en SSR", () => {
      expect(() => component.setActiveIndex(1)).not.toThrow();
      expect(component.activeIndex).toBe(1);
    });
  });
});
