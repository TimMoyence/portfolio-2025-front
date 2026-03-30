import { DOCUMENT } from "@angular/common";
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
    const appendedLinks: HTMLElement[] = [];

    const head = {
      appendChild: jasmine
        .createSpy("appendChild")
        .and.callFake((el: HTMLElement) => appendedLinks.push(el)),
    };

    const mockDoc = {
      head,
      createElement: jasmine.createSpy("createElement").and.callFake(() => {
        const attrs: Record<string, string> = {};
        return {
          setAttribute: (key: string, value: string) => {
            attrs[key] = value;
          },
          getAttribute: (key: string) => attrs[key] ?? null,
          attrs,
        };
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
        // 1 canonical + 2 hreflangs = 3 appels createElement
        expect(mockDocument.createElement).toHaveBeenCalledTimes(3);
        const appendSpy = (
          mockDocument.head as unknown as { appendChild: jasmine.Spy }
        ).appendChild;
        // 1 canonical + 2 hreflangs = 3 appels appendChild
        expect(appendSpy).toHaveBeenCalledTimes(3);
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
        expect(mockDocument.createElement).not.toHaveBeenCalled();
      });

      it("ne devrait pas creer de liens hreflang si absent", () => {
        const appendSpy = (
          mockDocument.head as unknown as { appendChild: jasmine.Spy }
        ).appendChild;
        expect(appendSpy).not.toHaveBeenCalled();
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
      );

      svc.updateSeoMetadata({
        title: "Titre",
        description: "Description",
      });

      expect(localTitleSpy.setTitle).not.toHaveBeenCalled();
      expect(localMetaSpy.updateTag).not.toHaveBeenCalled();
    });
  });
});
