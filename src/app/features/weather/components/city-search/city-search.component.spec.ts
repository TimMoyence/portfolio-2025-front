import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { AUTH_PORT } from "../../../../core/ports/auth.port";
import { WEATHER_PORT } from "../../../../core/ports/weather.port";
import { createAuthPortStub } from "../../../../../testing/factories/auth.factory";
import {
  buildCityResult,
  buildWeatherPreferences,
  createWeatherPortStub,
} from "../../../../../testing/factories/weather.factory";
import { CitySearchComponent } from "./city-search.component";

describe("CitySearchComponent", () => {
  let component: CitySearchComponent;
  let fixture: ComponentFixture<CitySearchComponent>;

  beforeEach(async () => {
    const authPortStub = createAuthPortStub();
    authPortStub.login.and.returnValue(of(null));
    authPortStub.register.and.returnValue(of(null));
    authPortStub.me.and.returnValue(of(null));
    authPortStub.googleAuth.and.returnValue(of(null));

    const weatherPortStub = createWeatherPortStub();
    weatherPortStub.searchCity.and.returnValue(of({ results: [] }));
    weatherPortStub.getForecast.and.returnValue(of(null));
    weatherPortStub.getPreferences.and.returnValue(
      of(buildWeatherPreferences()),
    );
    weatherPortStub.updatePreferences.and.returnValue(
      of(buildWeatherPreferences()),
    );
    weatherPortStub.recordUsage.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [CitySearchComponent],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: AUTH_PORT, useValue: authPortStub },
        { provide: WEATHER_PORT, useValue: weatherPortStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CitySearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait initialiser la requete vide", () => {
    expect(component.query()).toBe("");
    expect(component.results()).toEqual([]);
    expect(component.showDropdown()).toBeFalse();
  });

  it("devrait emettre la ville selectionnee", () => {
    const city = buildCityResult();

    spyOn(component.citySelected, "emit");
    component.selectCity(city);

    expect(component.citySelected.emit).toHaveBeenCalledWith(city);
    expect(component.query()).toBe("Paris");
    expect(component.showDropdown()).toBeFalse();
  });

  it("devrait vider les resultats si la requete est trop courte", () => {
    component.onQueryChange("a");

    expect(component.results()).toEqual([]);
    expect(component.showDropdown()).toBeFalse();
  });
});
