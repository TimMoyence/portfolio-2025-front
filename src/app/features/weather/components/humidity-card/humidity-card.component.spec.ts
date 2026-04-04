import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { WEATHER_PORT } from "../../../../core/ports/weather.port";
import {
  createWeatherPortStub,
  buildWeatherPreferences,
} from "../../../../../testing/factories/weather.factory";
import { WeatherLevelService } from "../../services/weather-level.service";
import { UnitPreferencesService } from "../../services/unit-preferences.service";
import { HumidityCardComponent } from "./humidity-card.component";

describe("HumidityCardComponent", () => {
  let component: HumidityCardComponent;
  let fixture: ComponentFixture<HumidityCardComponent>;

  beforeEach(async () => {
    const weatherPortStub = createWeatherPortStub();
    weatherPortStub.getPreferences.and.returnValue(
      of(buildWeatherPreferences()),
    );
    weatherPortStub.updatePreferences.and.returnValue(
      of(buildWeatherPreferences()),
    );
    weatherPortStub.recordUsage.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [HumidityCardComponent],
      providers: [
        {
          provide: WeatherLevelService,
          useValue: {
            isTooltipSeen: () => true,
            markTooltipSeen: () => {},
          },
        },
        { provide: WEATHER_PORT, useValue: weatherPortStub },
        UnitPreferencesService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HumidityCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait afficher 'Sec' pour une humidite inferieure a 30%", () => {
    fixture.componentRef.setInput("humidity", 20);
    fixture.detectChanges();
    expect(component.comfortLabel()).toContain("Sec");
  });

  it("devrait afficher 'Confortable' pour une humidite entre 30% et 60%", () => {
    fixture.componentRef.setInput("humidity", 50);
    fixture.detectChanges();
    expect(component.comfortLabel()).toContain("Confortable");
  });

  it("devrait afficher 'Humide' pour une humidite superieure a 60%", () => {
    fixture.componentRef.setInput("humidity", 80);
    fixture.detectChanges();
    expect(component.comfortLabel()).toContain("Humide");
  });

  it("devrait calculer le dashArray proportionnellement", () => {
    fixture.componentRef.setInput("humidity", 75);
    fixture.detectChanges();
    expect(component.dashArray()).toBe("75 25");
  });

  it("devrait afficher le point de rosee si fourni", () => {
    fixture.componentRef.setInput("humidity", 55);
    fixture.componentRef.setInput("dewPoint", 12);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain("12");
    expect(el.textContent).toContain("ros");
  });
});
