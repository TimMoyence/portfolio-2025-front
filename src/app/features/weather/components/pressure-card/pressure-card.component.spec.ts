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
import { PressureCardComponent } from "./pressure-card.component";

describe("PressureCardComponent", () => {
  let component: PressureCardComponent;
  let fixture: ComponentFixture<PressureCardComponent>;

  beforeEach(async () => {
    const weatherPortStub = createWeatherPortStub();
    weatherPortStub.getPreferences.and.returnValue(
      of(buildWeatherPreferences()),
    );
    weatherPortStub.updatePreferences.and.returnValue(
      of(buildWeatherPreferences()),
    );

    await TestBed.configureTestingModule({
      imports: [PressureCardComponent],
      providers: [
        { provide: WEATHER_PORT, useValue: weatherPortStub },
        {
          provide: WeatherLevelService,
          useValue: {
            isTooltipSeen: () => true,
            markTooltipSeen: () => {},
          },
        },
        UnitPreferencesService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PressureCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait afficher 'Donnees indisponibles' sans pression", () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain("indisponibles");
  });

  it("devrait afficher la pression quand la valeur est fournie", () => {
    fixture.componentRef.setInput("pressure", 1013);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain("1013");
    expect(el.textContent).toContain("hPa");
  });

  it("devrait calculer une tendance stable sans donnees horaires", () => {
    fixture.componentRef.setInput("pressure", 1013);
    fixture.detectChanges();
    expect(component.trend()).toBe("stable");
  });

  it("devrait detecter une tendance en hausse", () => {
    fixture.componentRef.setInput("pressure", 1015);
    fixture.componentRef.setInput("hourlyPressure", [1010, 1011, 1012, 1015]);
    fixture.detectChanges();
    expect(component.trend()).toBe("rising");
    expect(component.trendArrow()).toBe("↑");
  });

  it("devrait detecter une tendance en baisse", () => {
    fixture.componentRef.setInput("pressure", 1008);
    fixture.componentRef.setInput("hourlyPressure", [1015, 1012, 1010, 1008]);
    fixture.detectChanges();
    expect(component.trend()).toBe("falling");
    expect(component.trendArrow()).toBe("↓");
  });

  it("devrait afficher la pression en inHg quand la preference est inhg", () => {
    const unitService = TestBed.inject(UnitPreferencesService);
    unitService.setPressureUnit("inhg");
    fixture.componentRef.setInput("pressure", 1013);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain("inHg");
  });
});
