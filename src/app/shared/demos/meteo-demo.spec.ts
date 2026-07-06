import {
  ARC,
  createMeteoCities,
  needleTransform,
  sunDot,
  type DemoCity,
  type MeteoCityId,
  type MeteoCityLabels,
} from "./meteo-demo";

/**
 * Fabrique un jeu de libelles i18n stub pour les 4 villes de demo.
 * Les vraies valeurs `$localize` restent LOCALES aux composants ; ici on
 * injecte des marqueurs distincts par ville pour prouver le report exact.
 */
function buildMeteoLabels(
  overrides: Partial<Record<MeteoCityId, Partial<MeteoCityLabels>>> = {},
): Record<MeteoCityId, MeteoCityLabels> {
  const base = (id: MeteoCityId): MeteoCityLabels => ({
    cond: `cond-${id}`,
    aqiLabel: `aqi-${id}`,
    windTxt: `wind-${id}`,
  });
  const withOverride = (id: MeteoCityId): MeteoCityLabels => ({
    ...base(id),
    ...(overrides[id] ?? {}),
  });
  return {
    bordeaux: withOverride("bordeaux"),
    paris: withOverride("paris"),
    nice: withOverride("nice"),
    lyon: withOverride("lyon"),
  };
}

describe("meteo-demo — ARC (geometrie de l'arc solaire)", () => {
  it("devrait exposer la geometrie verbatim de la maquette", () => {
    expect(ARC).toEqual({ cx: 95, cy: 92, r: 78, rayTop: 14 });
  });
});

describe("meteo-demo — createMeteoCities", () => {
  it("devrait retourner exactement 4 villes", () => {
    const cities = createMeteoCities(buildMeteoLabels());
    expect(cities.length).toBe(4);
  });

  it("devrait respecter l'ordre d'affichage bordeaux → paris → nice → lyon", () => {
    const cities = createMeteoCities(buildMeteoLabels());
    expect(cities.map((c) => c.id)).toEqual([
      "bordeaux",
      "paris",
      "nice",
      "lyon",
    ]);
  });

  it("devrait exposer les noms affiches attendus", () => {
    const cities = createMeteoCities(buildMeteoLabels());
    expect(cities.map((c) => c.name)).toEqual([
      "Bordeaux",
      "Paris",
      "Nice",
      "Lyon",
    ]);
  });

  it("devrait porter les valeurs numeriques exactes pour Bordeaux (19/18/64/4/22/14/270/0.5, 06:42→21:18)", () => {
    const bordeaux = createMeteoCities(buildMeteoLabels())[0];
    expect(bordeaux).toEqual(
      jasmine.objectContaining<DemoCity>({
        id: "bordeaux",
        temp: 19,
        feels: 18,
        hum: 64,
        uv: 4,
        aqi: 22,
        wind: 14,
        windDeg: 270,
        sun: 0.5,
        sunrise: "06:42",
        sunset: "21:18",
      }),
    );
  });

  it("devrait porter les valeurs numeriques exactes pour Paris (windDeg 0, sun 0.32)", () => {
    const paris = createMeteoCities(buildMeteoLabels())[1];
    expect(paris).toEqual(
      jasmine.objectContaining<DemoCity>({
        id: "paris",
        temp: 16,
        feels: 14,
        hum: 71,
        uv: 3,
        aqi: 34,
        wind: 18,
        windDeg: 0,
        sun: 0.32,
        sunrise: "06:31",
        sunset: "21:34",
      }),
    );
  });

  it("devrait porter les valeurs numeriques exactes pour Nice (24/…/135/0.68)", () => {
    const nice = createMeteoCities(buildMeteoLabels())[2];
    expect(nice).toEqual(
      jasmine.objectContaining<DemoCity>({
        id: "nice",
        temp: 24,
        feels: 25,
        hum: 52,
        uv: 7,
        aqi: 18,
        wind: 9,
        windDeg: 135,
        sun: 0.68,
        sunrise: "06:18",
        sunset: "21:06",
      }),
    );
  });

  it("devrait porter les valeurs numeriques exactes pour Lyon (180/0.45)", () => {
    const lyon = createMeteoCities(buildMeteoLabels())[3];
    expect(lyon).toEqual(
      jasmine.objectContaining<DemoCity>({
        id: "lyon",
        temp: 21,
        feels: 20,
        hum: 58,
        uv: 5,
        aqi: 27,
        wind: 12,
        windDeg: 180,
        sun: 0.45,
        sunrise: "06:25",
        sunset: "21:22",
      }),
    );
  });

  it("devrait reporter les libelles i18n fournis (cond/aqiLabel/windTxt) par ville", () => {
    const labels = buildMeteoLabels({
      bordeaux: {
        cond: "Ciel voile · brise d'ouest",
        aqiLabel: "Bon",
        windTxt: "O",
      },
    });
    const bordeaux = createMeteoCities(labels)[0];
    expect(bordeaux.cond).toBe("Ciel voile · brise d'ouest");
    expect(bordeaux.aqiLabel).toBe("Bon");
    expect(bordeaux.windTxt).toBe("O");
  });

  it("devrait injecter des libelles distincts pour chaque ville (aucune fuite entre villes)", () => {
    const cities = createMeteoCities(buildMeteoLabels());
    expect(cities.map((c) => c.cond)).toEqual([
      "cond-bordeaux",
      "cond-paris",
      "cond-nice",
      "cond-lyon",
    ]);
    expect(cities.map((c) => c.windTxt)).toEqual([
      "wind-bordeaux",
      "wind-paris",
      "wind-nice",
      "wind-lyon",
    ]);
  });
});

describe("meteo-demo — needleTransform", () => {
  it("devrait produire la transformation SVG pour un vent d'ouest (270)", () => {
    expect(needleTransform(270)).toBe("rotate(270, 90, 90)");
  });

  it("devrait produire la transformation SVG pour un vent du nord (0)", () => {
    expect(needleTransform(0)).toBe("rotate(0, 90, 90)");
  });

  it("devrait pivoter autour du centre (90, 90) quelle que soit la direction", () => {
    expect(needleTransform(135)).toBe("rotate(135, 90, 90)");
  });
});

describe("meteo-demo — sunDot (coordonnees du soleil sur l'arc)", () => {
  it("devrait placer le soleil au zenith pour sun=0.5 → {x:95, y:14}", () => {
    const dot = sunDot(0.5);
    expect(dot.x).toBeCloseTo(95, 6);
    expect(dot.y).toBeCloseTo(14, 6);
  });

  it("devrait placer le soleil a l'extremite droite pour sun=0 (angle=π) → {x:173, y:92}", () => {
    const dot = sunDot(0);
    expect(dot.x).toBeCloseTo(173, 6);
    expect(dot.y).toBeCloseTo(92, 6);
  });

  it("devrait placer le soleil a l'extremite gauche pour sun=1 (angle=0) → {x:17, y:92}", () => {
    const dot = sunDot(1);
    expect(dot.x).toBeCloseTo(17, 6);
    expect(dot.y).toBeCloseTo(92, 6);
  });

  it("devrait respecter la formule angle=π·(1-sun) sur l'arc ARC", () => {
    const sun = 0.68;
    const angle = Math.PI * (1 - sun);
    const dot = sunDot(sun);
    expect(dot.x).toBeCloseTo(ARC.cx - Math.cos(angle) * ARC.r, 6);
    expect(dot.y).toBeCloseTo(
      ARC.cy - Math.sin(angle) * (ARC.cy - ARC.rayTop),
      6,
    );
  });
});
