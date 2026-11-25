export interface EvenementDuPointeur {
  readonly type: string;
  readonly pointerType: string;
  readonly isPrimary: boolean;
  readonly button: number;
  readonly clientX: number;
  readonly clientY: number;
}

export interface EtatDuPointeur {
  readonly actif: boolean;
  readonly x: number;
  readonly y: number;
}

export interface Onde {
  readonly x: number;
  readonly y: number;
  age: number;
  readonly poussees: Set<number>;
}

interface Coordonnees {
  x: number;
  y: number;
}

export const POINTEUR_INACTIF: EtatDuPointeur = { actif: false, x: 0, y: 0 };

const RAYON_DE_L_ANNEAU = 60;
const PORTEE_AU_CARRE = 30000;
const RAIDEUR_DE_L_ANNEAU = 0.05;
const PORTEE_DE_L_ONDE = 420;
const VITESSE_DE_L_ONDE = 900;
const POUSSEE_DE_L_ONDE = 18;

const position = ({ clientX, clientY }: EvenementDuPointeur): EtatDuPointeur => ({
  actif: true,
  x: clientX,
  y: clientY,
});

export const suivreLePointeur = (
  etat: EtatDuPointeur,
  evenement: EvenementDuPointeur,
): EtatDuPointeur => {
  if (evenement.type === 'sortie') return POINTEUR_INACTIF;
  if (!evenement.type.startsWith('pointer') || !evenement.isPrimary) return etat;
  if (evenement.pointerType === 'mouse') return position(evenement);
  if (evenement.type === 'pointerdown') return position(evenement);
  if (evenement.type === 'pointerup' || evenement.type === 'pointercancel') {
    return POINTEUR_INACTIF;
  }
  return etat.actif ? position(evenement) : etat;
};

export const attirerVersLAnneau = (point: Coordonnees, pointeur: EtatDuPointeur): void => {
  const dx = point.x - pointeur.x;
  const dy = point.y - pointeur.y;
  const carre = dx * dx + dy * dy;
  if (!pointeur.actif || carre >= PORTEE_AU_CARRE || carre === 0) return;
  const distance = Math.sqrt(carre);
  const deplacement =
    (RAYON_DE_L_ANNEAU - distance) *
    RAIDEUR_DE_L_ANNEAU *
    ((PORTEE_AU_CARRE - carre) / PORTEE_AU_CARRE);
  point.x += (dx / distance) * deplacement;
  point.y += (dy / distance) * deplacement;
};

export const ondeDuPointeur = (evenement: EvenementDuPointeur): Onde | null =>
  evenement.type === 'pointerdown' && (evenement.pointerType !== 'mouse' || evenement.button === 0)
    ? { x: evenement.clientX, y: evenement.clientY, age: 0, poussees: new Set<number>() }
    : null;

const rayonDeLOnde = (onde: Onde): number =>
  Math.min(onde.age * VITESSE_DE_L_ONDE, PORTEE_DE_L_ONDE);

export const pousserParLOnde = (
  onde: Onde,
  points: readonly Coordonnees[],
  secondes: number,
): void => {
  onde.age += secondes;
  const front = rayonDeLOnde(onde);
  points.forEach((point, index) => {
    const dx = point.x - onde.x;
    const dy = point.y - onde.y;
    const distance = Math.hypot(dx, dy);
    if (onde.poussees.has(index) || distance > front || distance === 0) return;
    const poussee = POUSSEE_DE_L_ONDE * (1 - distance / (PORTEE_DE_L_ONDE * 1.2));
    point.x += (dx / distance) * poussee;
    point.y += (dy / distance) * poussee;
    onde.poussees.add(index);
  });
};
