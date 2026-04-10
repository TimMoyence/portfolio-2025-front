import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { ReflectionInteractionComponent } from "./reflection-interaction.component";
import { buildReflectionInteraction } from "../../../../testing/factories/slide.factory";
import type { ReflectionInteraction } from "../../models/slide.model";

@Component({
  standalone: true,
  imports: [ReflectionInteractionComponent],
  template: `<app-reflection-interaction [config]="config" />`,
})
class TestHostComponent {
  config: ReflectionInteraction = buildReflectionInteraction();
}

describe("ReflectionInteractionComponent", () => {
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
    expect(el.querySelector("app-reflection-interaction")).toBeTruthy();
  });

  it("devrait afficher la question", () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain(
      "Comment cela s'applique-t-il a votre activite ?",
    );
  });

  it("devrait afficher le textarea avec placeholder", () => {
    const el = fixture.nativeElement as HTMLElement;
    const textarea = el.querySelector("textarea")!;
    expect(textarea).toBeTruthy();
    expect(textarea.placeholder).toBe("Decrivez votre situation...");
  });

  it("devrait utiliser le nombre de lignes par defaut (3)", () => {
    const el = fixture.nativeElement as HTMLElement;
    const textarea = el.querySelector("textarea")!;
    expect(textarea.rows).toBe(3);
  });

  it("devrait afficher le feedback quand le lecteur repond", () => {
    const el = fixture.nativeElement as HTMLElement;
    const textarea = el.querySelector("textarea")!;

    // Pas de feedback avant
    expect(el.textContent).not.toContain("Merci pour votre réflexion");

    // Simuler une saisie
    textarea.value = "Ma reflexion ici";
    textarea.dispatchEvent(new Event("input"));
    fixture.detectChanges();

    expect(el.textContent).toContain("Merci pour votre réflexion");
  });

  it("devrait respecter le nombre de lignes personnalise", () => {
    const host = fixture.componentInstance;
    host.config = buildReflectionInteraction({ rows: 6 });
    fixture.detectChanges();

    const textarea = (fixture.nativeElement as HTMLElement).querySelector(
      "textarea",
    )!;
    expect(textarea.rows).toBe(6);
  });
});
