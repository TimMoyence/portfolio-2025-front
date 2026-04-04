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
import { CurrentConditionsComponent } from "./current-conditions.component";

describe("CurrentConditionsComponent", () => {
  let component: CurrentConditionsComponent;
  let fixture: ComponentFixture<CurrentConditionsComponent>;

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
      imports: [CurrentConditionsComponent],
      providers: [
        { provide: WEATHER_PORT, useValue: weatherPortStub },
        WeatherLevelService,
        UnitPreferencesService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CurrentConditionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait retourner une chaine vide si aucune donnee courante", () => {
    expect(component.icon()).toBe("");
    expect(component.description()).toBe("");
  });

  it("devrait initialiser animatedTemp a 0", () => {
    expect(component.animatedTemp()).toBe(0);
  });

  it("devrait calculer l'icone et la description quand les donnees sont presentes", () => {
    fixture.componentRef.setInput("current", {
      time: "2026-03-31T12:00",
      temperature_2m: 18,
      weather_code: 0,
      wind_speed_10m: 12,
      apparent_temperature: 16,
    });
    fixture.detectChanges();

    expect(component.icon()).toContain("soleil.png");
    expect(component.description()).toBe("Ciel dégagé");
  });

  it("devrait afficher l'icone nuage pour un code couvert", () => {
    fixture.componentRef.setInput("current", {
      time: "2026-03-31T12:00",
      temperature_2m: 10,
      weather_code: 3,
      wind_speed_10m: 20,
      apparent_temperature: 8,
    });
    fixture.detectChanges();

    expect(component.icon()).toContain("nuage.png");
    expect(component.description()).toBe("Couvert");
  });

  it("devrait animer la temperature vers la valeur cible", (done) => {
    fixture.componentRef.setInput("current", {
      time: "2026-03-31T12:00",
      temperature_2m: 18,
      weather_code: 0,
      wind_speed_10m: 12,
      apparent_temperature: 16,
    });
    fixture.detectChanges();

    // Apres la duree de l'animation (500ms + marge)
    setTimeout(() => {
      expect(component.animatedTemp()).toBe(18);
      done();
    }, 600);
  });

  it("devrait re-animer vers une nouvelle valeur quand la temperature change", (done) => {
    fixture.componentRef.setInput("current", {
      time: "2026-03-31T12:00",
      temperature_2m: 18,
      weather_code: 0,
      wind_speed_10m: 12,
      apparent_temperature: 16,
    });
    fixture.detectChanges();

    setTimeout(() => {
      expect(component.animatedTemp()).toBe(18);

      // Changement de temperature
      fixture.componentRef.setInput("current", {
        time: "2026-03-31T13:00",
        temperature_2m: 22,
        weather_code: 0,
        wind_speed_10m: 10,
        apparent_temperature: 20,
      });
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.animatedTemp()).toBe(22);
        done();
      }, 600);
    }, 600);
  });
});
