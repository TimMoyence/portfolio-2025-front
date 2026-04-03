import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { WEATHER_PORT } from "../../../../core/ports/weather.port";
import {
  buildWeatherPreferences,
  createWeatherPortStub,
} from "../../../../../testing/factories/weather.factory";
import { UnitPreferencesService } from "../../services/unit-preferences.service";
import { WeatherLevelService } from "../../services/weather-level.service";
import { WindCompassComponent } from "./wind-compass.component";

describe("WindCompassComponent", () => {
  let component: WindCompassComponent;
  let fixture: ComponentFixture<WindCompassComponent>;

  beforeEach(async () => {
    const weatherPortStub = createWeatherPortStub();
    weatherPortStub.getPreferences.and.returnValue(
      of(buildWeatherPreferences()),
    );
    weatherPortStub.updatePreferences.and.returnValue(
      of(buildWeatherPreferences()),
    );

    await TestBed.configureTestingModule({
      imports: [WindCompassComponent],
      providers: [
        { provide: WEATHER_PORT, useValue: weatherPortStub },
        {
          provide: WeatherLevelService,
          useValue: {
            isTooltipSeen: () => true,
            markTooltipSeen: () => {},
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WindCompassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait afficher la direction cardinale Nord pour 0 degres", () => {
    fixture.componentRef.setInput("direction", 0);
    fixture.detectChanges();
    expect(component.cardinalDirection()).toBe("N");
  });

  it("devrait afficher la direction cardinale Sud pour 180 degres", () => {
    fixture.componentRef.setInput("direction", 180);
    fixture.detectChanges();
    expect(component.cardinalDirection()).toBe("S");
  });

  it("devrait calculer la transformation SVG selon la direction", () => {
    fixture.componentRef.setInput("direction", 90);
    fixture.detectChanges();
    expect(component.arrowTransform()).toBe("rotate(90, 60, 60)");
  });

  it("devrait afficher les rafales si fournies", () => {
    fixture.componentRef.setInput("speed", 15);
    fixture.componentRef.setInput("gusts", 30);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain("Rafales");
    expect(el.textContent).toContain("30");
  });

  it("devrait afficher la vitesse en mph quand la preference est mph", () => {
    const unitService = TestBed.inject(UnitPreferencesService);
    unitService.setSpeedUnit("mph");
    fixture.componentRef.setInput("speed", 100);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain("62"); // 100 * 0.621371 ≈ 62
    expect(text).toContain("mph");
  });
});
