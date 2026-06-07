import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { PLATFORM_ID } from "@angular/core";
import {
  AsiliPillarsComponent,
  type AsiliPillar,
} from "./asili-pillars.component";

const PILLARS: readonly AsiliPillar[] = [
  {
    variant: "services",
    tag: "01 — Services premium",
    title: "On batit ce qu'il vous faut.",
    desc: "Interventions ciblees, projets structurants.",
    items: [
      "Audit & cadrage avant tout chantier",
      "Developpement Angular / NestJS sur-mesure",
    ],
    link: { label: "Decouvrir l'offre", href: "/offer" },
  },
  {
    variant: "formations",
    tag: "02 — Formations premium",
    title: "On vous rend autonome.",
    desc: "Des formations qui font monter en gamme.",
    items: ["IA pour solopreneurs", "Automatiser avec l'IA"],
    link: { label: "Voir les formations", href: "/formations" },
  },
];

describe("AsiliPillarsComponent", () => {
  let fixture: ComponentFixture<AsiliPillarsComponent>;

  function setup(platformId: "browser" | "server" = "browser"): void {
    TestBed.configureTestingModule({
      imports: [AsiliPillarsComponent],
      providers: [{ provide: PLATFORM_ID, useValue: platformId }],
    });
    fixture = TestBed.createComponent(AsiliPillarsComponent);
    fixture.componentRef.setInput("pillars", PILLARS);
  }

  // Isolation : la classe `anim-ready` vit sur <html> (singleton partagé entre
  // tous les specs Karma). On la retire avant ET après chaque test pour
  // immuniser l'assertion SSR « pas d'anim-ready » contre une fuite d'état
  // laissée par un spec précédent (ex. home/presentation/offer) qui aurait
  // rendu un `appReveal` en plateforme browser sans nettoyer, quel que soit
  // l'ordre d'exécution randomisé.
  beforeEach(() => {
    document.documentElement.classList.remove("anim-ready");
  });

  afterEach(() => {
    document.documentElement.classList.remove("anim-ready");
  });

  it("se cree", () => {
    setup();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("rend un pilier par element de `pillars`", () => {
    setup();
    fixture.detectChanges();
    const pillars = fixture.nativeElement.querySelectorAll(".pillar");
    expect(pillars.length).toBe(PILLARS.length);
  });

  it("applique la variante en classe (services / formations)", () => {
    setup();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector(".pillar.services"),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector(".pillar.formations"),
    ).not.toBeNull();
  });

  it("rend chaque titre de pilier dans un <h3>", () => {
    setup();
    fixture.detectChanges();
    const titles = Array.from(
      fixture.nativeElement.querySelectorAll(".pillar h3"),
    ).map((el) => (el as HTMLElement).textContent?.trim());
    expect(titles).toEqual(PILLARS.map((p) => p.title));
  });

  it("rend le tag, la description et les points cles de chaque pilier", () => {
    setup();
    fixture.detectChanges();
    const tags = Array.from(
      fixture.nativeElement.querySelectorAll(".pillar-tag"),
    ).map((el) => (el as HTMLElement).textContent?.trim());
    expect(tags).toEqual(PILLARS.map((p) => p.tag));

    const firstItems = fixture.nativeElement
      .querySelector(".pillar.services ul")
      ?.querySelectorAll("li");
    expect(firstItems?.length).toBe(PILLARS[0].items.length);
  });

  it("rend une coche .tick masquee aux lecteurs d'ecran par point cle", () => {
    setup();
    fixture.detectChanges();
    const ticks = fixture.nativeElement.querySelectorAll(".pillar li .tick");
    const totalItems = PILLARS.reduce((n, p) => n + p.items.length, 0);
    expect(ticks.length).toBe(totalItems);
    expect((ticks[0] as HTMLElement).getAttribute("aria-hidden")).toBe("true");
  });

  it("rend le lien de pied en .link-arrow avec son href", () => {
    setup();
    fixture.detectChanges();
    const links = Array.from(
      fixture.nativeElement.querySelectorAll(".pillar-foot .link-arrow"),
    ) as HTMLAnchorElement[];
    expect(links.length).toBe(2);
    expect(links[0].getAttribute("href")).toBe("/offer");
    expect(links[0].textContent).toContain("Decouvrir l'offre");
  });

  it("n'affiche ni liste ni pied quand items vide et lien absent", () => {
    setup();
    fixture.componentRef.setInput("pillars", [
      {
        variant: "services",
        tag: "01",
        title: "Sans extra",
        desc: "Minimal.",
        items: [],
      },
    ] satisfies AsiliPillar[]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".pillar ul")).toBeNull();
    expect(fixture.nativeElement.querySelector(".pillar-foot")).toBeNull();
  });

  it("affiche le kicker, le titre <h2> et l'intro quand fournis en inputs", () => {
    setup();
    fixture.componentRef.setInput("kicker", "Deux facons de travailler");
    fixture.componentRef.setInput("heading", "Services & Formations");
    fixture.componentRef.setInput("intro", "A parts egales.");
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector(".kicker")?.textContent,
    ).toContain("Deux facons de travailler");
    expect(fixture.nativeElement.querySelector("h2")?.textContent).toContain(
      "Services & Formations",
    );
    expect(
      fixture.nativeElement.querySelector(".pillars-head__intro")?.textContent,
    ).toContain("A parts egales.");
  });

  it("n'affiche ni kicker ni titre ni intro quand non fournis", () => {
    setup();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".kicker")).toBeNull();
    expect(fixture.nativeElement.querySelector("h2")).toBeNull();
    expect(
      fixture.nativeElement.querySelector(".pillars-head__intro"),
    ).toBeNull();
  });

  it("reste rendu cote serveur (SSR fail-open : pas d'anim-ready)", () => {
    setup("server");
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll(".pillar").length).toBe(
      PILLARS.length,
    );
    expect(document.documentElement.classList).not.toContain("anim-ready");
  });
});
