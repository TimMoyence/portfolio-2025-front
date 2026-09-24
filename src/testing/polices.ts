const POLICES_DE_L_APPLICATION = [
  '400 1rem "Hanken Grotesk"',
  '700 1rem "Hanken Grotesk"',
  '400 1rem "Instrument Serif"',
  '400 1rem "Geist Mono"',
] as const;

export async function chargerLesPolicesDeLApplication(): Promise<readonly string[]> {
  const chargees = await Promise.all(
    POLICES_DE_L_APPLICATION.map((police) => document.fonts.load(police)),
  );
  await document.fonts.ready;
  return [...new Set(chargees.flat().map((police) => police.family.replace(/"/g, '')))].sort(
    (a, b) => a.localeCompare(b),
  );
}
