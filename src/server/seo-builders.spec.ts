import type { SeoMetadataFile } from "../app/core/seo/seo-metadata.model";
import {
  buildLlmsFullTxt,
  buildLlmsTxt,
  buildRobotsTxt,
  buildSitemapXml,
} from "./seo-builders";

const buildMetadata = (
  pages: SeoMetadataFile["pages"],
  overrides: Partial<SeoMetadataFile> = {},
): SeoMetadataFile =>
  ({
    site: {
      baseUrl: "https://asilidesign.fr",
      defaultLocale: "fr",
      locales: ["fr", "en"],
      homePath: "/",
    },
    pages,
    ...overrides,
  }) as SeoMetadataFile;

describe("buildRobotsTxt", () => {
  it("emet un Disallow pour chaque page non-indexable standard", () => {
    const metadata = buildMetadata([
      {
        id: "login",
        path: "/login",
        index: false,
        locales: { fr: { title: "x", description: "x" } },
      },
    ] as SeoMetadataFile["pages"]);

    const robots = buildRobotsTxt(metadata, "https://asilidesign.fr");

    expect(robots).toContain("Disallow: /login");
    expect(robots).toContain("Disallow: /fr/login");
    expect(robots).toContain("Disallow: /en/login");
  });

  it("ignore les pages dont le path contient un parametre de route", () => {
    const metadata = buildMetadata([
      {
        id: "toolkit-private",
        path: "/formations/ia-solopreneurs/toolkit/:token",
        index: false,
        locales: { fr: { title: "x", description: "x" } },
      },
    ] as SeoMetadataFile["pages"]);

    const robots = buildRobotsTxt(metadata, "https://asilidesign.fr");

    expect(robots).not.toContain(":token");
    expect(robots).not.toContain("/formations/ia-solopreneurs/toolkit/");
  });

  it("ignore cookie-settings pour permettre crawl + noindex meta", () => {
    const metadata = buildMetadata([
      {
        id: "cookie-settings",
        path: "/cookie-settings",
        index: false,
        locales: { fr: { title: "x", description: "x" } },
      },
    ] as SeoMetadataFile["pages"]);

    const robots = buildRobotsTxt(metadata, "https://asilidesign.fr");

    expect(robots).not.toContain("Disallow: /cookie-settings");
    expect(robots).not.toContain("Disallow: /fr/cookie-settings");
    expect(robots).not.toContain("Disallow: /en/cookie-settings");
  });

  it("emet le Sitemap absolu en fin de fichier", () => {
    const metadata = buildMetadata([] as SeoMetadataFile["pages"]);

    const robots = buildRobotsTxt(metadata, "https://asilidesign.fr");

    expect(robots).toContain("Sitemap: https://asilidesign.fr/sitemap.xml");
  });

  it("emet un bloc Allow / quand toutes les pages sont indexables", () => {
    const metadata = buildMetadata([
      {
        id: "home",
        path: "/",
        index: true,
        locales: { fr: { title: "x", description: "x" } },
      },
    ] as SeoMetadataFile["pages"]);

    const robots = buildRobotsTxt(metadata, "https://asilidesign.fr");

    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).not.toContain("Disallow:");
  });

  it("inclut un bloc dedie pour chaque user-agent IA", () => {
    const metadata = buildMetadata([] as SeoMetadataFile["pages"]);

    const robots = buildRobotsTxt(metadata, "https://asilidesign.fr");

    expect(robots).toContain("User-agent: GPTBot");
    expect(robots).toContain("User-agent: ClaudeBot");
    expect(robots).toContain("User-agent: PerplexityBot");
    expect(robots).toContain("User-agent: Google-Extended");
  });

  it("supporte une metadata sans locales (fallback liste vide)", () => {
    const metadata = buildMetadata(
      [
        {
          id: "login",
          path: "/login",
          index: false,
          locales: { fr: { title: "x", description: "x" } },
        },
      ] as SeoMetadataFile["pages"],
      { site: { defaultLocale: "fr", locales: [] as string[] } as never },
    );

    const robots = buildRobotsTxt(metadata, "https://asilidesign.fr");

    expect(robots).toContain("Disallow: /login");
    expect(robots).not.toContain("Disallow: /fr/login");
  });
});

