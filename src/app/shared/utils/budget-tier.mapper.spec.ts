import {
  quizValueToBudgetTier,
  selfRatingToBudgetTier,
} from "./budget-tier.mapper";

describe("budget-tier.mapper", () => {
  describe("selfRatingToBudgetTier", () => {
    it("mappe 1 et 2 vers '0' (tier gratuit)", () => {
      expect(selfRatingToBudgetTier(1)).toBe("0");
      expect(selfRatingToBudgetTier(2)).toBe("0");
    });

    it("mappe 3 vers '60' (tier moyen)", () => {
      expect(selfRatingToBudgetTier(3)).toBe("60");
    });

    it("mappe 4 et 5 vers '120' (tier premium)", () => {
      expect(selfRatingToBudgetTier(4)).toBe("120");
      expect(selfRatingToBudgetTier(5)).toBe("120");
    });
  });

  describe("quizValueToBudgetTier", () => {
    it("mappe 'zero' et 'small' vers '0'", () => {
      expect(quizValueToBudgetTier("zero")).toBe("0");
      expect(quizValueToBudgetTier("small")).toBe("0");
    });

    it("mappe 'medium' vers '60'", () => {
      expect(quizValueToBudgetTier("medium")).toBe("60");
    });

    it("mappe 'large' vers '120'", () => {
      expect(quizValueToBudgetTier("large")).toBe("120");
    });

    it("fallback sur '120' pour toute autre valeur (premium par defaut)", () => {
      expect(quizValueToBudgetTier("unknown")).toBe("120");
    });
  });
});
