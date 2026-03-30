import {
  buildSectionBadges,
  extractRecord,
  extractString,
  extractStringArray,
  formatPhaseLabel,
  formatProgressStep,
  formatSectionLabel,
  formatSubTaskLabel,
  formatSummaryText,
  formatTaskLabel,
  sectionBadgeClass,
} from "./growth-audit-format.utils";

describe("growth-audit-format.utils", () => {
  describe("formatPhaseLabel", () => {
    it("devrait retourner une chaine vide pour une entree vide", () => {
      expect(formatPhaseLabel("")).toBe("");
    });

    it("devrait traduire technical_pages", () => {
      expect(formatPhaseLabel("technical_pages")).toBe(
        "Scan technique des pages",
      );
    });

    it("devrait traduire page_ai_recaps", () => {
      expect(formatPhaseLabel("page_ai_recaps")).toBe(
        "Micro-audits IA page par page",
      );
    });

    it("devrait traduire synthesis", () => {
      expect(formatPhaseLabel("synthesis")).toBe("Synthèse finale IA");
    });

    it("devrait remplacer les underscores pour une valeur inconnue", () => {
      expect(formatPhaseLabel("some_unknown_phase")).toBe("some unknown phase");
    });
  });

  describe("formatTaskLabel", () => {
    it("devrait retourner une chaine vide pour une entree vide", () => {
      expect(formatTaskLabel("")).toBe("");
    });

    it("devrait traduire technical_scan", () => {
      expect(formatTaskLabel("technical_scan")).toBe("Scan technique");
    });

    it("devrait traduire page_ai_recap", () => {
      expect(formatTaskLabel("page_ai_recap")).toBe("Analyse IA de page");
    });
  });

  describe("formatSubTaskLabel", () => {
    it("devrait retourner une chaine vide pour une entree vide", () => {
      expect(formatSubTaskLabel("")).toBe("");
    });

    it("devrait remplacer les underscores", () => {
      expect(formatSubTaskLabel("parse_html")).toBe("parse html");
    });
  });

  describe("formatSectionLabel", () => {
    it("devrait traduire summary", () => {
      expect(formatSectionLabel("summary")).toBe("Résumé");
    });

    it("devrait traduire executiveSection", () => {
      expect(formatSectionLabel("executiveSection")).toBe("Executive");
    });

    it("devrait retourner la cle brute pour une section inconnue", () => {
      expect(formatSectionLabel("unknownSection")).toBe("unknownSection");
    });
  });

  describe("sectionBadgeClass", () => {
    it("devrait retourner les classes pour completed", () => {
      expect(sectionBadgeClass("completed")).toContain("bg-emerald-100");
    });

    it("devrait retourner les classes pour failed", () => {
      expect(sectionBadgeClass("failed")).toContain("bg-red-100");
    });

    it("devrait retourner les classes par defaut", () => {
      expect(sectionBadgeClass("other")).toContain("bg-slate-100");
    });
  });

  describe("extractRecord", () => {
    it("devrait retourner null pour une valeur non-objet", () => {
      expect(extractRecord(null)).toBeNull();
      expect(extractRecord(undefined)).toBeNull();
      expect(extractRecord("text")).toBeNull();
      expect(extractRecord([1, 2])).toBeNull();
    });

    it("devrait retourner le record pour un objet valide", () => {
      const obj = { key: "value" };
      expect(extractRecord(obj)).toEqual({ key: "value" });
    });
  });

  describe("extractString", () => {
    it("devrait retourner une chaine vide pour une valeur non-string", () => {
      expect(extractString(null)).toBe("");
      expect(extractString(42)).toBe("");
    });

    it("devrait trim la chaine", () => {
      expect(extractString("  hello  ")).toBe("hello");
    });
  });

  describe("extractStringArray", () => {
    it("devrait retourner un tableau vide pour une valeur non-array", () => {
      expect(extractStringArray(null)).toEqual([]);
      expect(extractStringArray("text")).toEqual([]);
    });

    it("devrait filtrer les chaines vides", () => {
      expect(extractStringArray(["a", "", "  ", "b"])).toEqual(["a", "b"]);
    });
  });

  describe("buildSectionBadges", () => {
    it("devrait exclure les sections pending", () => {
      const result = buildSectionBadges({ summary: "pending" });
      expect(result.length).toBe(0);
    });

    it("devrait inclure les sections non-pending", () => {
      const result = buildSectionBadges({
        summary: "completed",
        executiveSection: "started",
      });
      expect(result.length).toBe(2);
      expect(result[0].key).toBe("summary");
      expect(result[0].status).toBe("completed");
      expect(result[1].key).toBe("executiveSection");
    });
  });

  describe("formatProgressStep", () => {
    it("devrait retourner le step tel quel si deja avec compteur", () => {
      expect(formatProgressStep({ step: "Scan (3/10)" })).toBe("Scan (3/10)");
    });

    it("devrait ajouter le compteur depuis details", () => {
      expect(
        formatProgressStep({
          step: "Scan",
          details: { done: 3, total: 10 },
        }),
      ).toBe("Scan (3/10)");
    });

    it("devrait retourner le step sans compteur si pas de details", () => {
      expect(formatProgressStep({ step: "Scan" })).toBe("Scan");
    });

    it("devrait utiliser le fallback si pas de step", () => {
      expect(formatProgressStep({})).toBe("Audit en cours...");
    });
  });

  describe("formatSummaryText", () => {
    it("devrait retourner une chaine vide pour null", () => {
      expect(formatSummaryText(null)).toBe("");
      expect(formatSummaryText(undefined)).toBe("");
    });

    it("devrait supprimer le markdown bold", () => {
      expect(formatSummaryText("**Titre** texte")).toBe("Titre texte");
    });

    it("devrait structurer les sections avec des sauts de ligne", () => {
      const input = "Introduction Contexte : details ici";
      const result = formatSummaryText(input);
      expect(result).toContain("Contexte :");
    });
  });
});
