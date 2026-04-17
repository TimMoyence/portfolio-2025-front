import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { SebastianPresentationComponent } from "./sebastian-presentation.component";

/**
 * Tests comportementaux de SebastianPresentationComponent.
 *
 * Ce composant est une landing marketing avec des donnees fictives
 * hardcodees (badges, heatmap, BAC, etc.). On ne teste PAS les valeurs
 * de la maquette (elles changent avec le contenu marketing sans que cela
 * soit un bug), on teste uniquement :
 *   1. Le rendu basique (smoke) pour detecter un crash d'initialisation.
 *   2. Les CTAs qui engagent l'utilisateur (login, ancres de navigation).
 *   3. Les computed signals (pourcentages) qui transforment les donnees.
 */
describe("SebastianPresentationComponent", () => {
  let fixture: ComponentFixture<SebastianPresentationComponent>;
  let component: SebastianPresentationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SebastianPresentationComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SebastianPresentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait initialiser sans crash", () => {
    expect(component).toBeTruthy();
  });

  it("devrait exposer un CTA qui mene vers /login", () => {
    const loginLink = fixture.nativeElement.querySelector('a[href="/login"]');
    expect(loginLink).toBeTruthy();
  });

  it("devrait exposer une ancre 'decouvrir' vers la section explicative", () => {
    expect(fixture.nativeElement.querySelector('a[href="#how"]')).toBeTruthy();
  });

  it("devrait calculer coffeePercent en fonction du ratio current/goal", () => {
    const ratio =
      component.dailyCounts.coffee.current / component.dailyCounts.coffee.goal;
    const expectedPct = `${Math.round(ratio * 100)}%`;
    expect(component.coffeePercent()).toBe(expectedPct);
  });

  it("devrait calculer alcoholPercent en fonction du ratio current/goal", () => {
    const ratio =
      component.dailyCounts.alcohol.current /
      component.dailyCounts.alcohol.goal;
    const expectedPct = `${Math.round(ratio * 100)}%`;
    expect(component.alcoholPercent()).toBe(expectedPct);
  });
});
