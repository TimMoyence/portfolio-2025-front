import { weatherCodeToIcon, weatherCodeToDescription } from "./weather-icons";

describe("weatherCodeToIcon", () => {
  const base = "/assets/images/meteo/";

  it("devrait retourner soleil pour code 0 (jour)", () => {
    expect(weatherCodeToIcon(0)).toBe(base + "soleil.png");
  });

  it("devrait retourner lune et etoiles pour code 0 (nuit)", () => {
    expect(weatherCodeToIcon(0, true)).toBe(base + "lune-et-\u00e9toiles.png");
  });

  it("devrait retourner soleil-et-nuage pour code 1 (jour)", () => {
    expect(weatherCodeToIcon(1)).toBe(base + "soleil-et-nuage.png");
  });

  it("devrait retourner nuit-partiellement-nuageuse pour code 1 (nuit)", () => {
    expect(weatherCodeToIcon(1, true)).toBe(
      base + "nuit-partiellement-nuageuse.png",
    );
  });

  it("devrait retourner soleil-et-nuage pour code 2", () => {
    expect(weatherCodeToIcon(2)).toBe(base + "soleil-et-nuage.png");
  });

  it("devrait retourner nuage pour code 3", () => {
    expect(weatherCodeToIcon(3)).toBe(base + "nuage.png");
  });

  it("devrait retourner brouillard-de-jour pour codes 45-48", () => {
    expect(weatherCodeToIcon(45)).toBe(base + "brouillard-de-jour.png");
    expect(weatherCodeToIcon(48)).toBe(base + "brouillard-de-jour.png");
  });

  it("devrait retourner partiellement-nuageux-avec-pluie pour codes 51-55", () => {
    expect(weatherCodeToIcon(51)).toBe(
      base + "partiellement-nuageux-avec-pluie.png",
    );
    expect(weatherCodeToIcon(55)).toBe(
      base + "partiellement-nuageux-avec-pluie.png",
    );
  });

  it("devrait retourner pluie pour codes 56-57 (bruine verglacante)", () => {
    expect(weatherCodeToIcon(56)).toBe(base + "pluie.png");
    expect(weatherCodeToIcon(57)).toBe(base + "pluie.png");
  });

  it("devrait retourner pluie pour codes 61-65", () => {
    expect(weatherCodeToIcon(61)).toBe(base + "pluie.png");
    expect(weatherCodeToIcon(65)).toBe(base + "pluie.png");
  });

  it("devrait retourner pluie-torrentielle pour codes 66-67", () => {
    expect(weatherCodeToIcon(66)).toBe(base + "pluie-torrentielle.png");
    expect(weatherCodeToIcon(67)).toBe(base + "pluie-torrentielle.png");
  });

  it("devrait retourner pluie pour codes neige 71-77", () => {
    expect(weatherCodeToIcon(71)).toBe(base + "pluie.png");
    expect(weatherCodeToIcon(77)).toBe(base + "pluie.png");
  });

  it("devrait retourner pluie-torrentielle pour codes averses 80-82", () => {
    expect(weatherCodeToIcon(80)).toBe(base + "pluie-torrentielle.png");
    expect(weatherCodeToIcon(82)).toBe(base + "pluie-torrentielle.png");
  });

  it("devrait retourner pluie-torrentielle pour codes averses neige 85-86", () => {
    expect(weatherCodeToIcon(85)).toBe(base + "pluie-torrentielle.png");
    expect(weatherCodeToIcon(86)).toBe(base + "pluie-torrentielle.png");
  });

  it("devrait retourner eclair-dans-un-nuage pour codes orage 95-99", () => {
    expect(weatherCodeToIcon(95)).toBe(base + "\u00e9clair-dans-un-nuage.png");
    expect(weatherCodeToIcon(99)).toBe(base + "\u00e9clair-dans-un-nuage.png");
  });

  it("devrait retourner nuage comme fallback pour code inconnu", () => {
    expect(weatherCodeToIcon(10)).toBe(base + "nuage.png");
    expect(weatherCodeToIcon(44)).toBe(base + "nuage.png");
  });
});

describe("weatherCodeToDescription", () => {
  it("devrait retourner 'Ciel d\u00e9gag\u00e9' pour code 0", () => {
    expect(weatherCodeToDescription(0)).toBe("Ciel d\u00e9gag\u00e9");
  });

  it("devrait retourner 'Principalement d\u00e9gag\u00e9' pour code 1", () => {
    expect(weatherCodeToDescription(1)).toBe("Principalement d\u00e9gag\u00e9");
  });

  it("devrait retourner 'Partiellement nuageux' pour code 2", () => {
    expect(weatherCodeToDescription(2)).toBe("Partiellement nuageux");
  });

  it("devrait retourner 'Couvert' pour code 3", () => {
    expect(weatherCodeToDescription(3)).toBe("Couvert");
  });

  it("devrait retourner 'Brouillard' pour codes 45-48", () => {
    expect(weatherCodeToDescription(45)).toBe("Brouillard");
    expect(weatherCodeToDescription(48)).toBe("Brouillard");
  });

  it("devrait retourner 'Bruine' pour codes 51-55", () => {
    expect(weatherCodeToDescription(51)).toBe("Bruine");
    expect(weatherCodeToDescription(55)).toBe("Bruine");
  });

  it("devrait retourner 'Bruine vergla\u00e7ante' pour codes 56-57", () => {
    expect(weatherCodeToDescription(56)).toBe("Bruine vergla\u00e7ante");
    expect(weatherCodeToDescription(57)).toBe("Bruine vergla\u00e7ante");
  });

  it("devrait retourner 'Pluie' pour codes 61-63", () => {
    expect(weatherCodeToDescription(61)).toBe("Pluie");
    expect(weatherCodeToDescription(63)).toBe("Pluie");
  });

  it("devrait retourner 'Forte pluie' pour codes 64-65", () => {
    expect(weatherCodeToDescription(64)).toBe("Forte pluie");
    expect(weatherCodeToDescription(65)).toBe("Forte pluie");
  });

  it("devrait retourner 'Pluie vergla\u00e7ante' pour codes 66-67", () => {
    expect(weatherCodeToDescription(66)).toBe("Pluie vergla\u00e7ante");
  });

  it("devrait retourner 'Neige' pour codes 71-75", () => {
    expect(weatherCodeToDescription(71)).toBe("Neige");
    expect(weatherCodeToDescription(75)).toBe("Neige");
  });

  it("devrait retourner 'Gr\u00e9sil' pour codes 76-77", () => {
    expect(weatherCodeToDescription(76)).toBe("Gr\u00e9sil");
    expect(weatherCodeToDescription(77)).toBe("Gr\u00e9sil");
  });

  it("devrait retourner 'Averses' pour codes 80-82", () => {
    expect(weatherCodeToDescription(80)).toBe("Averses");
    expect(weatherCodeToDescription(82)).toBe("Averses");
  });

  it("devrait retourner 'Averses de neige' pour codes 85-86", () => {
    expect(weatherCodeToDescription(85)).toBe("Averses de neige");
    expect(weatherCodeToDescription(86)).toBe("Averses de neige");
  });

  it("devrait retourner 'Orage' pour codes 95-99", () => {
    expect(weatherCodeToDescription(95)).toBe("Orage");
    expect(weatherCodeToDescription(99)).toBe("Orage");
  });

  it("devrait retourner 'Inconnu' pour un code non couvert", () => {
    expect(weatherCodeToDescription(10)).toBe("Inconnu");
    expect(weatherCodeToDescription(44)).toBe("Inconnu");
  });
});
