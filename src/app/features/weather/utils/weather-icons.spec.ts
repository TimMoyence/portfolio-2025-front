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

describe("weatherCodeToDescription (re-export localisé)", () => {
  it("devrait retourner 'Ciel dégagé' pour code 0", () => {
    expect(weatherCodeToDescription(0)).toBe("Ciel dégagé");
  });

  it("devrait retourner 'Principalement dégagé' pour code 1", () => {
    expect(weatherCodeToDescription(1)).toBe("Principalement dégagé");
  });

  it("devrait retourner 'Partiellement nuageux' pour code 2", () => {
    expect(weatherCodeToDescription(2)).toBe("Partiellement nuageux");
  });

  it("devrait retourner 'Couvert' pour code 3", () => {
    expect(weatherCodeToDescription(3)).toBe("Couvert");
  });

  it("devrait retourner des descriptions de brouillard pour codes 45 et 48", () => {
    expect(weatherCodeToDescription(45)).toBe("Brouillard");
    expect(weatherCodeToDescription(48)).toBe("Brouillard givrant");
  });

  it("devrait retourner des descriptions de bruine pour codes 51-55", () => {
    expect(weatherCodeToDescription(51)).toBe("Bruine légère");
    expect(weatherCodeToDescription(55)).toBe("Bruine dense");
  });

  it("devrait retourner des descriptions de bruine verglaçante pour codes 56-57", () => {
    expect(weatherCodeToDescription(56)).toBe("Bruine verglaçante légère");
    expect(weatherCodeToDescription(57)).toBe("Bruine verglaçante dense");
  });

  it("devrait retourner des descriptions de pluie pour codes 61-65", () => {
    expect(weatherCodeToDescription(61)).toBe("Pluie légère");
    expect(weatherCodeToDescription(63)).toBe("Pluie modérée");
    expect(weatherCodeToDescription(65)).toBe("Pluie forte");
  });

  it("devrait retourner des descriptions de pluie verglaçante pour codes 66-67", () => {
    expect(weatherCodeToDescription(66)).toBe("Pluie verglaçante légère");
    expect(weatherCodeToDescription(67)).toBe("Pluie verglaçante forte");
  });

  it("devrait retourner des descriptions de neige pour codes 71-77", () => {
    expect(weatherCodeToDescription(71)).toBe("Neige légère");
    expect(weatherCodeToDescription(75)).toBe("Neige forte");
    expect(weatherCodeToDescription(77)).toBe("Grains de neige");
  });

  it("devrait retourner des descriptions d'averses pour codes 80-82", () => {
    expect(weatherCodeToDescription(80)).toBe("Averses légères");
    expect(weatherCodeToDescription(82)).toBe("Averses violentes");
  });

  it("devrait retourner des descriptions d'averses de neige pour codes 85-86", () => {
    expect(weatherCodeToDescription(85)).toBe("Averses de neige légères");
    expect(weatherCodeToDescription(86)).toBe("Averses de neige fortes");
  });

  it("devrait retourner des descriptions d'orage pour codes 95-99", () => {
    expect(weatherCodeToDescription(95)).toBe("Orage");
    expect(weatherCodeToDescription(99)).toBe("Orage avec grêle forte");
  });

  it("devrait retourner 'Conditions inconnues' pour un code non couvert", () => {
    expect(weatherCodeToDescription(10)).toBe("Conditions inconnues");
    expect(weatherCodeToDescription(44)).toBe("Conditions inconnues");
  });
});
