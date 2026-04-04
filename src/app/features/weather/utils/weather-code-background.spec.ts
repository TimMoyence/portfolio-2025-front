import { weatherCodeToBackground } from "./weather-code-background";

describe("weatherCodeToBackground", () => {
  it("devrait retourner le gradient nuit pour isNight=true", () => {
    const result = weatherCodeToBackground(0, true);
    expect(result).toContain("gray-900");
    expect(result).toContain("blue-950");
  });

  it("devrait retourner le gradient ciel degage pour code 0", () => {
    const result = weatherCodeToBackground(0);
    expect(result).toContain("sky-400");
  });

  it("devrait retourner le gradient partiellement nuageux pour code 1", () => {
    const result = weatherCodeToBackground(1);
    expect(result).toContain("sky-300");
  });

  it("devrait retourner le gradient partiellement nuageux pour code 2", () => {
    const result = weatherCodeToBackground(2);
    expect(result).toContain("sky-300");
  });

  it("devrait retourner le gradient couvert pour code 3", () => {
    const result = weatherCodeToBackground(3);
    expect(result).toContain("gray-400");
  });

  it("devrait retourner le gradient brouillard pour code 45", () => {
    const result = weatherCodeToBackground(45);
    expect(result).toContain("gray-300");
  });

  it("devrait retourner le gradient brouillard pour code 48", () => {
    const result = weatherCodeToBackground(48);
    expect(result).toContain("gray-300");
  });

  it("devrait retourner le gradient pluie pour code 51 (bruine legere)", () => {
    const result = weatherCodeToBackground(51);
    expect(result).toContain("gray-500");
    expect(result).toContain("blue-600");
  });

  it("devrait retourner le gradient pluie pour code 67", () => {
    const result = weatherCodeToBackground(67);
    expect(result).toContain("gray-500");
  });

  it("devrait retourner le gradient neige pour code 71", () => {
    const result = weatherCodeToBackground(71);
    expect(result).toContain("gray-200");
  });

  it("devrait retourner le gradient neige pour code 77", () => {
    const result = weatherCodeToBackground(77);
    expect(result).toContain("gray-200");
  });

  it("devrait retourner le gradient averses pour code 80", () => {
    const result = weatherCodeToBackground(80);
    expect(result).toContain("gray-600");
    expect(result).toContain("blue-800");
  });

  it("devrait retourner le gradient averses pour code 86", () => {
    const result = weatherCodeToBackground(86);
    expect(result).toContain("gray-600");
  });

  it("devrait retourner le gradient orage pour code 95", () => {
    const result = weatherCodeToBackground(95);
    expect(result).toContain("gray-700");
    expect(result).toContain("purple-800");
  });

  it("devrait retourner le gradient orage pour code 99", () => {
    const result = weatherCodeToBackground(99);
    expect(result).toContain("purple-800");
  });

  it("devrait retourner le gradient fallback pour un code non couvert (10)", () => {
    const result = weatherCodeToBackground(10);
    expect(result).toContain("blue-900");
    expect(result).toContain("indigo-900");
  });

  it("devrait retourner le gradient fallback pour code 4", () => {
    const result = weatherCodeToBackground(4);
    expect(result).toContain("blue-900");
  });
});
