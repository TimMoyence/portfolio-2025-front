import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import type { WeatherAlert } from "../../../../core/models/weather.model";
import { WeatherAlertsCardComponent } from "./weather-alerts-card.component";

describe("WeatherAlertsCardComponent", () => {
  let component: WeatherAlertsCardComponent;
  let fixture: ComponentFixture<WeatherAlertsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherAlertsCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherAlertsCardComponent);
    component = fixture.componentInstance;
  });

  it("devrait se creer", () => {
    fixture.componentRef.setInput("alerts", []);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("ne devrait rien rendre sans alertes", () => {
    fixture.componentRef.setInput("alerts", []);
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector(".space-y-2");
    expect(container).toBeNull();
  });

  it("devrait afficher les headlines et descriptions des alertes", () => {
    const alerts: WeatherAlert[] = [
      {
        type: "wind",
        severity: "moderate",
        headline: "Vent fort attendu",
        description: "Rafales jusqu'a 80 km/h prevues.",
        startTime: "2026-04-04T08:00",
        endTime: "2026-04-04T18:00",
      },
      {
        type: "rain",
        severity: "severe",
        headline: "Fortes pluies",
        description: "Cumuls importants sur la region.",
        startTime: "2026-04-04T10:00",
        endTime: "2026-04-05T06:00",
      },
    ];
    fixture.componentRef.setInput("alerts", alerts);
    fixture.detectChanges();

    const headlines = fixture.nativeElement.querySelectorAll("h4");
    expect(headlines.length).toBe(2);
    expect(headlines[0].textContent).toContain("Vent fort attendu");
    expect(headlines[1].textContent).toContain("Fortes pluies");

    const descriptions = fixture.nativeElement.querySelectorAll("p");
    expect(descriptions[0].textContent).toContain("Rafales");
    expect(descriptions[1].textContent).toContain("Cumuls");
  });

  it("devrait retourner les classes de severite correctes", () => {
    fixture.componentRef.setInput("alerts", []);
    fixture.detectChanges();

    const minorClasses = component.severityClasses("minor");
    expect(
      minorClasses["bg-yellow-500/20 border-yellow-400/30 text-yellow-100"],
    ).toBeTrue();

    const moderateClasses = component.severityClasses("moderate");
    expect(
      moderateClasses["bg-orange-500/20 border-orange-400/30 text-orange-100"],
    ).toBeTrue();

    const severeClasses = component.severityClasses("severe");
    expect(
      severeClasses["bg-red-500/20 border-red-400/30 text-red-100"],
    ).toBeTrue();

    const extremeClasses = component.severityClasses("extreme");
    expect(
      extremeClasses["bg-red-700/30 border-red-500/40 text-red-50"],
    ).toBeTrue();
  });

  it("devrait retourner les icones de severite correctes", () => {
    fixture.componentRef.setInput("alerts", []);
    fixture.detectChanges();

    expect(component.severityIcon("minor")).toBe("\u26A0\uFE0F");
    expect(component.severityIcon("moderate")).toBe("\uD83D\uDFE0");
    expect(component.severityIcon("severe")).toBe("\uD83D\uDD34");
    expect(component.severityIcon("extreme")).toBe("\uD83C\uDD98");
    expect(component.severityIcon("unknown")).toBe("\u2139\uFE0F");
  });
});
