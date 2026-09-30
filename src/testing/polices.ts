const POLICES_DE_L_APPLICATION: readonly (readonly [police: string, texte?: string])[] = [
  ['400 1rem "Hanken Grotesk"'],
  ['700 1rem "Hanken Grotesk"'],
  ['400 1rem "Instrument Serif"'],
  ['400 1rem "Indices Serif"', 'uₙ₊₁ qⁿ'],
  ['400 1rem "Geist Mono"'],
];

export async function chargerLesPolicesDeLApplication(): Promise<readonly string[]> {
  const chargees = await Promise.all(
    POLICES_DE_L_APPLICATION.map(([police, texte]) => document.fonts.load(police, texte)),
  );
  await document.fonts.ready;
  return [...new Set(chargees.flat().map((police) => police.family.replace(/"/g, '')))].sort(
    (a, b) => a.localeCompare(b),
  );
}
