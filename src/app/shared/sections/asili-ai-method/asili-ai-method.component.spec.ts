import { Component } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { PLATFORM_ID } from "@angular/core";
import type { AsiliAiMethodStep } from "./asili-ai-method.component";
import { AsiliAiMethodComponent } from "./asili-ai-method.component";

const STEPS: readonly AsiliAiMethodStep[] = [
  {
    num: "01",
    title: "Un agent par tache",
    desc: "Decoupage clair, chaque agent a un role precis.",
  },
  {
    num: "02",
    title: "Revue croisee",
    desc: "Les agents se relisent ; rien ne passe sans controle.",
  },
  {
    num: "03",
    title: "Verification adversariale",
    desc: "On cherche activement a casser avant de valider.",
  },
  {
    num: "04",
    title: "TDD + architecture durable",
    desc: "Un test qui echoue d'abord ; DDD & clean archi ensuite.",
  },
];

const HEADING = "L'IA amplifie une expertise. Elle ne la remplace pas.";
const LEAD = "Je travaille en orchestration multi-agents.";
const RULE =
  "« L'IA genere du contenu.<br/><em>Un expert genere des resultats.</em> »";
const RULE_WHO = "La regle d'or — la meme que dans mes formations";

describe("AsiliAiMethodComponent", () => {
  let fixture: ComponentFixture<AsiliAiMethodComponent>;

  function setup(
    steps: readonly AsiliAiMethodStep[] = STEPS,
    platformId: "browser" | "server" = "browser",
  ): void {
    TestBed.configureTestingModule({
      imports: [AsiliAiMethodComponent],
      providers: [{ provide: PLATFORM_ID, useValue: platformId }],
    });
    fixture = TestBed.createComponent(AsiliAiMethodComponent);
    fixture.componentRef.setInput("steps", steps);
  }

  afterEach(() => {
    document.documentElement.classList.remove("anim-ready");
  });

  it("se cree", () => {
    setup();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("applique le theme sombre via .theme-night", () => {
    setup();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector("section.theme-night .ai-method")).not.toBeNull();
  });

  it("rend une carte .ai-step par etape, avec numero/titre/description", () => {
    setup();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const steps = host.querySelectorAll<HTMLElement>(".ai-step");
    expect(steps.length).toBe(STEPS.length);
    expect(steps[0].querySelector(".ai-n")?.textContent?.trim()).toBe("01");
    expect(steps[0].querySelector(".ai-t")?.textContent?.trim()).toBe(
      "Un agent par tache",
    );
    expect(steps[0].querySelector(".ai-d")?.textContent?.trim()).toBe(
      "Decoupage clair, chaque agent a un role precis.",
    );
  });

  it("affiche le kicker, le titre <h2> et l'accroche quand fournis en inputs", () => {
    setup();
    fixture.componentRef.setInput("kicker", "Ma maniere de travailler");
    fixture.componentRef.setInput("heading", HEADING);
    fixture.componentRef.setInput("lead", LEAD);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector(".kicker")?.textContent).toContain(
      "Ma maniere de travailler",
    );
    const h2 = host.querySelector<HTMLElement>("h2.ai-method-title");
    expect(h2).not.toBeNull();
    expect(h2?.textContent?.trim()).toBe(HEADING);
    expect(host.querySelector(".ai-method-lead")?.textContent?.trim()).toBe(
      LEAD,
    );
  });

  it("n'affiche ni entete ni regle d'or quand non fournis", () => {
    setup();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector(".kicker")).toBeNull();
    expect(host.querySelector("h2.ai-method-title")).toBeNull();
    expect(host.querySelector(".ai-method-lead")).toBeNull();
    expect(host.querySelector(".ai-rule")).toBeNull();
  });

  it("rend la regle d'or avec accent teal <em> via innerHTML, dans une <blockquote>", () => {
    setup();
    fixture.componentRef.setInput("rule", RULE);
    fixture.componentRef.setInput("ruleWho", RULE_WHO);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const rule = host.querySelector<HTMLElement>("blockquote.ai-rule");
    expect(rule).not.toBeNull();
    const accent = rule?.querySelector<HTMLElement>("p em");
    expect(accent).not.toBeNull();
    expect(accent?.textContent?.trim()).toBe("Un expert genere des resultats.");
    expect(rule?.querySelector(".ai-rule-who")?.textContent?.trim()).toBe(
      RULE_WHO,
    );
  });

  it("affiche la regle sans signature quand ruleWho n'est pas fourni", () => {
    setup();
    fixture.componentRef.setInput("rule", RULE);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector("blockquote.ai-rule")).not.toBeNull();
    expect(host.querySelector(".ai-rule-who")).toBeNull();
  });

  it("reste rendu cote serveur (SSR fail-open : pas d'anim-ready)", () => {
    setup(STEPS, "server");
    fixture.componentRef.setInput("heading", HEADING);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll(".ai-step").length).toBe(STEPS.length);
    expect(host.querySelector("h2.ai-method-title")).not.toBeNull();
    expect(document.documentElement.classList).not.toContain("anim-ready");
  });

  describe("avec projection (page hote)", () => {
    @Component({
      standalone: true,
      imports: [AsiliAiMethodComponent],
      template: `
        <app-asili-ai-method [steps]="steps">
          <span kicker class="kicker">Slot kicker</span>
          <h2 heading class="h-xl ai-method-title">
            L'IA amplifie. Elle ne <em>remplace pas</em>.
          </h2>
          <p lead class="lead ai-method-lead">Accroche projetee.</p>
        </app-asili-ai-method>
      `,
    })
    class HostComponent {
      readonly steps = STEPS;
    }

    it("projette le kicker, le titre riche (accent <em>) et l'accroche", () => {
      const hostFixture = TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [{ provide: PLATFORM_ID, useValue: "browser" }],
      }).createComponent(HostComponent);
      hostFixture.detectChanges();

      const host = hostFixture.nativeElement as HTMLElement;
      expect(host.querySelector(".kicker")?.textContent).toContain(
        "Slot kicker",
      );
      const accent = host.querySelector<HTMLElement>(".ai-method-title em");
      expect(accent?.textContent?.trim()).toBe("remplace pas");
      expect(host.querySelector(".ai-method-lead")?.textContent).toContain(
        "Accroche projetee.",
      );
    });
  });
});
