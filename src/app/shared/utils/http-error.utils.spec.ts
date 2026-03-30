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
});
