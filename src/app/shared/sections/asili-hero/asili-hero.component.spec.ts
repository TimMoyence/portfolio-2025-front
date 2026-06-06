import { Component } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { PLATFORM_ID } from "@angular/core";
import { AsiliHeroComponent } from "./asili-hero.component";

const KICKER = "Studio digital & IA · Bordeaux";
const LEAD = "Developpeur & consultant Angular, NestJS et IA.";

describe("AsiliHeroComponent", () => {
  let fixture: ComponentFixture<AsiliHeroComponent>;

  function setup(platformId: "browser" | "server" = "browser"): void {
    TestBed.configureTestingModule({
      imports: [AsiliHeroComponent],
      providers: [{ provide: PLATFORM_ID, useValue: platformId }],
    });
    fixture = TestBed.createComponent(AsiliHeroComponent);
  }

  afterEach(() => {
    document.documentElement.classList.remove("anim-ready");
  });

  it("se cree", () => {
    setup();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("structure le hero (.hero, .hero-inner, .hero-grid, voile)", () => {
    setup();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector("section.hero")).not.toBeNull();
    expect(root.querySelector(".hero .hero-inner")).not.toBeNull();
    expect(root.querySelector(".hero-inner .hero-grid")).not.toBeNull();
    expect(root.querySelector(".hero-veil")).not.toBeNull();
  });

  it("rend le titre via inputs avec l'accent italique teal", () => {
    setup();
    fixture.componentRef.setInput("titlePre", "Clarifier ");
    fixture.componentRef.setInput("accent", "avant");
    fixture.componentRef.setInput("titlePost", " de construire.");
    fixture.detectChanges();
    const h1 = fixture.nativeElement.querySelector("h1.hero-title");
    expect(h1).not.toBeNull();
    expect((h1 as HTMLElement).textContent?.replace(/\s+/g, " ").trim()).toBe(
      "Clarifier avant de construire.",
    );
    const accent = (h1 as HTMLElement).querySelector(".accent");
    expect(accent?.textContent).toBe("avant");
  });

  it("affiche la puce live quand `liveChip` est fourni", () => {
    setup();
    fixture.componentRef.setInput("liveChip", KICKER);
    fixture.detectChanges();
    const chip = fixture.nativeElement.querySelector(".live-chip");
    expect(chip?.textContent).toContain(KICKER);
    expect(chip?.querySelector(".live-dot")).not.toBeNull();
  });

  it("affiche le kicker mono quand `liveChip` est absent", () => {
    setup();
    fixture.componentRef.setInput("kicker", KICKER);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".live-chip")).toBeNull();
    expect(fixture.nativeElement.querySelector(".kicker")?.textContent).toBe(
      KICKER,
    );
  });

  it("affiche l'accroche et l'indication de scroll quand fournies", () => {
    setup();
    fixture.componentRef.setInput("lead", LEAD);
    fixture.componentRef.setInput("scrollHint", "Defiler");
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".lead")?.textContent).toBe(
      LEAD,
    );
    expect(
      fixture.nativeElement.querySelector(".scroll-hint")?.textContent,
    ).toContain("Defiler");
  });

  it("n'affiche pas l'indication de scroll quand non fournie", () => {
    setup();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".scroll-hint")).toBeNull();
  });

  it("reste rendu cote serveur (SSR fail-open : pas d'anim-ready)", () => {
    setup("server");
    fixture.componentRef.setInput("titlePre", "Clarifier.");
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector("h1.hero-title")).not.toBeNull();
    expect(document.documentElement.classList).not.toContain("anim-ready");
  });

  describe("avec projection (page hote)", () => {
    @Component({
      standalone: true,
      imports: [AsiliHeroComponent],
      template: `
        <app-asili-hero>
          <span chip class="live-chip"
            ><span class="live-dot"></span>Projection chip</span
          >
          <ng-container title
            >Clarifier <span class="accent">avant</span> de construire.
          </ng-container>
          <a cta class="btn btn-teal" href="/services">Voir</a>
          <a cta class="btn btn-ghost" href="/atelier">Essayer</a>
          <div meta>
            <div class="n">2</div>
            <div class="l">piliers</div>
          </div>
        </app-asili-hero>
      `,
    })
    class HostComponent {}

    it("projette la puce, le titre, les CTA et la meta fournis par la page", () => {
      const hostFixture = TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [{ provide: PLATFORM_ID, useValue: "browser" }],
      }).createComponent(HostComponent);
      hostFixture.detectChanges();

      const host = hostFixture.nativeElement as HTMLElement;
      expect(host.querySelector("[chip].live-chip")?.textContent).toContain(
        "Projection chip",
      );

      const h1 = host.querySelector("h1.hero-title");
      expect(h1?.querySelector(".accent")?.textContent).toBe("avant");

      const ctas = host.querySelectorAll(".hero-cta a[cta]");
      expect(ctas.length).toBe(2);
      expect((ctas[0] as HTMLAnchorElement).getAttribute("href")).toBe(
        "/services",
      );

      expect(host.querySelector(".hero-meta [meta] .n")?.textContent).toBe("2");
    });
  });
});
