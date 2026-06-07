import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { FormationsListComponent } from "./formations-list.component";
import { FORMATION_BENEFITS, FORMATIONS } from "./formations-list.data";

describe("FormationsListComponent", () => {
  let component: FormationsListComponent;
  let fixture: ComponentFixture<FormationsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormationsListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormationsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Le rendu browser des sections `appReveal` pose `anim-ready` sur <html>
  // (singleton partagé). On nettoie pour ne pas polluer les specs suivants.
  afterEach(() => {
    document.documentElement.classList.remove("anim-ready");
  });

  it("devrait etre cree", () => {
    expect(component).toBeTruthy();
  });

  it("devrait exposer la liste des formations depuis les donnees statiques", () => {
    expect(component["formations"]).toBe(FORMATIONS);
    expect(component["formations"].length).toBe(4);
  });

  it("devrait composer les sections Asili (hero, grille, format, bande CTA)", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("app-asili-hero")).not.toBeNull();
    expect(compiled.querySelector(".formation-grid")).not.toBeNull();
    expect(compiled.querySelector(".fo-benefits")).not.toBeNull();
    expect(compiled.querySelector("app-asili-cta-band")).not.toBeNull();
  });

  it("devrait rendre un unique titre de hero (format diapo)", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const headings = compiled.querySelectorAll("h1");
    expect(headings.length).toBe(1);
    expect(headings[0]?.textContent).toContain("Du concret");
    expect(headings[0]?.textContent).toContain("format diapo");
  });

  it("devrait rendre une carte pour chaque formation", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll(".formation-grid .formation");
    expect(cards.length).toBe(FORMATIONS.length);
  });

  it("devrait afficher le titre, la description et le badge de chaque carte", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    for (const formation of FORMATIONS) {
      expect(compiled.textContent)
        .withContext(`Le titre "${formation.title}" devrait etre visible`)
        .toContain(formation.title);
      expect(compiled.textContent)
        .withContext(
          `La description de "${formation.title}" devrait etre visible`,
        )
        .toContain(formation.description);
      expect(compiled.textContent)
        .withContext(`Le badge "${formation.badge}" devrait etre visible`)
        .toContain(formation.badge);
    }
  });

  it("devrait afficher les lignes meta de chaque carte", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    for (const formation of FORMATIONS) {
      for (const row of formation.meta) {
        expect(compiled.textContent).toContain(row.key);
        expect(compiled.textContent).toContain(row.value);
      }
    }
  });

  it("devrait avoir un lien d'action vers la cible de chaque carte", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll("a"));
    for (const formation of FORMATIONS) {
      const link = links.find((a) =>
        a.getAttribute("href")?.includes(formation.link),
      );
      expect(link)
        .withContext(`Un lien vers ${formation.link} devrait exister`)
        .toBeTruthy();
    }
  });

  it("devrait inclure la carte bonus toolkit vers la capture email", () => {
    const bonus = FORMATIONS.find((f) => f.variant === "bonus");
    expect(bonus).toBeDefined();
    expect(bonus?.link).toBe("/formations/ia-solopreneurs/toolkit");

    const compiled = fixture.nativeElement as HTMLElement;
    const bonusCard = compiled.querySelector(".formation.formation--bonus");
    expect(bonusCard).not.toBeNull();
  });

  it("devrait rendre les trois benefices du format diapo", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const benefits = compiled.querySelectorAll(".fo-benefits .fo-benefit");
    expect(benefits.length).toBe(FORMATION_BENEFITS.length);
    for (const benefit of FORMATION_BENEFITS) {
      expect(compiled.textContent).toContain(benefit.title);
      expect(compiled.textContent).toContain(benefit.desc);
    }
  });
});
