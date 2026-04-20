import {
  LOCALE_BARE_PATH,
  LOCALE_PREFIX_RE,
  STRIP_LOCALE_RE,
  buildLocalizedPath,
  normalizePath,
} from "./url-utils";

describe("url-utils", () => {
  describe("normalizePath", () => {
    it("retire le trailing slash des chemins non racines", () => {
      expect(normalizePath("/contact/")).toBe("/contact");
    });

    it("garde la racine telle quelle", () => {
      expect(normalizePath("/")).toBe("/");
    });

    it("supprime les query et fragment", () => {
      expect(normalizePath("/fr/presentation?utm=x#section")).toBe(
        "/fr/presentation",
      );
    });
  });

  describe("buildLocalizedPath", () => {
    it("emet la racine locale AVEC trailing slash (alignement nginx)", () => {
      expect(buildLocalizedPath("fr", "/")).toBe("/fr/");
      expect(buildLocalizedPath("en", "/")).toBe("/en/");
    });

    it("emet les sous-pages SANS trailing slash (alignement middleware Express)", () => {
      expect(buildLocalizedPath("fr", "/contact")).toBe("/fr/contact");
      expect(buildLocalizedPath("fr", "/atelier/meteo")).toBe(
        "/fr/atelier/meteo",
      );
    });

    it("normalise les inputs avec trailing slash", () => {
      expect(buildLocalizedPath("fr", "/contact/")).toBe("/fr/contact");
    });

    it("retourne le chemin non-localise si locale vide", () => {
      expect(buildLocalizedPath("", "/contact")).toBe("/contact");
      expect(buildLocalizedPath("", "/")).toBe("/");
    });
  });

  describe("LOCALE_BARE_PATH", () => {
    it("matche uniquement les chemins locale-seul avec slash final", () => {
      expect(LOCALE_BARE_PATH.test("/fr/")).toBeTrue();
      expect(LOCALE_BARE_PATH.test("/en/")).toBeTrue();
      expect(LOCALE_BARE_PATH.test("/fr")).toBeFalse();
      expect(LOCALE_BARE_PATH.test("/fr/contact")).toBeFalse();
    });
  });

  describe("LOCALE_PREFIX_RE", () => {
    it("extrait le prefixe locale en debut de chemin", () => {
      expect("/fr/contact".match(LOCALE_PREFIX_RE)?.[1]).toBe("fr");
      expect("/en".match(LOCALE_PREFIX_RE)?.[1]).toBe("en");
    });

    it("ignore les chemins sans prefixe locale reconnu", () => {
      expect("/contact".match(LOCALE_PREFIX_RE)).toBeNull();
      expect("/de/contact".match(LOCALE_PREFIX_RE)).toBeNull();
    });
  });

  describe("STRIP_LOCALE_RE", () => {
    it("supprime le prefixe locale", () => {
      expect("/fr/contact".replace(STRIP_LOCALE_RE, "")).toBe("contact");
      expect("/en/".replace(STRIP_LOCALE_RE, "")).toBe("");
    });
  });
});
