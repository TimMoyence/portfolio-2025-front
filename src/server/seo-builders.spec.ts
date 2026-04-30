import type { SeoMetadataFile } from "../app/core/seo/seo-metadata.model";
import { buildRobotsTxt } from "./seo-builders";

const buildMetadata = (pages: SeoMetadataFile["pages"]): SeoMetadataFile =>
  ({
    site: {
      baseUrl: "https://asilidesign.fr",
      defaultLocale: "fr",
      locales: ["fr", "en"],
      homePath: "/",
    },
    pages,
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
});
