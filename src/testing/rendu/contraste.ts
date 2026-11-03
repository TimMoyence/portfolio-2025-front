type Canaux = readonly [number, number, number, number];

const OPAQUE = 1;

function canauxDe(couleur: string): Canaux {
  const valeurs = /rgba?\(([^)]+)\)/
    .exec(couleur)?.[1]
    .split(/[\s,/]+/)
    .filter(Boolean);
  if (valeurs === undefined || valeurs.length < 3) {
    throw new Error(`Couleur illisible : « ${couleur} »`);
  }
  const [rouge, vert, bleu, alpha] = valeurs.map(Number);
  return [rouge, vert, bleu, alpha ?? OPAQUE];
}

function superposer(dessus: Canaux, dessous: Canaux): Canaux {
  const alpha = dessus[3];
  return [
    dessus[0] * alpha + dessous[0] * (1 - alpha),
    dessus[1] * alpha + dessous[1] * (1 - alpha),
    dessus[2] * alpha + dessous[2] * (1 - alpha),
    OPAQUE,
  ];
}

function lineaire(canal: number): number {
  const s = canal / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance([rouge, vert, bleu]: Canaux): number {
  return 0.2126 * lineaire(rouge) + 0.7152 * lineaire(vert) + 0.0722 * lineaire(bleu);
}

export function rapportDeContraste(avant: string, arriere: string): number {
  const fond = canauxDe(arriere);
  const [claire, sombre] = [luminance(superposer(canauxDe(avant), fond)), luminance(fond)].sort(
    (a, b) => b - a,
  );
  return (claire + 0.05) / (sombre + 0.05);
}

export function fondEffectif(element: Element): string {
  for (let courant: Element | null = element; courant !== null; courant = courant.parentElement) {
    const fond = getComputedStyle(courant).backgroundColor;
    if (canauxDe(fond)[3] > 0) {
      return fond;
    }
  }
  return 'rgb(255, 255, 255)';
}
