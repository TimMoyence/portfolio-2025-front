import { PLATFORM_ID } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { of } from "rxjs";
import { WEATHER_PORT } from "../../../../core/ports/weather.port";
import {
  buildWeatherPreferences,
  createWeatherPortStub,
} from "../../../../../testing/factories/weather.factory";
import { UnitPreferencesService } from "../../services/unit-preferences.service";
import { UnitSelectorComponent } from "./unit-selector.component";

describe("UnitSelectorComponent", () => {
  let component: UnitSelectorComponent;
  let fixture: ComponentFixture<UnitSelectorComponent>;
  let weatherPortStub: ReturnType<typeof createWeatherPortStub>;

  beforeEach(async () => {
    weatherPortStub = createWeatherPortStub();
    weatherPortStub.updatePreferences.and.returnValue(
      of(buildWeatherPreferences()),
    );

    await TestBed.configureTestingModule({
      imports: [UnitSelectorComponent, NoopAnimationsModule],
      providers: [
        { provide: PLATFORM_ID, useValue: "browser" },
        { provide: WEATHER_PORT, useValue: weatherPortStub },
        UnitPreferencesService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UnitSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait etre ferme par defaut", () => {
    expect(component.isOpen()).toBeFalse();
  });

  it("devrait ouvrir le panneau au clic sur le bouton", () => {
    component.toggleOpen();
    expect(component.isOpen()).toBeTrue();
  });

  it("devrait fermer le panneau via onOpenChange(false)", () => {
    component.isOpen.set(true);
    component.onOpenChange(false);
    expect(component.isOpen()).toBeFalse();
  });

  it("devrait mettre a jour l'unite de temperature via le service", () => {
    component.unitService.setTemperatureUnit("fahrenheit");
    expect(component.unitService.temperatureUnit()).toBe("fahrenheit");
    expect(weatherPortStub.updatePreferences).toHaveBeenCalled();
  });
});
