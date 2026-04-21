import type { PresentationSlide } from "../../../shared/models/slide.model";
import {
  assertValidFormationConfig,
  type FormationConfig,
} from "./formation.types";

/**
 * Tests exhaustifs du validateur `assertValidFormationConfig`. Un test
 * par invariant documente pour garantir qu'une regression du validateur
 * (suppression d'une verification, assouplissement d'une regex) soit
 * immediatement detectee.
 */
describe("assertValidFormationConfig", () => {
  const slide = {
    id: "s1",
    title: "t",
    fragmentCount: 0,
    act: { id: "a1", label: "A1" },
  } satisfies PresentationSlide;

  const baseConfig: FormationConfig = {
    configVersion: 1,
    slug: "valid-slug",
    metadata: {
      title: { fr: "T FR", en: "T EN" },
      description: { fr: "D FR", en: "D EN" },
      tagline: { fr: "Tag FR", en: "Tag EN" },
      duration: "PT30M",
      level: "beginner",
      category: "ia",
      tags: ["formation ia"],
      iconSlug: "sparkles",
      heroImage: "https://example.com/hero.jpg",
      heroImageAlt: { fr: "alt FR", en: "alt EN" },
      publishDate: "2026-01-01",
      lastModified: "2026-04-20",
      status: "published",
    },
    slides: [slide],
    leadMagnet: {
      enabled: true,
      pdfTemplateId: "tpl-1",
      emailDripId: "drip-1",
      customizationAxes: ["sector"],
    },
    seo: {
      keywords: ["kw"],
      prerequisites: [{ fr: "pre fr", en: "pre en" }],
      teaches: [{ fr: "t fr", en: "t en" }],
      learningResourceType: "Course",
      faq: Array.from({ length: 5 }, (_, i) => ({
        question: { fr: `q${i} fr`, en: `q${i} en` },
        answer: { fr: `a${i} fr`, en: `a${i} en` },
      })),
    },
    conversion: {
      primary: { labelKey: "k", href: "/", trackingId: "tid" },
    },
    analytics: {
      eventPrefix: "formation_",
      trackProgress: true,
      trackInteractions: true,
    },
  };

  it("accepte une configuration valide", () => {
    expect(() => assertValidFormationConfig(baseConfig)).not.toThrow();
  });

  it("rejette un slug non kebab-case", () => {
    expect(() =>
      assertValidFormationConfig({ ...baseConfig, slug: "Invalid_Slug" }),
    ).toThrowError(/kebab-case/);
  });

  it("rejette un slug vide", () => {
    expect(() =>
      assertValidFormationConfig({ ...baseConfig, slug: "" }),
    ).toThrowError(/kebab-case/);
  });

  it("rejette des slides vides", () => {
    expect(() =>
      assertValidFormationConfig({ ...baseConfig, slides: [] }),
    ).toThrowError(/slides must not be empty/);
  });

  it("rejette une duree non ISO 8601", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        metadata: { ...baseConfig.metadata, duration: "30 min" },
      }),
    ).toThrowError(/ISO 8601/);
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        metadata: { ...baseConfig.metadata, duration: "PT30Mblah" },
      }),
    ).toThrowError(/ISO 8601/);
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        metadata: { ...baseConfig.metadata, duration: "PT" },
      }),
    ).toThrowError(/ISO 8601/);
  });

  it("accepte une duree ISO 8601 composite", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        metadata: { ...baseConfig.metadata, duration: "PT1H30M" },
      }),
    ).not.toThrow();
  });

  it("rejette une hero image non absolue", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        metadata: { ...baseConfig.metadata, heroImage: "/assets/hero.jpg" },
      }),
    ).toThrowError(/heroImage/);
  });

  it("rejette publishDate > lastModified", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        metadata: {
          ...baseConfig.metadata,
          publishDate: "2026-05-01",
          lastModified: "2026-04-20",
        },
      }),
    ).toThrowError(/publishDate must be <= metadata.lastModified/);
  });

  it("rejette des dates non parseables", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        metadata: { ...baseConfig.metadata, publishDate: "not-a-date" },
      }),
    ).toThrowError(/publishDate/);
  });

  it("rejette tags vides", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        metadata: { ...baseConfig.metadata, tags: [] },
      }),
    ).toThrowError(/tags/);
  });

  it("rejette une FAQ < 5 entrees (AEO)", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        seo: { ...baseConfig.seo, faq: baseConfig.seo.faq.slice(0, 3) },
      }),
    ).toThrowError(/FAQPage/);
  });

  it("rejette teaches vide", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        seo: { ...baseConfig.seo, teaches: [] },
      }),
    ).toThrowError(/learning outcome/);
  });

  it("rejette un leadMagnet active sans pdfTemplateId", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        leadMagnet: { ...baseConfig.leadMagnet, pdfTemplateId: "" },
      }),
    ).toThrowError(/pdfTemplateId/);
  });

  it("rejette un leadMagnet active sans emailDripId", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        leadMagnet: { ...baseConfig.leadMagnet, emailDripId: "" },
      }),
    ).toThrowError(/emailDripId/);
  });

  it("rejette un leadMagnet active sans customizationAxes", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        leadMagnet: { ...baseConfig.leadMagnet, customizationAxes: [] },
      }),
    ).toThrowError(/customizationAxes/);
  });

  it("tolere un leadMagnet desactive sans ids", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        leadMagnet: {
          enabled: false,
          pdfTemplateId: "",
          emailDripId: "",
          customizationAxes: [],
        },
      }),
    ).not.toThrow();
  });
});
