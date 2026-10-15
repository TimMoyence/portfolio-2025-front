const POLICES_DE_L_APPLICATION: readonly (readonly [police: string, texte?: string])[] = [
  ['400 1rem "Hanken Grotesk"'],
  ['700 1rem "Hanken Grotesk"'],
  ['400 1rem "Instrument Serif"'],
  ['400 1rem "Indices Serif"', 'uₙ₊₁ qⁿ'],
  ['400 1rem "Geist Mono"'],
];

export function compterLesAbonnesAuxPolices(): () => number {
  const polices = document.fonts;
  const ajouter = polices.addEventListener.bind(polices);
  const retirer = polices.removeEventListener.bind(polices);
  const abonnes: (readonly [string, EventListenerOrEventListenerObject])[] = [];
  const rang = (type: string, ecouteur: EventListenerOrEventListenerObject): number =>
    abonnes.findIndex(([typeAbonne, abonne]) => typeAbonne === type && abonne === ecouteur);
  spyOn(polices, 'addEventListener').and.callFake(
    (type: string, ecouteur: EventListenerOrEventListenerObject) => {
      if (rang(type, ecouteur) < 0) {
        abonnes.push([type, ecouteur]);
      }
      ajouter(type, ecouteur);
    },
  );
  spyOn(polices, 'removeEventListener').and.callFake(
    (type: string, ecouteur: EventListenerOrEventListenerObject) => {
      const trouve = rang(type, ecouteur);
      if (trouve >= 0) {
        abonnes.splice(trouve, 1);
      }
      retirer(type, ecouteur);
    },
  );
  return () => abonnes.length;
}

export async function chargerLesPolicesDeLApplication(): Promise<readonly string[]> {
  const chargees = await Promise.all(
    POLICES_DE_L_APPLICATION.map(([police, texte]) => document.fonts.load(police, texte)),
  );
  await document.fonts.ready;
  return [...new Set(chargees.flat().map((police) => police.family.replace(/"/g, '')))].sort(
    (a, b) => a.localeCompare(b),
  );
}
