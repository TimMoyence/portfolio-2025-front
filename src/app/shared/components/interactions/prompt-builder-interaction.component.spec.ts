import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { Component } from "@angular/core";
import { PromptBuilderInteractionComponent } from "./prompt-builder-interaction.component";
import { buildPromptBuilderInteraction } from "../../../../testing/factories/slide.factory";
import type { PromptBuilderInteraction } from "../../models/slide.model";

@Component({
  standalone: true,
  imports: [PromptBuilderInteractionComponent],
  template: `<app-prompt-builder-interaction [config]="config" />`,
})
class TestHostComponent {
  config: PromptBuilderInteraction = buildPromptBuilderInteraction();
}

/** Saisit une valeur dans l'input du secteur et propage le changement. */
function saisirSecteur(
  fixture: ComponentFixture<TestHostComponent>,
  valeur: string,
): void {
  const el = fixture.nativeElement as HTMLElement;
  const input = el.querySelector<HTMLInputElement>("input");
  if (!input) {
    throw new Error("Input secteur introuvable");
  }
  input.value = valeur;
  input.dispatchEvent(new Event("input"));
  fixture.detectChanges();
}

describe("PromptBuilderInteractionComponent", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let writeTextSpy: jasmine.Spy<(data: string) => Promise<void>>;

  beforeEach(async () => {
    writeTextSpy = jasmine
      .createSpy<(data: string) => Promise<void>>("writeText")
      .and.resolveTo();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextSpy },
      configurable: true,
    });

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it("devrait afficher le contexte de l'exercice", () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain("Newsletter hebdo IA");
  });

  it("devrait exposer le placeholder sur le champ de saisie", () => {
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector<HTMLInputElement>("input");
    expect(input?.placeholder).toBe("Ex: SaaS B2B");
  });

  it("devrait masquer le prompt tant que le secteur est vide", () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector("[data-testid='generated-prompt']")).toBeNull();
    expect(el.querySelector("[data-testid='copy-button']")).toBeNull();
  });

  it("devrait substituer le secteur saisi dans le prompt", () => {
    saisirSecteur(fixture, "conseil RH");
    const el = fixture.nativeElement as HTMLElement;
    const prompt = el.querySelector("[data-testid='generated-prompt']");

    expect(prompt?.textContent).toContain("Tu es expert conseil RH.");
    expect(prompt?.textContent).not.toContain("{{sector}}");
  });

  it("devrait ignorer une saisie composee uniquement d'espaces", () => {
    saisirSecteur(fixture, "   ");
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector("[data-testid='generated-prompt']")).toBeNull();
  });

  it("devrait copier le prompt substitue dans le presse-papier", fakeAsync(() => {
    saisirSecteur(fixture, "SaaS B2B");
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLButtonElement>("[data-testid='copy-button']")?.click();
    tick();

    expect(writeTextSpy).toHaveBeenCalledOnceWith(
      "Tu es expert SaaS B2B. Redige un resume.",
    );

    tick(2000);
  }));

  it("devrait confirmer la copie apres un succes", fakeAsync(() => {
    saisirSecteur(fixture, "SaaS B2B");
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLButtonElement>("[data-testid='copy-button']")?.click();
    tick();
    fixture.detectChanges();

    expect(el.querySelector("[data-testid='copy-feedback']")).toBeTruthy();

    tick(2000);
  }));

  it("devrait masquer la confirmation apres le delai de retour visuel", fakeAsync(() => {
    saisirSecteur(fixture, "SaaS B2B");
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLButtonElement>("[data-testid='copy-button']")?.click();
    tick();
    fixture.detectChanges();
    expect(el.querySelector("[data-testid='copy-feedback']")).toBeTruthy();

    tick(2000);
    fixture.detectChanges();

    expect(el.querySelector("[data-testid='copy-feedback']")).toBeNull();
  }));

  it("devrait signaler un echec de copie sans le masquer", fakeAsync(() => {
    writeTextSpy.and.rejectWith(new Error("refus navigateur"));
    saisirSecteur(fixture, "SaaS B2B");
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLButtonElement>("[data-testid='copy-button']")?.click();
    tick();
    fixture.detectChanges();

    expect(el.querySelector("[data-testid='copy-error']")).toBeTruthy();
    expect(el.querySelector("[data-testid='copy-feedback']")).toBeNull();
  }));

  it("devrait utiliser le libelle de bouton personnalise quand il est fourni", () => {
    fixture.componentInstance.config = buildPromptBuilderInteraction({
      ctaLabel: "Copier mon prompt",
    });
    fixture.detectChanges();
    saisirSecteur(fixture, "SaaS B2B");

    const el = fixture.nativeElement as HTMLElement;
    const bouton = el.querySelector("[data-testid='copy-button']");
    expect(bouton?.textContent).toContain("Copier mon prompt");
  });
});
