import {
  normalizeLocale,
  selectLocalizedString,
} from "./formation-locale.util";

describe("formation-locale.util", () => {
  describe("normalizeLocale", () => {
    it("retourne fr par defaut quand la valeur est absente ou vide", () => {
      expect(normalizeLocale(undefined)).toBe("fr");
      expect(normalizeLocale(null)).toBe("fr");
      expect(normalizeLocale("")).toBe("fr");
    });

    it("accepte les locales primaires supportees", () => {
      expect(normalizeLocale("fr")).toBe("fr");
      expect(normalizeLocale("en")).toBe("en");
    });

    it("extrait la locale primaire ISO-639 d'un tag regionalise", () => {
      expect(normalizeLocale("fr-FR")).toBe("fr");
      expect(normalizeLocale("en-US")).toBe("en");
      expect(normalizeLocale("en_GB")).toBe("en");
    });

    it("retombe sur fr pour une locale non supportee", () => {
      expect(normalizeLocale("de")).toBe("fr");
      expect(normalizeLocale("es-ES")).toBe("fr");
      expect(normalizeLocale("xx")).toBe("fr");
    });
  });

  describe("selectLocalizedString", () => {
    it("retourne la valeur de la locale demandee sans fallback silencieux", () => {
      const value = { fr: "Bonjour", en: "Hello" };
      expect(selectLocalizedString(value, "fr")).toBe("Bonjour");
      expect(selectLocalizedString(value, "en")).toBe("Hello");
    });
  });
});
