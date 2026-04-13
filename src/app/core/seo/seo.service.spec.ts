import { DOCUMENT } from "@angular/common";
import { LOCALE_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Meta, Title } from "@angular/platform-browser";
import type { SeoConfig } from "./seo.interface";
import { SeoService } from "./seo.service";

describe("SeoService", () => {
  let service: SeoService;
  let metaSpy: jasmine.SpyObj<Meta>;
  let titleSpy: jasmine.SpyObj<Title>;

  /**
   * Cree un document minimal compatible SSR (sans navigateur reel).
   * Simule head, querySelector, querySelectorAll, et createElement.
   */
  function createMockDocument(): Document {
    const appendedChildren: Record<string, unknown>[] = [];

    const head = {
      appendChild: jasmine
        .createSpy("appendChild")
        .and.callFake((el: Record<string, unknown>) =>
          appendedChildren.push(el),
        ),
      querySelector: jasmine
        .createSpy("head.querySelector")
        .and.callFake((selector: string) => {
          if (selector === 'script[type="application/ld+json"]') {
            return (
              appendedChildren.find(
                (el) => el["type"] === "application/ld+json",
              ) ?? null
            );
          }
          return null;
        }),
      querySelectorAll: jasmine
        .createSpy("head.querySelectorAll")
        .and.callFake((selector: string) => {
          if (selector === 'script[type="application/ld+json"]') {
            return appendedChildren.filter(
              (el) => el["type"] === "application/ld+json",
            );
          }
          return [];
        }),
      /** Expose les enfants ajoutes au head pour les assertions dans les tests. */
      get children(): Record<string, unknown>[] {
        return appendedChildren;
      },
    };

    const mockDoc = {
      head,
      createElement: jasmine
        .createSpy("createElement")
        .and.callFake((tag: string) => {
          const attrs: Record<string, string> = {};
          const el: Record<string, unknown> = {
            tagName: tag.toUpperCase(),
            setAttribute: (key: string, value: string) => {
              attrs[key] = value;
            },
            getAttribute: (key: string) => attrs[key] ?? null,
            attrs,
            type: "",
            textContent: "",
            remove: jasmine.createSpy("remove").and.callFake(() => {
              const idx = appendedChildren.indexOf(el);
              if (idx !== -1) appendedChildren.splice(idx, 1);
            }),
          };
          return el;
        }),
      querySelector: jasmine.createSpy("querySelector").and.returnValue(null),
      querySelectorAll: jasmine
        .createSpy("querySelectorAll")
        .and.returnValue([]),
    };

    return mockDoc as unknown as Document;
  }

  describe("avec un document valide", () => {
    let mockDocument: Document;

    beforeEach(() => {
      metaSpy = jasmine.createSpyObj<Meta>("Meta", ["updateTag"]);
      titleSpy = jasmine.createSpyObj<Title>("Title", ["setTitle"]);
      mockDocument = createMockDocument();

      TestBed.configureTestingModule({
        providers: [
          SeoService,
          { provide: Meta, useValue: metaSpy },
          { provide: Title, useValue: titleSpy },
          { provide: DOCUMENT, useValue: mockDocument },
          { provide: LOCALE_ID, useValue: "fr" },
        ],
      });

      service = TestBed.inject(SeoService);
    });

    it("devrait se creer", () => {
      expect(service).toBeTruthy();
    });

    describe("updateSeoMetadata - cas nominal", () => {
      const fullConfig: SeoConfig = {
        title: "Titre de test",
        description: "Description de test pour le SEO",
        keywords: ["angular", "seo", "test"],
        ogTitle: "OG Titre",
        ogDescription: "OG Description",
        ogImage: "/assets/images/og.webp",
        ogUrl: "https://example.com/page",
        twitterCard: "summary_large_image",
        twitterTitle: "Twitter Titre",
        twitterDescription: "Twitter Description",
        twitterImage: "/assets/images/twitter.webp",
        robots: "index, follow",
        canonicalUrl: "https://example.com/page",
        hreflangs: {
          fr: "https://example.com/fr/page",
          en: "https://example.com/en/page",
        },
      };

      beforeEach(() => {
        service.updateSeoMetadata(fullConfig);
      });

      it("devrait mettre a jour le titre de la page", () => {
        expect(titleSpy.setTitle).toHaveBeenCalledWith("Titre de test");
      });

      it("devrait mettre a jour la meta description", () => {
        expect(metaSpy.updateTag).toHaveBeenCalledWith({
          name: "description",
          content: "Description de test pour le SEO",
        });
      });

      it("devrait mettre a jour les keywords", () => {
        expect(metaSpy.updateTag).toHaveBeenCalledWith({
          name: "keywords",
          content: "angular, seo, test",
        });
      });

      it("devrait mettre a jour les Open Graph tags", () => {
        expect(metaSpy.updateTag).toHaveBeenCalledWith({
          property: "og:title",
          content: "OG Titre",
        });
        expect(metaSpy.updateTag).toHaveBeenCalledWith({
          property: "og:description",
          content: "OG Description",
        });
        expect(metaSpy.updateTag).toHaveBeenCalledWith({
          property: "og:image",
          content: "/assets/images/og.webp",
        });
        expect(metaSpy.updateTag).toHaveBeenCalledWith({
          property: "og:url",
          content: "https://example.com/page",
        });
        expect(metaSpy.updateTag).toHaveBeenCalledWith({
          property: "og:type",
          content: "website",
        });
      });

      it("devrait mettre a jour les Twitter Card tags", () => {
        expect(metaSpy.updateTag).toHaveBeenCalledWith({
          name: "twitter:card",
          content: "summary_large_image",
        });
        expect(metaSpy.updateTag).toHaveBeenCalledWith({
          name: "twitter:title",
          content: "Twitter Titre",
        });
        expect(metaSpy.updateTag).toHaveBeenCalledWith({
          name: "twitter:description",
          content: "Twitter Description",
        });
        expect(metaSpy.updateTag).toHaveBeenCalledWith({
          name: "twitter:image",
          content: "/assets/images/twitter.webp",
        });
      });

      it("devrait mettre a jour la meta robots", () => {
        expect(metaSpy.updateTag).toHaveBeenCalledWith({
          name: "robots",
          content: "index, follow",
        });
      });

      it("devrait creer un lien canonical", () => {
        expect(mockDocument.createElement).toHaveBeenCalledWith("link");
        expect(
          (mockDocument.head as unknown as { appendChild: jasmine.Spy })
            .appendChild,
        ).toHaveBeenCalled();
      });

      it("devrait creer les liens hreflang pour chaque locale", () => {
        // On filtre par type de tag pour ignorer les <meta og:locale:alternate>
        // crees systematiquement par updateSeoMetadata (une par locale alternative).
        const createSpy = mockDocument.createElement as jasmine.Spy;
        const linkCalls = createSpy.calls
          .allArgs()
          .filter((args) => args[0] === "link");
        // 1 canonical + 2 hreflangs = 3 appels createElement("link")
        expect(linkCalls.length).toBe(3);
      });
    });

    describe("updateSeoMetadata - config minimale (fallbacks)", () => {
      const minimalConfig: SeoConfig = {
        title: "Titre minimal",
        description: "Description minimale",
      };

      beforeEach(() => {
        service.updateSeoMetadata(minimalConfig);
      });

      it("devrait utiliser le titre comme fallback pour og:title", () => {
        expect(metaSpy.updateTag).toHaveBeenCalledWith({
          property: "og:title",
          content: "Titre minimal",
        });
      });

      it("devrait utiliser la description comme fallback pour og:description", () => {
        expect(metaSpy.updateTag).toHaveBeenCalledWith({
          property: "og:description",
          content: "Description minimale",
        });
      });

      it("devrait utiliser 'summary' comme valeur par defaut pour twitter:card", () => {
        expect(metaSpy.updateTag).toHaveBeenCalledWith({
          name: "twitter:card",
          content: "summary",
        });
      });

      it("devrait utiliser le titre comme fallback pour twitter:title", () => {
        expect(metaSpy.updateTag).toHaveBeenCalledWith({
          name: "twitter:title",
          content: "Titre minimal",
        });
      });

      it("devrait utiliser la description comme fallback pour twitter:description", () => {
        expect(metaSpy.updateTag).toHaveBeenCalledWith({
          name: "twitter:description",
          content: "Description minimale",
        });
      });

      it("ne devrait pas mettre a jour les keywords si absent", () => {
        expect(metaSpy.updateTag).not.toHaveBeenCalledWith(
          jasmine.objectContaining({ name: "keywords" }),
        );
      });

      it("ne devrait pas mettre a jour og:image si absent", () => {
        expect(metaSpy.updateTag).not.toHaveBeenCalledWith(
          jasmine.objectContaining({ property: "og:image" }),
        );
      });

      it("ne devrait pas mettre a jour og:url si absent", () => {
        expect(metaSpy.updateTag).not.toHaveBeenCalledWith(
          jasmine.objectContaining({ property: "og:url" }),
        );
      });

      it("ne devrait pas mettre a jour twitter:image si absent", () => {
        expect(metaSpy.updateTag).not.toHaveBeenCalledWith(
          jasmine.objectContaining({ name: "twitter:image" }),
        );
      });

      it("ne devrait pas mettre a jour robots si absent", () => {
        expect(metaSpy.updateTag).not.toHaveBeenCalledWith(
          jasmine.objectContaining({ name: "robots" }),
        );
      });

      it("ne devrait pas creer de lien canonical si absent", () => {
        // createElement peut etre appele pour <meta og:locale:alternate>,
        // mais jamais pour <link> si aucun canonicalUrl n'est fourni.
        expect(mockDocument.createElement).not.toHaveBeenCalledWith("link");
      });

      it("ne devrait pas creer de liens hreflang si absent", () => {
        // Les hreflangs sont des <link>, distincts des <meta og:locale:alternate>.
        expect(mockDocument.createElement).not.toHaveBeenCalledWith("link");
      });
    });

    describe("updateSeoMetadata - keywords vide", () => {
      it("ne devrait pas mettre a jour les keywords si le tableau est vide", () => {
        service.updateSeoMetadata({
          title: "Test",
          description: "Desc",
          keywords: [],
        });

        expect(metaSpy.updateTag).not.toHaveBeenCalledWith(
          jasmine.objectContaining({ name: "keywords" }),
        );
      });
    });

    describe("updateSeoMetadata - suppression de canonical existant", () => {
      it("devrait supprimer le canonical existant avant d'en creer un nouveau", () => {
        const existingLink = { remove: jasmine.createSpy("remove") };
        (mockDocument.querySelector as jasmine.Spy).and.returnValue(
          existingLink,
        );

        service.updateSeoMetadata({
          title: "Test",
          description: "Desc",
          canonicalUrl: "https://example.com/new",
        });

        expect(existingLink.remove).toHaveBeenCalled();
      });
    });

    describe("updateSeoMetadata - suppression de hreflangs existants", () => {
      it("devrait supprimer les hreflangs existants avant d'en creer de nouveaux", () => {
        const existingNode1 = { remove: jasmine.createSpy("remove1") };
        const existingNode2 = { remove: jasmine.createSpy("remove2") };
        (mockDocument.querySelectorAll as jasmine.Spy).and.returnValue([
          existingNode1,
          existingNode2,
        ]);

        service.updateSeoMetadata({
          title: "Test",
          description: "Desc",
          hreflangs: { fr: "https://example.com/fr" },
        });

        expect(existingNode1.remove).toHaveBeenCalled();
        expect(existingNode2.remove).toHaveBeenCalled();
      });
    });

    describe("JSON-LD", () => {
      it("devrait injecter un script JSON-LD dans le head quand jsonLd est fourni", () => {
        const jsonLdData = {
          "@context": "https://schema.org",
          "@type": "Person",
          name: "Tim",
        };

        service.updateSeoMetadata({
          title: "Test",
          description: "Desc",
          jsonLd: jsonLdData,
        });

        const appendSpy = (
          mockDocument.head as unknown as { appendChild: jasmine.Spy }
        ).appendChild;
        const appendedArgs = appendSpy.calls
          .allArgs()
          .map((args: unknown[]) => args[0] as Record<string, unknown>);
        const scriptEl = appendedArgs.find(
          (el) => el["type"] === "application/ld+json",
        );

        expect(scriptEl).toBeTruthy();
        expect(scriptEl!["textContent"]).toBe(JSON.stringify(jsonLdData));
      });

      it("ne devrait pas injecter de script JSON-LD si jsonLd est absent", () => {
        service.updateSeoMetadata({
          title: "Test",
          description: "Desc",
        });

        const appendSpy = (
          mockDocument.head as unknown as { appendChild: jasmine.Spy }
        ).appendChild;
        const appendedArgs = appendSpy.calls
          .allArgs()
          .map((args: unknown[]) => args[0] as Record<string, unknown>);
        const scriptEl = appendedArgs.find(
          (el) => el["type"] === "application/ld+json",
        );

        expect(scriptEl).toBeUndefined();
      });

      it("devrait injecter un tableau de JSON-LD comme scripts separes", () => {
        const jsonLdArray = [
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Test",
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [],
          },
        ];

        service.updateSeoMetadata({
          title: "Test",
          description: "Desc",
          jsonLd: jsonLdArray,
        });

        const scripts = (
          mockDocument.head as unknown as {
            querySelectorAll: (s: string) => Record<string, unknown>[];
          }
        ).querySelectorAll('script[type="application/ld+json"]');
        expect(scripts.length).toBe(2);
        expect(JSON.parse(scripts[0]["textContent"] as string)).toEqual(
          jsonLdArray[0],
        );
        expect(JSON.parse(scripts[1]["textContent"] as string)).toEqual(
          jsonLdArray[1],
        );
      });

      it("devrait supprimer les anciens JSON-LD avant injection", () => {
        service.updateSeoMetadata({
          title: "T1",
          description: "D1",
          jsonLd: { "@type": "WebSite" },
        });

        service.updateSeoMetadata({
          title: "T2",
          description: "D2",
          jsonLd: [{ "@type": "FAQPage" }],
        });

        const scripts = (
          mockDocument.head as unknown as {
            querySelectorAll: (s: string) => Record<string, unknown>[];
          }
        ).querySelectorAll('script[type="application/ld+json"]');
        expect(scripts.length).toBe(1);
        expect(JSON.parse(scripts[0]["textContent"] as string)["@type"]).toBe(
          "FAQPage",
        );
      });

      it("devrait supprimer le script JSON-LD existant avant d en creer un nouveau", () => {
        const jsonLdA = {
          "@context": "https://schema.org",
          "@type": "Person",
          name: "A",
        };
        const jsonLdB = {
          "@context": "https://schema.org",
          "@type": "Person",
          name: "B",
        };

        service.updateSeoMetadata({
          title: "Test",
          description: "Desc",
          jsonLd: jsonLdA,
        });

        service.updateSeoMetadata({
          title: "Test",
          description: "Desc",
          jsonLd: jsonLdB,
        });

        const headChildren = (
          mockDocument.head as unknown as {
            children: Record<string, unknown>[];
          }
        ).children;
        const jsonLdScripts = headChildren.filter(
          (el) => el["type"] === "application/ld+json",
        );

        expect(jsonLdScripts.length).toBe(1);
        expect(jsonLdScripts[0]["textContent"]).toBe(JSON.stringify(jsonLdB));
      });
    });
  });

  describe("avec document null (SSR sans DOM)", () => {
    it("ne devrait rien faire si document est null", () => {
      const localMetaSpy = jasmine.createSpyObj<Meta>("Meta", ["updateTag"]);
      const localTitleSpy = jasmine.createSpyObj<Title>("Title", ["setTitle"]);

      // Instanciation manuelle pour eviter que TestBed n'utilise le DOCUMENT null
      const svc = new SeoService(
        localMetaSpy,
        localTitleSpy,
        null as unknown as Document,
        "fr",
      );

      svc.updateSeoMetadata({
        title: "Titre",
        description: "Description",
      });

      expect(localTitleSpy.setTitle).not.toHaveBeenCalled();
      expect(localMetaSpy.updateTag).not.toHaveBeenCalled();
    });

    it("ne devrait pas throw si jsonLd est fourni avec document null", () => {
      const localMetaSpy = jasmine.createSpyObj<Meta>("Meta", ["updateTag"]);
      const localTitleSpy = jasmine.createSpyObj<Title>("Title", ["setTitle"]);

      const svc = new SeoService(
        localMetaSpy,
        localTitleSpy,
        null as unknown as Document,
        "fr",
      );

      expect(() =>
        svc.updateSeoMetadata({
          title: "Titre",
          description: "Description",
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Tim",
          },
        }),
      ).not.toThrow();
    });
  });
});
