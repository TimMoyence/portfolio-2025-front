import { Component, PLATFORM_ID } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { of } from "rxjs";
import { WEATHER_PORT } from "../../../../core/ports/weather.port";
import {
  buildWeatherPreferences,
  createWeatherPortStub,
} from "../../../../../testing/factories/weather.factory";
import { WeatherLevelService } from "../../services/weather-level.service";
import { UnitPreferencesService } from "../../services/unit-preferences.service";
import { MetricCardComponent } from "./metric-card.component";

/**
 * Composant hote de test pour valider la content projection
 * et le two-way binding du MetricCardComponent.
 */
@Component({
  standalone: true,
  imports: [MetricCardComponent],
  template: `
    <app-metric-card
      tooltipId="test"
      tooltipTitle="Test title"
      tooltipContent="Test content"
      [expandable]="expandable"
      [unavailable]="unavailable"
      [variant]="variant"
      [(expanded)]="expanded"
    >
      <span cardTitle>Mon Titre</span>
      <p class="main-content">Contenu principal</p>
      <div cardDetail class="detail-content">Detail expand</div>
    </app-metric-card>
  `,
})
class TestHostComponent {
  expandable = false;
  unavailable = false;
  expanded = false;
  variant: "default" | "compact" | "wide" = "default";
}

describe("MetricCardComponent", () => {
  let host: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let weatherPortStub: ReturnType<typeof createWeatherPortStub>;

  beforeEach(async () => {
    weatherPortStub = createWeatherPortStub();
    weatherPortStub.getPreferences.and.returnValue(
      of(buildWeatherPreferences()),
    );
    weatherPortStub.updatePreferences.and.returnValue(
      of(buildWeatherPreferences()),
    );
    weatherPortStub.recordUsage.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [TestHostComponent, NoopAnimationsModule],
      providers: [
        { provide: PLATFORM_ID, useValue: "browser" },
        { provide: WEATHER_PORT, useValue: weatherPortStub },
        WeatherLevelService,
        UnitPreferencesService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(host).toBeTruthy();
  });

  it("devrait projeter le contenu [cardTitle]", () => {
    const el: HTMLElement = fixture.nativeElement;
    const title = el.querySelector("[cardTitle]");
    expect(title).toBeTruthy();
    expect(title!.textContent).toContain("Mon Titre");
  });

  it("devrait afficher le LearningTooltip", () => {
    const el: HTMLElement = fixture.nativeElement;
    const tooltip = el.querySelector("app-learning-tooltip");
    expect(tooltip).toBeTruthy();
  });

  it("devrait rendre le bouton expand quand expandable est true", () => {
    host.expandable = true;
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    // Selectionner le bouton expand via son aria-label (pas le tooltip)
    const expandBtn = el.querySelector<HTMLButtonElement>(
      'button[aria-label*="détails"], button[aria-label*="Afficher"], button[aria-label*="Réduire"]',
    );
    expect(expandBtn).toBeTruthy();
    expect(expandBtn!.querySelector("svg")).toBeTruthy();
  });

  it("devrait appliquer les classes compact", () => {
    host.variant = "compact";
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const container = el.querySelector("app-metric-card > div");
    expect(container).toBeTruthy();
    expect(container!.classList).toContain("p-3");
  });

  it("devrait afficher le fallback unavailable", () => {
    host.unavailable = true;
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain("indisponibles");

    const mainContent = el.querySelector(".main-content");
    expect(mainContent).toBeNull();
  });

  describe("SSR (PLATFORM_ID: server)", () => {
    let ssrFixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
      TestBed.resetTestingModule();

      const ssrWeatherPortStub = createWeatherPortStub();
      ssrWeatherPortStub.getPreferences.and.returnValue(
        of(buildWeatherPreferences()),
      );
      ssrWeatherPortStub.updatePreferences.and.returnValue(
        of(buildWeatherPreferences()),
      );
      ssrWeatherPortStub.recordUsage.and.returnValue(of(void 0));

      await TestBed.configureTestingModule({
        imports: [TestHostComponent, NoopAnimationsModule],
        providers: [
          { provide: PLATFORM_ID, useValue: "server" },
          { provide: WEATHER_PORT, useValue: ssrWeatherPortStub },
          WeatherLevelService,
          UnitPreferencesService,
        ],
      }).compileComponents();

      ssrFixture = TestBed.createComponent(TestHostComponent);
      ssrFixture.detectChanges();
    });

    it("devrait se rendre sans erreur en SSR", () => {
      expect(ssrFixture.componentInstance).toBeTruthy();

      const el: HTMLElement = ssrFixture.nativeElement;
      const container = el.querySelector("app-metric-card > div");
      expect(container).toBeTruthy();
    });
  });
});
