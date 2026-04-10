import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { SelfRatingInteractionComponent } from "./self-rating-interaction.component";
import { buildSelfRatingInteraction } from "../../../../testing/factories/slide.factory";
import type { SelfRatingInteraction } from "../../models/slide.model";

@Component({
  standalone: true,
  imports: [SelfRatingInteractionComponent],
  template: `<app-self-rating-interaction [config]="config" />`,
})
class TestHostComponent {
  config: SelfRatingInteraction = buildSelfRatingInteraction();
}

describe("SelfRatingInteractionComponent", () => {
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
    expect(el.querySelector("app-self-rating-interaction")).toBeTruthy();
  });

  it("devrait afficher la question", () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain("Ou en etes-vous ?");
  });

  it("devrait afficher les labels min et max", () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain("Debutant");
    expect(el.textContent).toContain("Expert");
  });

  it("devrait afficher 5 boutons pour une echelle 1-5", () => {
    const el = fixture.nativeElement as HTMLElement;
    const buttons = el.querySelectorAll("button");
    expect(buttons.length).toBe(5);
    expect(buttons[0].textContent?.trim()).toBe("1");
    expect(buttons[4].textContent?.trim()).toBe("5");
  });

  it("devrait ne pas afficher la reponse avant selection", () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain("Votre réponse");
  });

  it("devrait afficher la reponse apres selection", () => {
    const el = fixture.nativeElement as HTMLElement;
    const buttons = el.querySelectorAll<HTMLButtonElement>("button");
    buttons[2].click(); // Valeur 3
    fixture.detectChanges();

    expect(el.textContent).toContain("Votre réponse : 3/5");
  });

  it("devrait permettre de changer la selection", () => {
    const el = fixture.nativeElement as HTMLElement;
    const buttons = el.querySelectorAll<HTMLButtonElement>("button");

    buttons[0].click();
    fixture.detectChanges();
    expect(el.textContent).toContain("Votre réponse : 1/5");

    buttons[4].click();
    fixture.detectChanges();
    expect(el.textContent).toContain("Votre réponse : 5/5");
  });
});