describe("buildSitemapXml", () => {
  it("emet une entree par locale active pour chaque page indexable", () => {
    const metadata = buildMetadata([
      {
        id: "home",
        path: "/",
        index: true,
        locales: { fr: { title: "Accueil", description: "x" } },
      },
    ] as SeoMetadataFile["pages"]);

    const xml = buildSitemapXml(metadata, "https://asilidesign.fr");

    expect(xml).toContain("<?xml version=");
    expect(xml).toContain("<urlset");
    expect(xml).toContain("<loc>https://asilidesign.fr/fr/</loc>");
    expect(xml).toContain("<loc>https://asilidesign.fr/en/</loc>");
  });

  it("filtre les pages avec index:false", () => {
    const metadata = buildMetadata([
      {
        id: "login",
        path: "/login",
        index: false,
        locales: { fr: { title: "x", description: "x" } },
      },
    ] as SeoMetadataFile["pages"]);

    const xml = buildSitemapXml(metadata, "https://asilidesign.fr");

    expect(xml).not.toContain("/login");
  });

  it("emet lastmod, changefreq et priority quand fournis", () => {
    const metadata = buildMetadata([
      {
        id: "offer",
        path: "/offer",
        index: true,
        lastmod: "2026-04-01",
        changefreq: "weekly",
        priority: 0.8,
        locales: { fr: { title: "Offre", description: "x" } },
      },
    ] as SeoMetadataFile["pages"]);

    const xml = buildSitemapXml(metadata, "https://asilidesign.fr");

    expect(xml).toContain("<lastmod>2026-04-01</lastmod>");
    expect(xml).toContain("<changefreq>weekly</changefreq>");
    expect(xml).toContain("<priority>0.8</priority>");
  });

  it("omet lastmod/changefreq/priority quand absents", () => {
    const metadata = buildMetadata([
      {
        id: "contact",
        path: "/contact",
        index: true,
        locales: { fr: { title: "Contact", description: "x" } },
      },
    ] as SeoMetadataFile["pages"]);

    const xml = buildSitemapXml(metadata, "https://asilidesign.fr");

    expect(xml).not.toContain("<lastmod>");
    expect(xml).not.toContain("<changefreq>");
    expect(xml).not.toContain("<priority>");
  });

  it("emet des alternates hreflang + x-default", () => {
    const metadata = buildMetadata([
      {
        id: "home",
        path: "/",
        index: true,
        locales: { fr: { title: "Accueil", description: "x" } },
      },
    ] as SeoMetadataFile["pages"]);

    const xml = buildSitemapXml(metadata, "https://asilidesign.fr");

    expect(xml).toContain('hreflang="fr"');
    expect(xml).toContain('hreflang="en"');
    expect(xml).toContain('hreflang="x-default"');
  });

  it("traite home en mappant son path sur /", () => {
    const metadata = buildMetadata([
      {
        id: "home",
        path: "/anything",
        index: true,
        locales: { fr: { title: "Accueil", description: "x" } },
      },
    ] as SeoMetadataFile["pages"]);

    const xml = buildSitemapXml(metadata, "https://asilidesign.fr");

    expect(xml).toContain("<loc>https://asilidesign.fr/fr/</loc>");
    expect(xml).not.toContain("/anything");
  });

  it("retombe sur une locale unique vide quand aucune locale n'est definie", () => {
    const metadata = buildMetadata(
      [
        {
          id: "page",
          path: "/page",
          index: true,
          locales: { fr: { title: "x", description: "x" } },
        },
      ] as SeoMetadataFile["pages"],
      { site: { defaultLocale: "", locales: [] as string[] } as never },
    );

    const xml = buildSitemapXml(metadata, "https://asilidesign.fr");

    expect(xml).toContain("<loc>https://asilidesign.fr/page</loc>");
  });
});

