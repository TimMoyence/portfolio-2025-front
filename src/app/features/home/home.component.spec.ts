import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { HomeComponent } from "./home.component";

describe("HomeComponent", () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  // --- Sections composees (Lot 3a) ---

  it("devrait composer les sections Asili dans l'ordre attendu", () => {
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector("app-asili-hero")).not.toBeNull();
    expect(compiled.querySelector("app-asili-method")).not.toBeNull();
    expect(compiled.querySelector("app-asili-pillars")).not.toBeNull();
    expect(compiled.querySelector("app-asili-manifesto")).not.toBeNull();
    expect(compiled.querySelector("app-asili-projects-grid")).not.toBeNull();
    expect(compiled.querySelector("app-asili-cta-band")).not.toBeNull();
  });

  it("devrait rendre un unique h1 (titre du hero)", () => {
    const compiled: HTMLElement = fixture.nativeElement;
    const headings = compiled.querySelectorAll("h1");
    expect(headings.length).toBe(1);
    expect(headings[0].textContent).toContain("Clarifier");
  });

  it("devrait afficher la section Atelier immersive avec ses deux lab-cards", () => {
    const compiled: HTMLElement = fixture.nativeElement;
    const atelier = compiled.querySelector("section.atelier");
    expect(atelier).not.toBeNull();
    expect(atelier?.querySelectorAll(".lab-card").length).toBe(2);
    expect(compiled.querySelector(".lab-card.meteo-c")).not.toBeNull();
    expect(compiled.querySelector(".lab-card.seb-c")).not.toBeNull();
  });

  it("devrait lier les lab-cards vers les ateliers Météo et Sebastian", () => {
    const compiled: HTMLElement = fixture.nativeElement;
    const hrefs = Array.from(
      compiled.querySelectorAll<HTMLAnchorElement>(".lab-card a[href]"),
    ).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/atelier/meteo");
    expect(hrefs).toContain("/atelier/sebastian");
  });

  it("devrait afficher la bande CTA finale", () => {
    const compiled: HTMLElement = fixture.nativeElement;
    const cta = compiled.querySelector("app-asili-cta-band");
    expect(cta?.textContent).toContain("clarifiait");
  });

  // --- Donnees du composant ---

  it("devrait exposer 4 etapes de methode et 2 piliers", () => {
    expect(component["methodSteps"]).toHaveSize(4);
    expect(component["pillars"]).toHaveSize(2);
    expect(component["pillars"][0].variant).toBe("services");
    expect(component["pillars"][1].variant).toBe("formations");
  });

  it("devrait exposer un teaser de projets non vide", () => {
    expect(component["projects"].length).toBeGreaterThan(0);
  });
});
