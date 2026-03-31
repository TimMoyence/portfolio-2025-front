import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { buildAirQualityData } from "../../../../../testing/factories/weather.factory";
import { AirQualityCardComponent } from "./air-quality-card.component";

describe("AirQualityCardComponent", () => {
  let component: AirQualityCardComponent;
  let fixture: ComponentFixture<AirQualityCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AirQualityCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AirQualityCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait afficher 'Donnees indisponibles' sans donnees", () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain("indisponibles");
  });

  it("devrait afficher le label 'Correct' pour un AQI de 25", () => {
    fixture.componentRef.setInput("airQuality", buildAirQualityData());
    fixture.detectChanges();
    expect(component.qualityLabel()).toContain("Correct");
  });

  it("devrait afficher 'Bon' pour un AQI <= 20", () => {
    fixture.componentRef.setInput(
      "airQuality",
      buildAirQualityData({
        current: {
          european_aqi: 15,
          pm2_5: 5,
          pm10: 10,
          ozone: 30,
          nitrogen_dioxide: 8,
          sulphur_dioxide: 2,
        },
      }),
    );
    fixture.detectChanges();
    expect(component.qualityLabel()).toContain("Bon");
  });

  it("devrait afficher les polluants quand les donnees sont presentes", () => {
    fixture.componentRef.setInput("airQuality", buildAirQualityData());
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain("PM2.5");
    expect(el.textContent).toContain("PM10");
  });
});
