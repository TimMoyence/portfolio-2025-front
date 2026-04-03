import { UnitPipe } from "./unit.pipe";

describe("UnitPipe", () => {
  let pipe: UnitPipe;

  beforeEach(() => {
    pipe = new UnitPipe();
  });

  it("devrait se creer", () => {
    expect(pipe).toBeTruthy();
  });

  it("devrait retourner un tiret pour null", () => {
    expect(pipe.transform(null, "celsius")).toBe("\u2014");
  });

  it("devrait retourner un tiret pour undefined", () => {
    expect(pipe.transform(undefined, "celsius")).toBe("\u2014");
  });

  it("devrait formater une valeur en celsius", () => {
    expect(pipe.transform(18, "celsius")).toBe("18\u00B0C");
  });

  it("devrait convertir celsius vers fahrenheit", () => {
    // 0°C = 32°F
    expect(pipe.transform(0, "fahrenheit")).toBe("32\u00B0F");
    // 100°C = 212°F
    expect(pipe.transform(100, "fahrenheit")).toBe("212\u00B0F");
  });

  it("devrait formater une valeur en km/h", () => {
    expect(pipe.transform(50, "kmh")).toBe("50 km/h");
  });

  it("devrait convertir km/h vers mph", () => {
    // 100 km/h ≈ 62 mph
    expect(pipe.transform(100, "mph")).toBe("62 mph");
  });

  it("devrait formater une valeur en hPa", () => {
    expect(pipe.transform(1013, "hpa")).toBe("1013 hPa");
  });

  it("devrait convertir hPa vers inHg", () => {
    // 1013 hPa × 0.02953 ≈ 29.91 inHg
    expect(pipe.transform(1013, "inhg")).toBe("29.91 inHg");
  });

  it("devrait retourner un nombre arrondi pour une unite inconnue", () => {
    expect(pipe.transform(18.7, "inconnu")).toBe("19");
  });
});
