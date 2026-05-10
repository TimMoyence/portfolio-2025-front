import { normalizeText } from "./text.utils";

describe("normalizeText", () => {
  it("devrait supprimer les accents et diacritiques", () => {
    expect(normalizeText("éàü")).toBe("eau");
    expect(normalizeText("Crème brûlée")).toBe("creme brulee");
    expect(normalizeText("François")).toBe("francois");
  });

  it("devrait mettre en minuscules", () => {
    expect(normalizeText("HELLO")).toBe("hello");
    expect(normalizeText("Hello World")).toBe("hello world");
  });

  it("devrait retourner une chaine vide pour une entree vide", () => {
    expect(normalizeText("")).toBe("");
  });

  it("devrait conserver les caracteres non accentues", () => {
    expect(normalizeText("abc 123 !@#")).toBe("abc 123 !@#");
  });
});
