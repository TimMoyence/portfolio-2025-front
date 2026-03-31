import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { WEATHER_PORT } from "../../../core/ports/weather.port";
import {
  buildWeatherPreferences,
  createWeatherPortStub,
} from "../../../../testing/factories/weather.factory";
import { WeatherLevelService } from "./weather-level.service";

describe("WeatherLevelService", () => {
  let service: WeatherLevelService;
  let weatherPortStub: ReturnType<typeof createWeatherPortStub>;

  beforeEach(() => {
    weatherPortStub = createWeatherPortStub();

    TestBed.configureTestingModule({
      providers: [
        WeatherLevelService,
        { provide: WEATHER_PORT, useValue: weatherPortStub },
      ],
    });

    service = TestBed.inject(WeatherLevelService);
  });

  it("devrait se creer avec les valeurs par defaut", () => {
    expect(service).toBeTruthy();
    expect(service.level()).toBe("discovery");
    expect(service.daysUsed()).toBe(0);
    expect(service.tooltipsSeen()).toEqual([]);
    expect(service.loading()).toBeFalse();
  });

  describe("loadPreferences", () => {
    it("devrait charger les preferences depuis le backend", () => {
      const prefs = buildWeatherPreferences({
        level: "curious",
        daysUsed: 10,
        tooltipsSeen: ["tip-1"],
      });
      weatherPortStub.getPreferences.and.returnValue(of(prefs));

      service.loadPreferences();

      expect(service.level()).toBe("curious");
      expect(service.daysUsed()).toBe(10);
      expect(service.tooltipsSeen()).toEqual(["tip-1"]);
      expect(service.loading()).toBeFalse();
    });

    it("devrait gerer les erreurs de chargement", () => {
      weatherPortStub.getPreferences.and.returnValue(
        throwError(() => new Error("Network error")),
      );

      service.loadPreferences();

      expect(service.loading()).toBeFalse();
      expect(service.level()).toBe("discovery");
    });

    it("devrait positionner loading a true pendant le chargement", () => {
      weatherPortStub.getPreferences.and.returnValue(
        of(buildWeatherPreferences()),
      );

      // Le loading est mis a true puis false synchroniquement dans ce test
      service.loadPreferences();
      expect(service.loading()).toBeFalse();
    });
  });

  describe("setLevel", () => {
    it("devrait changer le niveau et synchroniser avec le backend", () => {
      const updatedPrefs = buildWeatherPreferences({ level: "expert" });
      weatherPortStub.updatePreferences.and.returnValue(of(updatedPrefs));

      service.setLevel("expert");

      expect(service.level()).toBe("expert");
      expect(weatherPortStub.updatePreferences).toHaveBeenCalledWith({
        level: "expert",
      });
    });

    it("devrait garder le niveau meme en cas d'erreur backend", () => {
      weatherPortStub.updatePreferences.and.returnValue(
        throwError(() => new Error("Error")),
      );

      service.setLevel("curious");

      expect(service.level()).toBe("curious");
    });
  });

  describe("markTooltipSeen", () => {
    it("devrait ajouter un tooltip a la liste des vus", () => {
      weatherPortStub.updatePreferences.and.returnValue(
        of(buildWeatherPreferences({ tooltipsSeen: ["tip-1"] })),
      );

      service.markTooltipSeen("tip-1");

      expect(service.tooltipsSeen()).toContain("tip-1");
      expect(weatherPortStub.updatePreferences).toHaveBeenCalledWith({
        tooltipsSeen: ["tip-1"],
      });
    });

    it("ne devrait pas dupliquer un tooltip deja vu", () => {
      weatherPortStub.updatePreferences.and.returnValue(
        of(buildWeatherPreferences({ tooltipsSeen: ["tip-1"] })),
      );

      service.markTooltipSeen("tip-1");
      service.markTooltipSeen("tip-1");

      expect(weatherPortStub.updatePreferences).toHaveBeenCalledTimes(1);
    });
  });

  describe("isTooltipSeen", () => {
    it("devrait retourner false pour un tooltip non vu", () => {
      expect(service.isTooltipSeen("tip-x")).toBeFalse();
    });

    it("devrait retourner true pour un tooltip vu", () => {
      weatherPortStub.updatePreferences.and.returnValue(
        of(buildWeatherPreferences({ tooltipsSeen: ["tip-1"] })),
      );

      service.markTooltipSeen("tip-1");

      expect(service.isTooltipSeen("tip-1")).toBeTrue();
    });
  });

  describe("recordUsage", () => {
    it("devrait appeler recordUsage sur le port", () => {
      weatherPortStub.recordUsage.and.returnValue(of(undefined));

      service.recordUsage();

      expect(weatherPortStub.recordUsage).toHaveBeenCalled();
    });
  });

  describe("showTransitionPrompt", () => {
    it("devrait retourner null pour discovery avec moins de 7 jours", () => {
      expect(service.showTransitionPrompt()).toBeNull();
    });

    it("devrait suggerer curious apres 7 jours en discovery", () => {
      const prefs = buildWeatherPreferences({
        level: "discovery",
        daysUsed: 7,
      });
      weatherPortStub.getPreferences.and.returnValue(of(prefs));

      service.loadPreferences();

      expect(service.showTransitionPrompt()).toBe("curious");
    });

    it("devrait suggerer expert apres 30 jours en curious", () => {
      const prefs = buildWeatherPreferences({
        level: "curious",
        daysUsed: 30,
      });
      weatherPortStub.getPreferences.and.returnValue(of(prefs));

      service.loadPreferences();

      expect(service.showTransitionPrompt()).toBe("expert");
    });

    it("devrait retourner null pour expert meme apres 100 jours", () => {
      const prefs = buildWeatherPreferences({
        level: "expert",
        daysUsed: 100,
      });
      weatherPortStub.getPreferences.and.returnValue(of(prefs));

      service.loadPreferences();

      expect(service.showTransitionPrompt()).toBeNull();
    });
  });
});
