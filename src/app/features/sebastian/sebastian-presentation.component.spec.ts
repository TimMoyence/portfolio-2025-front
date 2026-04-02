import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { SebastianPresentationComponent } from "./sebastian-presentation.component";

describe("SebastianPresentationComponent", () => {
  let component: SebastianPresentationComponent;
  let fixture: ComponentFixture<SebastianPresentationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SebastianPresentationComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SebastianPresentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait afficher le composant hero-section", () => {
    // Arrange & Act — le composant est deja rendu dans beforeEach
    const heroEl = fixture.nativeElement.querySelector("app-hero-section");

    // Assert
    expect(heroEl).toBeTruthy();
  });

  it("devrait transmettre les donnees hero au composant hero-section", () => {
    // Arrange & Act
    const heroTitle = fixture.nativeElement.querySelector(
      "[data-testid='hero-title']",
    );

    // Assert
    expect(heroTitle).toBeTruthy();
    expect(heroTitle.textContent).toContain("Sebastian");
  });

  it("devrait contenir les informations de presentation", () => {
    // Arrange & Act
    const content = fixture.nativeElement.textContent as string;

    // Assert
    expect(content).toContain("Votre majordome personnel");
    expect(content).toContain("consommation personnelle");
  });

  it("devrait contenir un lien vers la page de connexion", () => {
    // Arrange & Act
    const ctaLink: HTMLAnchorElement | null =
      fixture.nativeElement.querySelector('a[routerLink="/login"]');

    // Assert
    expect(ctaLink).toBeTruthy();
    expect(ctaLink!.textContent!.trim()).toContain("Se connecter");
  });

  it("devrait exposer les donnees hero avec les valeurs attendues", () => {
    // Assert
    expect(component.hero.label).toContain("Side-project");
    expect(component.hero.title).toContain("Sebastian");
    expect(component.hero.description).toBeTruthy();
    expect(component.hero.actions.length).toBe(1);
    expect(component.hero.actions[0].variant).toBe("primary");
    expect(component.hero.actions[0].href).toBe("/login");
  });
});