describe("buildLlmsTxt", () => {
  const baseGlobal = {
    localBusiness: {
      name: "Asili Design",
      description: "Studio web Tim Moyence",
      founder: { name: "Tim Moyence" },
    },
    siteNavigation: {},
  } as never;

  it("groupe les pages par section (Services, A propos, Apps, Contact, Legal)", () => {
    const metadata = buildMetadata(
      [
        {
          id: "offer",
          path: "/offer",
          index: true,
          locales: { fr: { title: "Offre", description: "Voir l'offre" } },
        },
        {
          id: "presentation",
          path: "/presentation",
          index: true,
          locales: { fr: { title: "Presentation", description: "A propos" } },
        },
        {
          id: "weather",
          path: "/atelier/meteo",
          index: true,
          locales: { fr: { title: "Meteo", description: "App meteo" } },
        },
        {
          id: "contact",
          path: "/contact",
          index: true,
          locales: { fr: { title: "Contact", description: "Nous ecrire" } },
        },
        {
          id: "terms",
          path: "/terms",
          index: true,
          locales: { fr: { title: "CGU", description: "Conditions" } },
        },
      ] as SeoMetadataFile["pages"],
      { global: baseGlobal },
    );

    const txt = buildLlmsTxt(metadata, "https://asilidesign.fr");

    expect(txt).toContain("# Asili Design — Tim Moyence");
    expect(txt).toContain("## Services");
    expect(txt).toContain("## A propos");
    expect(txt).toContain("## Applications metier");
    expect(txt).toContain("## Contact");
    expect(txt).toContain("## Legal");
    expect(txt).toContain("[Offre](https://asilidesign.fr/fr/offer)");
  });

  it("inclut formations comme Services (hub + sous-formations)", () => {
    const metadata = buildMetadata(
      [
        {
          id: "formations",
          path: "/formations",
          index: true,
          locales: { fr: { title: "Formations", description: "Hub" } },
        },
        {
          id: "formations-ia-solo",
          path: "/formations/ia-solopreneurs",
          index: true,
          locales: { fr: { title: "IA Solo", description: "Formation IA" } },
        },
      ] as SeoMetadataFile["pages"],
      { global: baseGlobal },
    );

    const txt = buildLlmsTxt(metadata, "https://asilidesign.fr");

    expect(txt).toContain("## Services");
    expect(txt).toContain("[Formations]");
    expect(txt).toContain("[IA Solo]");
  });

  it("utilise homeTagline en quote si home est indexable", () => {
    const metadata = buildMetadata(
      [
        {
          id: "home",
          path: "/",
          index: true,
          locales: { fr: { title: "Accueil", description: "Mon tagline" } },
        },
      ] as SeoMetadataFile["pages"],
      { global: baseGlobal },
    );

    const txt = buildLlmsTxt(metadata, "https://asilidesign.fr");

    expect(txt).toContain("> Mon tagline");
  });

  it("retombe sur siteDescription quand pas de home", () => {
    const metadata = buildMetadata(
      [
        {
          id: "offer",
          path: "/offer",
          index: true,
          locales: { fr: { title: "Offre", description: "x" } },
        },
      ] as SeoMetadataFile["pages"],
      { global: baseGlobal },
    );

    const txt = buildLlmsTxt(metadata, "https://asilidesign.fr");

    expect(txt).toContain("> Studio web Tim Moyence");
  });

  it("utilise les fallbacks par defaut quand global.localBusiness est absent", () => {
    const metadata = buildMetadata(
      [
        {
          id: "offer",
          path: "/offer",
          index: true,
          locales: { fr: { title: "Offre", description: "x" } },
        },
      ] as SeoMetadataFile["pages"],
      { global: undefined },
    );

    const txt = buildLlmsTxt(metadata, "https://asilidesign.fr");

    expect(txt).toContain("# Asili Design — Tim Moyence");
  });

  it("utilise une description vide quand meta.description manquante", () => {
    const metadata = buildMetadata(
      [
        {
          id: "offer",
          path: "/offer",
          index: true,
          locales: { fr: { title: "Offre", description: "" } },
        },
      ] as SeoMetadataFile["pages"],
      { global: baseGlobal },
    );

    const txt = buildLlmsTxt(metadata, "https://asilidesign.fr");

    expect(txt).toContain("[Offre](https://asilidesign.fr/fr/offer)");
    expect(txt).not.toContain("[Offre](https://asilidesign.fr/fr/offer):");
  });

  it("retombe sur la premiere locale quand defaultLocale n'a pas de meta", () => {
    const metadata = buildMetadata(
      [
        {
          id: "offer",
          path: "/offer",
          index: true,
          locales: { en: { title: "Offer EN", description: "Service" } },
        },
      ] as SeoMetadataFile["pages"],
      { global: baseGlobal },
    );

    const txt = buildLlmsTxt(metadata, "https://asilidesign.fr");

    expect(txt).toContain("Offer EN");
  });

  it("ignore les pages avec index:false", () => {
    const metadata = buildMetadata(
      [
        {
          id: "login",
          path: "/login",
          index: false,
          locales: { fr: { title: "Login", description: "x" } },
        },
      ] as SeoMetadataFile["pages"],
      { global: baseGlobal },
    );

    const txt = buildLlmsTxt(metadata, "https://asilidesign.fr");

    expect(txt).not.toContain("Login");
  });
});

