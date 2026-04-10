import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { Component } from "@angular/core";
import { CountdownInteractionComponent } from "./countdown-interaction.component";
import type { CountdownInteraction } from "../../models/slide.model";

@Component({
  standalone: true,
  imports: [CountdownInteractionComponent],
  template: `<app-countdown-interaction [config]="config" />`,
})
class TestHostComponent {
  config: CountdownInteraction = {
    type: "countdown",
    label: "Reflechissez 5 secondes",
    durationSeconds: 5,
  };
}

describe("CountdownInteractionComponent", () => {
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
    expect(el.querySelector("app-countdown-interaction")).toBeTruthy();
  });

  it("devrait afficher le label", () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain("Reflechissez 5 secondes");
  });

  it("devrait commencer en etat idle avec le bouton lancer", () => {
    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector("button");
    expect(button?.textContent?.trim()).toBe("Lancer le timer");
  });

  it("devrait demarrer le decompte au clic", fakeAsync(() => {
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector("button")!.click();
    fixture.detectChanges();

    // Devrait afficher 5
    expect(el.textContent).toContain("5");

    // Avancer de 2 secondes
    tick(2000);
    fixture.detectChanges();
    expect(el.textContent).toContain("3");

    // Nettoyer le timer restant
    tick(3000);
    fixture.detectChanges();
  }));

  it("devrait passer a done quand le decompte atteint 0", fakeAsync(() => {
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector("button")!.click();
    fixture.detectChanges();

    // Laisser le decompte se terminer
    tick(5000);
    fixture.detectChanges();

    expect(el.textContent).toContain("Terminé !");
    expect(el.textContent).toContain("Recommencer");
  }));

  it("devrait permettre de recommencer", fakeAsync(() => {
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector("button")!.click();
    tick(5000);
    fixture.detectChanges();

    // Cliquer recommencer
    el.querySelector<HTMLButtonElement>("button.text-gray-400")!.click();
    fixture.detectChanges();

    expect(el.textContent).toContain("Lancer le timer");
  }));
});
