import type { HourlyForecast } from "../../../core/models/weather.model";
import {
  groupHourlyByGranularity,
  type WeatherTimeSlot,
} from "./weekly-overview";

/**
 * Construit un jeu de donnees horaires sur 2 jours (48h) pour les tests.
 * Chaque heure a des valeurs distinctes pour verifier l'aggregation.
 */
function buildHourly48h(): HourlyForecast {
  const times: string[] = [];
  const temps: number[] = [];
  const codes: number[] = [];
  const winds: number[] = [];
  const precips: number[] = [];

  for (let d = 0; d < 2; d++) {
    for (let h = 0; h < 24; h++) {
      const day = d === 0 ? "2026-04-01" : "2026-04-02";
      times.push(`${day}T${h.toString().padStart(2, "0")}:00`);
      temps.push(10 + h); // 10..33 sur jour 1, 10..33 sur jour 2
      codes.push(h < 12 ? 0 : 61); // matin clair, aprem pluie
      winds.push(5 + h);
      precips.push(h >= 12 ? 1.5 : 0);
    }
  }

  return {
    time: times,
    temperature_2m: temps,
    weather_code: codes,
    wind_speed_10m: winds,
    precipitation: precips,
  };
}

describe("groupHourlyByGranularity", () => {
  const hourly = buildHourly48h();

  describe("granularite 'day'", () => {
    let slots: WeatherTimeSlot[];

    beforeAll(() => {
      slots = groupHourlyByGranularity(hourly, "day");
    });

    it("devrait retourner 2 slots pour 48h de donnees", () => {
      expect(slots.length).toBe(2);
    });

    it("devrait avoir les bonnes dates en label", () => {
      expect(slots[0].label).toBe("2026-04-01");
      expect(slots[1].label).toBe("2026-04-02");
    });

    it("devrait calculer la moyenne de temperature", () => {
      // Jour 1 : 10,11,...,33 => moyenne = (10+33)/2 = 21.5
      expect(slots[0].avgTemp).toBeCloseTo(21.5, 1);
    });

    it("devrait trouver le min et max de temperature", () => {
      expect(slots[0].minTemp).toBe(10);
      expect(slots[0].maxTemp).toBe(33);
    });

    it("devrait sommer les precipitations", () => {
      // 12 heures a 1.5mm = 18mm par jour
      expect(slots[0].totalPrecipitation).toBeCloseTo(18, 1);
    });

    it("devrait prendre le code meteo dominant (le plus frequent)", () => {
      // 12 heures code 0, 12 heures code 61 => ex aequo, prend le premier
      expect([0, 61]).toContain(slots[0].dominantWeatherCode);
    });

    it("devrait calculer la vitesse max du vent", () => {
      // Heure 23 => vent = 5+23 = 28
      expect(slots[0].maxWind).toBe(28);
    });

    it("devrait avoir le bon nombre d'heures aggregees", () => {
      expect(slots[0].hourCount).toBe(24);
    });
  });

  describe("granularite '3h'", () => {
    let slots: WeatherTimeSlot[];

    beforeAll(() => {
      slots = groupHourlyByGranularity(hourly, "3h");
    });

    it("devrait retourner 16 slots pour 48h (8 blocs de 3h par jour)", () => {
      expect(slots.length).toBe(16);
    });

    it("devrait avoir un label horaire pour le premier slot", () => {
      expect(slots[0].label).toBe("2026-04-01T00:00");
    });

    it("devrait aggreger 3 heures par slot", () => {
      expect(slots[0].hourCount).toBe(3);
    });

    it("devrait calculer la moyenne sur 3 heures", () => {
      // Heures 0,1,2 => temps 10,11,12 => moyenne = 11
      expect(slots[0].avgTemp).toBeCloseTo(11, 1);
    });

    it("devrait sommer les precipitations sur 3 heures", () => {
      // Premier slot (0-2h) : tout a 0mm
      expect(slots[0].totalPrecipitation).toBe(0);
      // Slot 12-14h (index 4 du jour 1) : 3 heures a 1.5mm = 4.5mm
      expect(slots[4].totalPrecipitation).toBeCloseTo(4.5, 1);
    });
  });

  describe("granularite '1h'", () => {
    let slots: WeatherTimeSlot[];

    beforeAll(() => {
      slots = groupHourlyByGranularity(hourly, "1h");
    });

    it("devrait retourner 48 slots (1 par heure)", () => {
      expect(slots.length).toBe(48);
    });

    it("devrait avoir la temperature exacte (pas de moyenne)", () => {
      expect(slots[0].avgTemp).toBe(10);
      expect(slots[0].minTemp).toBe(10);
      expect(slots[0].maxTemp).toBe(10);
    });

    it("devrait avoir un hourCount de 1", () => {
      expect(slots[0].hourCount).toBe(1);
    });
  });

  describe("cas limites", () => {
    it("devrait retourner un tableau vide si hourly est vide", () => {
      const empty: HourlyForecast = {
        time: [],
        temperature_2m: [],
        weather_code: [],
        wind_speed_10m: [],
        precipitation: [],
      };
      expect(groupHourlyByGranularity(empty, "day")).toEqual([]);
    });

    it("devrait gerer un nombre d'heures non divisible par 3", () => {
      const partial: HourlyForecast = {
        time: [
          "2026-04-01T00:00",
          "2026-04-01T01:00",
          "2026-04-01T02:00",
          "2026-04-01T03:00",
          "2026-04-01T04:00",
        ],
        temperature_2m: [10, 11, 12, 13, 14],
        weather_code: [0, 0, 0, 1, 1],
        wind_speed_10m: [5, 6, 7, 8, 9],
        precipitation: [0, 0, 0, 0, 0],
      };
      const slots = groupHourlyByGranularity(partial, "3h");
      // 3 + 2 => 2 slots (le dernier avec 2 heures)
      expect(slots.length).toBe(2);
      expect(slots[0].hourCount).toBe(3);
      expect(slots[1].hourCount).toBe(2);
    });
  });
});
