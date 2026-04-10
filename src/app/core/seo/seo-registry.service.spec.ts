import { LOCALE_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";
import { SeoRegistryService } from "./seo-registry.service";

/**
 * Tests du SeoRegistryService.
 *
 * Le service charge le fichier seo-metadata.json a l'initialisation.
 * Les tests verifient la resolution par cle, par chemin, la gestion
 * des locales, les fallbacks et les cas limites.
 */
describe("SeoRegistryService", () => {
  /** Cree le service avec la locale donnee. */
  function createService(locale: string): SeoRegistryService {
    TestBed.configureTestingModule({
      providers: [SeoRegistryService, { provide: LOCALE_ID, useValue: locale }],
    });
    return TestBed.inject(SeoRegistryService);
  }

  describe("getBaseUrl", () => {
    it("devrait retourner l'URL de base du site", () => {
      const service = createService("fr");
      expect(service.getBaseUrl()).toBe("https://asilidesign.fr");
    });
  });

  describe("getLocales", () => {
    it("devrait retourner les locales configurees", () => {
      const service = createService("fr");
      const locales = service.getLocales();
      expect(locales).toContain("fr");
      expect(locales).toContain("en");
      expect(locales.length).toBe(2);
    });
  });

  describe("getLocaleId", () => {
    it("devrait retourner 'fr' quand la locale est 'fr'", () => {
      const service = createService("fr");
      expect(service.getLocaleId()).toBe("fr");
    });

    it("devrait retourner 'en' quand la locale est 'en'", () => {
      const service = createService("en");
      expect(service.getLocaleId()).toBe("en");
    });

    it("devrait extraire la langue de base d'une locale composee (ex: fr-FR)", () => {
      const service = createService("fr-FR");
      expect(service.getLocaleId()).toBe("fr");
    });

    it("devrait retourner la locale par defaut pour une locale inconnue", () => {
      const service = createService("ja");
      expect(service.getLocaleId()).toBe("fr");
    });
  });

  describe("getDefaultLocale", () => {
    it("devrait retourner 'fr' comme locale par defaut", () => {
      const service = createService("fr");
      expect(service.getDefaultLocale()).toBe("fr");
    });
  });

  describe("getSeoByKey", () => {
    it("devrait retourner la config SEO pour la cle 'home'", async () => {
      const service = createService("fr");
      const result = await firstValueFrom(service.getSeoByKey("home"));

      expect(result).not.toBeNull();
      expect(result!.seo.title).toBe("Accueil — Tim Moyence Portfolio");
      expect(result!.seo.description).toBe(
        "Découvrez mes services professionnels, réalisations et solutions digitales sur mesure. Tim Moyence, développeur web freelance à Bordeaux.",
      );
      expect(result!.index).toBeTrue();
      expect(result!.page.id).toBe("home");
    });

    it("devrait retourner la config SEO en anglais pour la cle 'home'", async () => {
      const service = createService("en");
      const result = await firstValueFrom(service.getSeoByKey("home"));

      expect(result).not.toBeNull();
      expect(result!.seo.title).toBe("Home — Tim Moyence Portfolio");
    });

    it("devrait retourner null pour une cle inexistante", async () => {
      const service = createService("fr");
      const result = await firstValueFrom(
        service.getSeoByKey("cle-inexistante"),
      );

      expect(result).toBeNull();
    });

    it("devrait inclure les defaults (keywords, ogImage) si la page ne les definit pas", async () => {
      const service = createService("fr");
      const result = await firstValueFrom(service.getSeoByKey("home"));

      expect(result).not.toBeNull();
      // Les keywords viennent des defaults car la page 'home' n'en definit pas
      expect(result!.seo.keywords).toBeDefined();
      expect(result!.seo.keywords!.length).toBeGreaterThan(0);
      // ogImage vient des defaults
      expect(result!.seo.ogImage).toBe("/assets/images/logo.webp");
      // twitterCard vient des defaults
      expect(result!.seo.twitterCard).toBe("summary_large_image");
    });

    it("devrait retourner index false pour la page login", async () => {
      const service = createService("fr");
      const result = await firstValueFrom(service.getSeoByKey("login"));

      expect(result).not.toBeNull();
      expect(result!.index).toBeFalse();
    });

    it("devrait retourner les ogTitle et ogDescription depuis la page", async () => {
      const service = createService("fr");
      const result = await firstValueFrom(service.getSeoByKey("home"));

      expect(result).not.toBeNull();
      expect(result!.seo.ogTitle).toBe("Accueil de Tim Moyence");
      expect(result!.seo.ogDescription).toBe(
        "Découvrez mes services professionnels et mes réalisations en développement web.",
      );
    });
  });

  describe("getSeoByPath", () => {
    it("devrait retourner la config SEO pour le chemin '/'", async () => {
      const service = createService("fr");
      const result = await firstValueFrom(service.getSeoByPath("/"));

      expect(result).not.toBeNull();
      expect(result!.page.id).toBe("home");
    });

    it("devrait retourner la config SEO pour '/presentation'", async () => {
      const service = createService("fr");
      const result = await firstValueFrom(
        service.getSeoByPath("/presentation"),
      );

      expect(result).not.toBeNull();
      expect(result!.page.id).toBe("presentation");
      expect(result!.seo.title).toBe("Présentation — Tim Moyence Portfolio");
    });

    it("devrait normaliser le chemin en supprimant le prefixe de locale", async () => {
      const service = createService("fr");
      const result = await firstValueFrom(
        service.getSeoByPath("/fr/presentation"),
      );

      expect(result).not.toBeNull();
      expect(result!.page.id).toBe("presentation");
    });

    it("devrait normaliser le chemin '/home' vers la page d'accueil", async () => {
      const service = createService("fr");
      const result = await firstValueFrom(service.getSeoByPath("/home"));

      expect(result).not.toBeNull();
      expect(result!.page.id).toBe("home");
    });

    it("devrait retourner null pour un chemin inexistant", async () => {
      const service = createService("fr");
      const result = await firstValueFrom(
        service.getSeoByPath("/chemin-inexistant"),
      );

      expect(result).toBeNull();
    });

    it("devrait ignorer les query params et fragments", async () => {
      const service = createService("fr");
      const result = await firstValueFrom(
        service.getSeoByPath("/contact?source=test#section"),
      );

      expect(result).not.toBeNull();
      expect(result!.page.id).toBe("contact");
    });

    it("devrait normaliser les slashs en trop", async () => {
      const service = createService("fr");
      const result = await firstValueFrom(
        service.getSeoByPath("///contact///"),
      );

      expect(result).not.toBeNull();
      expect(result!.page.id).toBe("contact");
    });
  });

  describe("resolution de locale avec fallback", () => {
    it("devrait fallback sur la locale par defaut si la locale demandee n'existe pas dans la page", async () => {
      const service = createService("ja");
      const result = await firstValueFrom(service.getSeoByKey("home"));

      expect(result).not.toBeNull();
      // Fallback vers 'fr' (defaultLocale) puisque 'ja' n'existe pas
      expect(result!.seo.title).toBe("Accueil — Tim Moyence Portfolio");
    });

    it("devrait fallback depuis une locale composee vers la langue de base", async () => {
      const service = createService("fr-CA");
      const result = await firstValueFrom(service.getSeoByKey("home"));

      expect(result).not.toBeNull();
      // fr-CA n'existe pas, mais fr (base) oui
      expect(result!.seo.title).toBe("Accueil — Tim Moyence Portfolio");
    });
  });
});
