import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { PollInteractionComponent } from "./poll-interaction.component";
import { buildPollInteraction } from "../../../../testing/factories/slide.factory";
import type { PollInteraction } from "../../models/slide.model";

@Component({
  standalone: true,
  imports: [PollInteractionComponent],
  template: `<app-poll-interaction [poll]="poll" />`,
})
class TestHostComponent {
  poll: PollInteraction = buildPollInteraction();
}

describe("PollInteractionComponent", () => {
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
    expect(el.querySelector("app-poll-interaction")).toBeTruthy();
  });

  it("devrait afficher la question du sondage", () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain("Qui utilise deja l'IA ?");
  });

  it("devrait commencer en etat idle avec le bouton lancer", () => {
    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector("button");
    expect(button?.textContent?.trim()).toBe("Lancer le sondage");
  });

  it("devrait passer en mode voting au clic sur lancer", () => {
    const el = fixture.nativeElement as HTMLElement;
    const launchButton = el.querySelector("button")!;
    launchButton.click();
    fixture.detectChanges();

    const options = el.querySelectorAll("button:not([class*='bg-gray-900'])");
    // 3 options + 1 "Voir les resultats"
    expect(options.length).toBeGreaterThanOrEqual(3);
    expect(el.textContent).toContain("Oui");
    expect(el.textContent).toContain("Non");
    expect(el.textContent).toContain("Je ne sais pas");
  });

  it("devrait incrementer le compteur au clic sur une option", () => {
    const el = fixture.nativeElement as HTMLElement;
    // Lancer le sondage
    el.querySelector("button")!.click();
    fixture.detectChanges();

    // Cliquer sur la premiere option 3 fois
    const optionButtons =
      el.querySelectorAll<HTMLButtonElement>(".space-y-2 button");
    expect(optionButtons.length).toBe(3);
    optionButtons[0].click();
    optionButtons[0].click();
    optionButtons[0].click();
    fixture.detectChanges();

    // Le compteur devrait afficher 3
    const badge = optionButtons[0].querySelector("span:last-child");
    expect(badge?.textContent?.trim()).toBe("3");
  });

  it("devrait afficher les resultats avec pourcentages", () => {
    const el = fixture.nativeElement as HTMLElement;
    // Lancer le sondage
    el.querySelector("button")!.click();
    fixture.detectChanges();

    // Voter
    const optionButtons =
      el.querySelectorAll<HTMLButtonElement>(".space-y-2 button");
    optionButtons[0].click();
    optionButtons[0].click();
    optionButtons[1].click();
    fixture.detectChanges();

    // Voir les resultats
    const resultsButton =
      el.querySelector<HTMLButtonElement>("button.bg-gray-900")!;
    resultsButton.click();
    fixture.detectChanges();

    // Verifier les barres de resultats
    expect(el.textContent).toContain("67%"); // 2/3
    expect(el.textContent).toContain("33%"); // 1/3
  });

  it("devrait permettre de recommencer", () => {
    const el = fixture.nativeElement as HTMLElement;
    // Lancer → voter → resultats
    el.querySelector("button")!.click();
    fixture.detectChanges();
    el.querySelectorAll<HTMLButtonElement>(".space-y-2 button")[0].click();
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>("button.bg-gray-900")!.click();
    fixture.detectChanges();

    // Recommencer
    const resetButton = el.querySelector<HTMLButtonElement>(
      "button.text-gray-400",
    )!;
    resetButton.click();
    fixture.detectChanges();

    // Retour a idle
    expect(el.textContent).toContain("Lancer le sondage");
  });
});
