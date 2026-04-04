import type { ComponentFixture } from "@angular/core/testing";
import {
  DeferBlockBehavior,
  DeferBlockState,
  TestBed,
} from "@angular/core/testing";
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
      deferBlockBehavior: DeferBlockBehavior.Manual,
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render the composed sections including contact and footer", async () => {
    const deferBlocks = await fixture.getDeferBlocks();
    for (const block of deferBlocks) {
      await block.render(DeferBlockState.Complete);
    }
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector("app-hero-section-home")).not.toBeNull();
    expect(compiled.querySelector("app-services-section")).not.toBeNull();
    expect(compiled.querySelector("app-cta-contact")).not.toBeNull();
  });

  // --- Sections composees ---

  it("devrait afficher la section hero au chargement initial (sans defer)", () => {
    const compiled: HTMLElement = fixture.nativeElement;
    // Le hero n'est pas dans un @defer, il est rendu immediatement
    expect(compiled.querySelector("app-hero-section-home")).not.toBeNull();
  });

  it("devrait afficher la section projets", () => {
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector("app-projects-accordion")).not.toBeNull();
  });

  it("devrait afficher la section mission", () => {
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector("app-mission-section")).not.toBeNull();
  });

  it("devrait afficher la section CTA", () => {
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector("app-cta-section")).not.toBeNull();
  });

  it("devrait afficher un placeholder avant le chargement du defer services", () => {
    const compiled: HTMLElement = fixture.nativeElement;
    // Avant le @defer, le placeholder (div.h-96) doit etre rendu
    const placeholder = compiled.querySelector(".h-96");
    expect(placeholder).not.toBeNull();
  });

  // --- Donnees du composant ---

  it("devrait exposer les donnees de la section services avec 4 services", () => {
    expect(component.servicesSection.services).toHaveSize(4);
    expect(component.servicesSection.kicker).toBeTruthy();
    expect(component.servicesSection.title).toBeTruthy();
  });

  it("devrait exposer les paragraphes de la section contact", () => {
    expect(component.contactSection.leadParagraphs).toHaveSize(2);
    expect(component.contactSection.leadParagraphs[0]).toBeTruthy();
  });
});
