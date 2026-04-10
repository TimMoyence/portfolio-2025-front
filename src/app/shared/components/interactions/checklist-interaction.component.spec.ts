import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { ChecklistInteractionComponent } from "./checklist-interaction.component";
import { buildChecklistInteraction } from "../../../../testing/factories/slide.factory";
import type { ChecklistInteraction } from "../../models/slide.model";

@Component({
  standalone: true,
  imports: [ChecklistInteractionComponent],
  template: `<app-checklist-interaction [config]="config" />`,
})
class TestHostComponent {
  config: ChecklistInteraction = buildChecklistInteraction();
}

describe("ChecklistInteractionComponent", () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it("devrait creer le composant", () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector("app-checklist-interaction")).toBeTruthy();
  });

  it("devrait afficher la question", () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain("Lesquels utilisez-vous deja ?");
  });

  it("devrait afficher tous les items avec des checkboxes", () => {
    const el = fixture.nativeElement as HTMLElement;
    const checkboxes = el.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(3);
    expect(el.textContent).toContain("ChatGPT");
    expect(el.textContent).toContain("Claude");
    expect(el.textContent).toContain("Gemini");
  });

  it("devrait ne pas afficher le compteur quand rien n'est coche", () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain("sélectionnés");
  });

  it("devrait afficher le compteur quand des items sont coches", () => {
    const el = fixture.nativeElement as HTMLElement;
    const labels = el.querySelectorAll<HTMLDivElement>("[role='checkbox']");

    labels[0].click();
    fixture.detectChanges();

    expect(el.textContent).toContain("1/3 sélectionnés");

    labels[2].click();
    fixture.detectChanges();

    expect(el.textContent).toContain("2/3 sélectionnés");
  });

  it("devrait decocher un item au deuxieme clic", () => {
    const el = fixture.nativeElement as HTMLElement;
    const labels = el.querySelectorAll<HTMLDivElement>("[role='checkbox']");

    labels[0].click();
    fixture.detectChanges();
    expect(el.textContent).toContain("1/3 sélectionnés");

    labels[0].click();
    fixture.detectChanges();
    expect(el.textContent).not.toContain("sélectionnés");
  });
});