describe("buildLlmsFullTxt", () => {
  const baseGlobal = {
    localBusiness: { name: "Asili Design", description: "Studio web" },
    siteNavigation: {},
  } as never;

  it("emet un header avec le nom du site", () => {
    const metadata = buildMetadata([] as SeoMetadataFile["pages"], {
      global: baseGlobal,
    });

    const txt = buildLlmsFullTxt(metadata, "https://asilidesign.fr");

    expect(txt).toContain("# Asili Design — llms-full");
  });

  it("emet une section par page indexable avec URL et description", () => {
    const metadata = buildMetadata(
      [
        {
          id: "offer",
          path: "/offer",
          index: true,
          locales: {
            fr: { title: "Offre", description: "Voir l'offre detaillee" },
          },
        },
      ] as SeoMetadataFile["pages"],
      { global: baseGlobal },
    );

    const txt = buildLlmsFullTxt(metadata, "https://asilidesign.fr");

    expect(txt).toContain("## Offre");
    expect(txt).toContain("- URL: https://asilidesign.fr/fr/offer");
    expect(txt).toContain("Voir l'offre detaillee");
  });

  it("inclut Last modified quand lastmod est defini", () => {
    const metadata = buildMetadata(
      [
        {
          id: "offer",
          path: "/offer",
          index: true,
          lastmod: "2026-05-01",
          locales: { fr: { title: "Offre", description: "x" } },
        },
      ] as SeoMetadataFile["pages"],
      { global: baseGlobal },
    );

    const txt = buildLlmsFullTxt(metadata, "https://asilidesign.fr");

    expect(txt).toContain("- Last modified: 2026-05-01");
  });

  it("inclut Keywords (max 10) quand definis", () => {
    const metadata = buildMetadata(
      [
        {
          id: "offer",
          path: "/offer",
          index: true,
          locales: {
            fr: {
              title: "Offre",
              description: "x",
              keywords: ["a", "b", "c"],
            },
          },
        },
      ] as SeoMetadataFile["pages"],
      { global: baseGlobal },
    );

    const txt = buildLlmsFullTxt(metadata, "https://asilidesign.fr");

    expect(txt).toContain("- Keywords: a, b, c");
  });

  it("omet keywords si liste vide", () => {
    const metadata = buildMetadata(
      [
        {
          id: "offer",
          path: "/offer",
          index: true,
          locales: {
            fr: { title: "Offre", description: "x", keywords: [] },
          },
        },
      ] as SeoMetadataFile["pages"],
      { global: baseGlobal },
    );

    const txt = buildLlmsFullTxt(metadata, "https://asilidesign.fr");

    expect(txt).not.toContain("- Keywords:");
  });

  it("traite home en mappant son path sur /", () => {
    const metadata = buildMetadata(
      [
        {
          id: "home",
          path: "/whatever",
          index: true,
          locales: { fr: { title: "Accueil", description: "x" } },
        },
      ] as SeoMetadataFile["pages"],
      { global: baseGlobal },
    );

    const txt = buildLlmsFullTxt(metadata, "https://asilidesign.fr");

    expect(txt).toContain("- URL: https://asilidesign.fr/fr");
    expect(txt).not.toContain("/whatever");
  });

  it("ignore les pages dont le defaultLocale n'a pas de meta (ni fallback)", () => {
    const metadata = buildMetadata(
      [
        {
          id: "ghost",
          path: "/ghost",
          index: true,
          locales: {} as Record<string, never>,
        },
      ] as SeoMetadataFile["pages"],
      { global: baseGlobal },
    );

    const txt = buildLlmsFullTxt(metadata, "https://asilidesign.fr");

    expect(txt).not.toContain("/ghost");
  });

  it("retombe sur Asili Design quand global.localBusiness est absent", () => {
    const metadata = buildMetadata([] as SeoMetadataFile["pages"], {
      global: undefined,
    });

    const txt = buildLlmsFullTxt(metadata, "https://asilidesign.fr");

    expect(txt).toContain("# Asili Design — llms-full");
  });
});
