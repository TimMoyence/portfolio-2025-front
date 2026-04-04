import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { WEATHER_PORT } from "../../../../core/ports/weather.port";
import {
  buildWeatherPreferences,
  createWeatherPortStub,
} from "../../../../../testing/factories/weather.factory";
import { WeatherLevelService } from "../../services/weather-level.service";
import { LevelSelectorComponent } from "./level-selector.component";

describe("LevelSelectorComponent", () => {
  let component: LevelSelectorComponent;
  let fixture: ComponentFixture<LevelSelectorComponent>;
  let levelService: WeatherLevelService;
  let weatherPortStub: ReturnType<typeof createWeatherPortStub>;

  beforeEach(async () => {
    weatherPortStub = createWeatherPortStub();

    await TestBed.configureTestingModule({
      imports: [LevelSelectorComponent],
      providers: [
        { provide: WEATHER_PORT, useValue: weatherPortStub },
        WeatherLevelService,
      ],
    }).compileComponents();

    levelService = TestBed.inject(WeatherLevelService);
    fixture = TestBed.createComponent(LevelSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait afficher trois onglets de niveau", () => {
    expect(component.levels.length).toBe(3);
    expect(component.levels.map((l) => l.value)).toEqual([
      "discovery",
      "curious",
      "expert",
    ]);
  });

  it("devrait changer le niveau via le service et emettre l'evenement", () => {
    const updatedPrefs = buildWeatherPreferences({ level: "curious" });
    weatherPortStub.updatePreferences.and.returnValue(of(updatedPrefs));

    spyOn(component.levelChanged, "emit");

    component.onLevelChange("curious");

    expect(levelService.level()).toBe("curious");
    expect(component.levelChanged.emit).toHaveBeenCalledWith("curious");
  });

  it("devrait avoir un role tablist sur la navigation", () => {
    const nav = fixture.nativeElement.querySelector("nav");
    expect(nav.getAttribute("role")).toBe("tablist");
  });

  it("devrait marquer l'onglet actif avec aria-selected", () => {
    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll("button[role='tab']"),
    );

    // Par defaut, discovery est actif
    expect(buttons[0].getAttribute("aria-selected")).toBe("true");
    expect(buttons[1].getAttribute("aria-selected")).toBe("false");
    expect(buttons[2].getAttribute("aria-selected")).toBe("false");
  });
});
