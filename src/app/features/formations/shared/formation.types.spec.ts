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
      description: {
        fr: "Formation de test disponible en ligne pour valider les invariants du systeme de configuration des formations. Cette formation generique sert de socle commun a tous les tests unitaires du validateur. Elle permet de verifier que les contraintes de qualite sont respectees avant la publication de toute nouvelle formation. Le contenu aborde les principaux aspects de la validation des configurations incluant le format des identifiants de formation le nombre de diapositives la duree en format ISO 8601 les dates de publication et de modification les tags de categorisation la FAQ avec minimum cinq entrees les objectifs pedagogiques et les parametres du lead magnet. Chaque invariant est couvert par un test dedie garantissant une couverture exhaustive du validateur. La configuration valide sert de base pour les tests negatifs qui verifient le rejet des configurations incorrectes. Ce fichier de test est maintenu en parallele du code source.",
        en: "Test formation available online to validate the invariants of the formation configuration system. This generic formation serves as a common base for all unit tests of the validator. It allows verification that quality constraints are respected before publishing any new formation. The content covers the main aspects of configuration validation including the format of formation identifiers the number of slides the duration in ISO 8601 format publication and modification dates categorization tags the FAQ with a minimum of five entries learning outcomes and lead magnet parameters. Each invariant is covered by a dedicated test ensuring exhaustive coverage of the validator. The valid configuration serves as a base for negative tests that verify the rejection of incorrect configurations. This test file is maintained in parallel with the source code to ensure the consistency of business rules.",
      },
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

  it("rejette un configVersion different de 1", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        configVersion: 2 as unknown as 1,
      }),
    ).toThrowError(/configVersion must be 1/);
  });

  it("rejette un I18nString vide sur metadata.title", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        metadata: {
          ...baseConfig.metadata,
          title: { fr: "T FR", en: "" },
        },
      }),
    ).toThrowError(/metadata\.title/);
  });

  it("rejette un heroImageAlt vide (a11y)", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        metadata: {
          ...baseConfig.metadata,
          heroImageAlt: { fr: "", en: "alt en" },
        },
      }),
    ).toThrowError(/heroImageAlt/);
  });

  it("rejette un tagline vide", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        metadata: {
          ...baseConfig.metadata,
          tagline: { fr: "   ", en: "Tag EN" },
        },
      }),
    ).toThrowError(/metadata\.tagline/);
  });

  it("rejette des slide.id dupliques", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        slides: [slide, slide],
      }),
    ).toThrowError(/duplicate slide\.id/);
  });

  it("rejette un lastModified dans le futur au-dela de 24h", () => {
    const farFuture = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        metadata: {
          ...baseConfig.metadata,
          publishDate: "2026-01-01",
          lastModified: farFuture,
        },
      }),
    ).toThrowError(/in the future/);
  });

  it("rejette une conversion.primary.href vide", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        conversion: {
          primary: { labelKey: "k", href: "", trackingId: "tid" },
        },
      }),
    ).toThrowError(/conversion\.primary\.href/);
  });

  it("rejette une conversion.primary.trackingId vide", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        conversion: {
          primary: { labelKey: "k", href: "/", trackingId: "   " },
        },
      }),
    ).toThrowError(/trackingId/);
  });

  it("rejette un analytics.eventPrefix non snake_case", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        analytics: {
          ...baseConfig.analytics,
          eventPrefix: "Formation-IA",
        },
      }),
    ).toThrowError(/snake_case/);
  });

  it("rejette un quiz single-choice sans options", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        quiz: {
          id: "q1",
          questions: [
            {
              id: "q-secteur",
              question: { fr: "Secteur ?", en: "Sector?" },
              kind: "single-choice",
              profileField: "sector",
            },
          ],
        },
      }),
    ).toThrowError(/requires at least one option/);
  });

  it("accepte un quiz free-text sans options", () => {
    expect(() =>
      assertValidFormationConfig({
        ...baseConfig,
        quiz: {
          id: "q1",
          questions: [
            {
              id: "q-libre",
              question: { fr: "Votre defi ?", en: "Your challenge?" },
              kind: "free-text",
              profileField: "challenge",
            },
          ],
        },
      }),
    ).not.toThrow();
  });
});
