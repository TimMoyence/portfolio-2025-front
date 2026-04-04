import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { WEATHER_PORT } from "../../../../core/ports/weather.port";
import {
  buildWeatherPreferences,
  createWeatherPortStub,
} from "../../../../../testing/factories/weather.factory";
import { WeatherLevelService } from "../../services/weather-level.service";
import { TransitionPromptComponent } from "./transition-prompt.component";

describe("TransitionPromptComponent", () => {
  let component: TransitionPromptComponent;
  let fixture: ComponentFixture<TransitionPromptComponent>;
  let levelService: WeatherLevelService;
  let weatherPortStub: ReturnType<typeof createWeatherPortStub>;

  beforeEach(async () => {
    weatherPortStub = createWeatherPortStub();

    await TestBed.configureTestingModule({
      imports: [TransitionPromptComponent],
      providers: [
        { provide: WEATHER_PORT, useValue: weatherPortStub },
        WeatherLevelService,
      ],
    }).compileComponents();

    levelService = TestBed.inject(WeatherLevelService);
    fixture = TestBed.createComponent(TransitionPromptComponent);
    component = fixture.componentInstance;
  });

  it("devrait se creer", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("ne devrait pas afficher la banniere si aucun niveau n'est suggere", () => {
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector("[role='status']");
    expect(banner).toBeNull();
  });

  it("devrait afficher la banniere quand un niveau est suggere", () => {
    const prefs = buildWeatherPreferences({
      level: "discovery",
      daysUsed: 7,
    });
    weatherPortStub.getPreferences.and.returnValue(of(prefs));
    levelService.loadPreferences();

    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector("[role='status']");
    expect(banner).not.toBeNull();
  });

  it("devrait activer le niveau suggere au clic", () => {
    const prefs = buildWeatherPreferences({
      level: "discovery",
      daysUsed: 7,
    });
    weatherPortStub.getPreferences.and.returnValue(of(prefs));
    weatherPortStub.updatePreferences.and.returnValue(
      of(buildWeatherPreferences({ level: "curious" })),
    );
    levelService.loadPreferences();

    component.activate();

    expect(levelService.level()).toBe("curious");
    expect(component.dismissed()).toBeTrue();
  });

  it("devrait fermer la banniere sans changer de niveau", () => {
    const prefs = buildWeatherPreferences({
      level: "discovery",
      daysUsed: 7,
    });
    weatherPortStub.getPreferences.and.returnValue(of(prefs));
    levelService.loadPreferences();

    component.dismiss();

    expect(component.dismissed()).toBeTrue();
    expect(levelService.level()).toBe("discovery");
  });

  it("ne devrait pas afficher la banniere apres fermeture", () => {
    const prefs = buildWeatherPreferences({
      level: "discovery",
      daysUsed: 7,
    });
    weatherPortStub.getPreferences.and.returnValue(of(prefs));
    levelService.loadPreferences();
    fixture.detectChanges();

    component.dismiss();
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector("[role='status']");
    expect(banner).toBeNull();
  });
});
