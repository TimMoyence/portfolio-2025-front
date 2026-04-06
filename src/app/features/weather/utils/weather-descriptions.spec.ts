import { getWeatherDescription } from "./weather-descriptions";

describe("getWeatherDescription", () => {
  it("should return description for known WMO code 0", () => {
    expect(getWeatherDescription(0)).toBe("Ciel dégagé");
  });

  it("should return description for known WMO code 95", () => {
    expect(getWeatherDescription(95)).toBe("Orage");
  });

  it("should return fallback for unknown code", () => {
    expect(getWeatherDescription(999)).toBe("Conditions inconnues");
  });

  it("should handle all standard WMO codes without error", () => {
    const codes = [
      0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75,
      77, 80, 81, 82, 85, 86, 95, 96, 99,
    ];
    for (const code of codes) {
      expect(getWeatherDescription(code)).toBeTruthy();
    }
  });
});
