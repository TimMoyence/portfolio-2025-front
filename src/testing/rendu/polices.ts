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
  const chargees = await Promise.all([...document.fonts].map((face) => face.load()));
  await document.fonts.ready;
  return [...new Set(chargees.map((face) => face.family.replace(/"/g, '')))].sort((a, b) =>
    a.localeCompare(b),
  );
}
