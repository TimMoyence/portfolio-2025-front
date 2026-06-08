import type express from "express";
import {
  ALLOWED_HOSTS,
  LOCALE_BARE_PATH,
  LOCALE_PREFIX_RE,
  STRIP_LOCALE_RE,
  buildBaseUrlFromRequest,
  buildLocalizedPath,
  normalizePath,
} from "./url-utils";

/**
 * Construit un stub minimal d'`express.Request` pour tester la resolution
 * de base URL (headers + accesseur `get`).
 */
const stubRequest = (opts: {
  headers?: Record<string, string>;
  host?: string;
  protocol?: string;
}): express.Request => {
  const headers = opts.headers ?? {};
  return {
    headers,
    protocol: opts.protocol ?? "https",
    get(name: string): string | undefined {
      if (name.toLowerCase() === "host") return opts.host;
      return headers[name.toLowerCase()];
    },
  } as unknown as express.Request;
};

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

  describe("buildBaseUrlFromRequest", () => {
    it("accepte un host allowliste depuis x-forwarded-host", () => {
      const req = stubRequest({
        headers: {
          "x-forwarded-host": "asilidesign.fr",
          "x-forwarded-proto": "https",
        },
        host: "portfolio-web-fr",
      });
      expect(buildBaseUrlFromRequest(req)).toBe("https://asilidesign.fr");
    });

    it("IGNORE un x-forwarded-host non allowliste (anti-poisoning) et retombe sur req.host", () => {
      const req = stubRequest({
        headers: {
          "x-forwarded-host": "evil.example.com",
          "x-forwarded-proto": "https",
        },
        host: "asilidesign.fr",
      });
      expect(buildBaseUrlFromRequest(req)).toBe("https://asilidesign.fr");
    });

    it("retombe sur le fallback si ni forwarded ni host ne sont allowlistes", () => {
      const req = stubRequest({
        headers: { "x-forwarded-host": "evil.example.com" },
        host: "also-evil.example.com",
      });
      expect(buildBaseUrlFromRequest(req, "https://asilidesign.fr")).toBe(
        "https://asilidesign.fr",
      );
    });

    it("retombe sur https://asilidesign.fr sans fallback fourni", () => {
      const req = stubRequest({
        headers: { "x-forwarded-host": "evil.example.com" },
        host: "also-evil.example.com",
      });
      expect(buildBaseUrlFromRequest(req)).toBe("https://asilidesign.fr");
    });

    it("ignore un x-forwarded-proto non http/https et retombe sur req.protocol", () => {
      const req = stubRequest({
        headers: {
          "x-forwarded-host": "asilidesign.fr",
          "x-forwarded-proto": "javascript",
        },
        host: "asilidesign.fr",
        protocol: "https",
      });
      expect(buildBaseUrlFromRequest(req)).toBe("https://asilidesign.fr");
    });

    it("respecte le proto forwarded http (allowliste) avec host allowliste", () => {
      const req = stubRequest({
        headers: {
          "x-forwarded-host": "localhost",
          "x-forwarded-proto": "http",
        },
        host: "localhost",
      });
      expect(buildBaseUrlFromRequest(req)).toBe("http://localhost");
    });

    it("traite le host insensiblement a la casse et au port", () => {
      const req = stubRequest({
        headers: { "x-forwarded-host": "ASILIDESIGN.FR:8080" },
        host: "asilidesign.fr",
        protocol: "https",
      });
      expect(buildBaseUrlFromRequest(req)).toBe("https://ASILIDESIGN.FR:8080");
    });

    it("expose la liste partagee des hotes autorises", () => {
      expect(ALLOWED_HOSTS).toContain("asilidesign.fr");
      expect(ALLOWED_HOSTS).toContain("www.asilidesign.fr");
      expect(ALLOWED_HOSTS).toContain("localhost");
      expect(ALLOWED_HOSTS).toContain("127.0.0.1");
      expect(ALLOWED_HOSTS).toContain("portfolio-web-fr");
      expect(ALLOWED_HOSTS).toContain("portfolio-web-en");
    });
  });
});
