import { extractErrorMessage } from "./http-error.utils";

describe("extractErrorMessage", () => {
  it("devrait extraire un message string depuis error.error.message", () => {
    const error = { error: { message: "Email deja utilise" } };
    expect(extractErrorMessage(error)).toBe("Email deja utilise");
  });

  it("devrait joindre un tableau de messages", () => {
    const error = {
      error: { message: ["Champ requis", "Email invalide"] },
    };
    expect(extractErrorMessage(error)).toBe("Champ requis Email invalide");
  });

  it("devrait fallback sur error.message", () => {
    const error = { message: "Http failure response" };
    expect(extractErrorMessage(error)).toBe("Http failure response");
  });

  it("devrait retourner undefined si pas de message", () => {
    expect(extractErrorMessage({})).toBeUndefined();
    expect(extractErrorMessage(null)).toBeUndefined();
    expect(extractErrorMessage(undefined)).toBeUndefined();
    expect(extractErrorMessage(42)).toBeUndefined();
  });

  it("devrait preferer error.error.message a error.message", () => {
    const error = {
      error: { message: "Message API" },
      message: "Message HTTP",
    };
    expect(extractErrorMessage(error)).toBe("Message API");
  });

  describe("support du champ error.error.detail", () => {
    it("devrait extraire error.error.detail (string)", () => {
      const error = { error: { detail: "Lien expire" } };
      expect(extractErrorMessage(error)).toBe("Lien expire");
    });

    it("devrait preferer detail a message quand les deux sont presents", () => {
      const error = { error: { detail: "D", message: "M" } };
      expect(extractErrorMessage(error)).toBe("D");
    });

    it("devrait ignorer un detail non-string et retomber sur message", () => {
      const error = { error: { detail: 123, message: "M" } };
      expect(extractErrorMessage(error)).toBe("M");
    });

    it("devrait retourner undefined si detail non-string et aucun autre message (flag false)", () => {
      const error = { error: { detail: 123 } };
      expect(
        extractErrorMessage(error, { includeTopLevelMessage: false }),
      ).toBeUndefined();
    });
  });

  describe("option includeTopLevelMessage", () => {
    it("devrait, par defaut (true), retomber sur error.message top-level", () => {
      const error = { message: "Http failure response" };
      expect(extractErrorMessage(error)).toBe("Http failure response");
    });

    it("ne devrait PAS retomber sur error.message quand false", () => {
      const error = { message: "Http failure response" };
      expect(
        extractErrorMessage(error, { includeTopLevelMessage: false }),
      ).toBeUndefined();
    });

    it("devrait quand meme retourner error.error.message quand false", () => {
      const error = { error: { message: "Email pris" } };
      expect(
        extractErrorMessage(error, { includeTopLevelMessage: false }),
      ).toBe("Email pris");
    });

    it("devrait quand meme retourner error.error.detail quand false", () => {
      const error = { error: { detail: "Lien expire" } };
      expect(
        extractErrorMessage(error, { includeTopLevelMessage: false }),
      ).toBe("Lien expire");
    });

    it("devrait joindre un tableau error.error.message meme quand false", () => {
      const error = { error: { message: ["a", "b"] } };
      expect(
        extractErrorMessage(error, { includeTopLevelMessage: false }),
      ).toBe("a b");
    });

    it("devrait retourner undefined pour {} avec flag false", () => {
      expect(
        extractErrorMessage({}, { includeTopLevelMessage: false }),
      ).toBeUndefined();
    });
  });
});
