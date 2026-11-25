import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  PLATFORM_ID,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import {
  REQUETE_MOUVEMENT_REDUIT,
  ecranASurvol,
} from '../../../../../cours/runtime/core/ecran/mouvement';
import {
  creerChamp,
  dureeDuFondu,
  estomper,
  pointsLibres,
  rapprocher,
  redimensionner,
  tenirLesFormes,
  type Champ,
  type Demande,
  type Point,
} from './champ';
import { figureDeLaPage, figureDeLaSection, sectionActive, sommetsDuCiel } from './ciel/ciel';
import { cielVide, dessinerLeCiel, suivreLeCiel, type Ciel, type Place } from './ciel/etoiles';
import { ANNEAU } from './ciel/figures';
import { estTenue, liensDesEtapes, sommetsDuContour, voile, type Boite } from './formes';
import {
  POINTEUR_INACTIF,
  attirerVersLAnneau,
  ondeDuPointeur,
  pousserParLOnde,
  suivreLePointeur,
  type EtatDuPointeur,
  type Onde,
} from './pointeur';
import { opaciteDuTrait, traitsParGrille, type Position } from './voisins';

interface DemandeDessinee extends Demande {
  readonly chaine: boolean;
}

interface Monde {
  readonly champ: Champ;
  readonly ciel: Ciel;
  pointeur: EtatDuPointeur;
  ondes: Onde[];
  temps: number;
}

interface Couleurs {
  readonly trait: string;
  readonly lueur: string;
}

const MARGE_DE_REBOUCLAGE = 20;
const DUREE_DE_L_ONDE = 0.8;
const OPACITE_D_UN_TRAIT_POUSSE = 0.43;
const BLOCS_DE_TEXTE =
  '.kicker, .cta-title, .cta-lead, .ai-method-title, .ai-method-lead, .ai-rule, .ai-step';
const CADENCE = 60;
const LENTEUR = 0.24;

const deriver = (point: Point, temps: number, images: number): void => {
  point.x += (point.vx + Math.sin(temps + point.phase) * 0.05) * images;
  point.y += (point.vy + Math.cos(temps * 0.8 + point.phase) * 0.05) * images;
};

const reboucler = (point: Point, largeur: number, hauteur: number): void => {
  if (point.x < -MARGE_DE_REBOUCLAGE) point.x = largeur + MARGE_DE_REBOUCLAGE;
  else if (point.x > largeur + MARGE_DE_REBOUCLAGE) point.x = -MARGE_DE_REBOUCLAGE;
  if (point.y < -MARGE_DE_REBOUCLAGE) point.y = hauteur + MARGE_DE_REBOUCLAGE;
  else if (point.y > hauteur + MARGE_DE_REBOUCLAGE) point.y = -MARGE_DE_REBOUCLAGE;
};

const sommetsTenus = (champ: Champ): Map<Point, Position> =>
  new Map(
    champ.formes.flatMap(({ points, sommets }) =>
      points.map((point, index): [Point, Position] => [point, sommets[index]]),
    ),
  );

const avancer = (
  monde: Monde,
  demandes: readonly Demande[],
  secondes: number,
  reduit: boolean,
): void => {
  const { champ } = monde;
  tenirLesFormes(champ, demandes);
  estomper(champ, dureeDuFondu(secondes, reduit));
  const tenus = sommetsTenus(champ);
  if (reduit) {
    tenus.forEach((sommet, point) => rapprocher(point, sommet, reduit));
    return;
  }
  monde.temps += secondes * LENTEUR;
  const images = secondes * CADENCE;
  for (const point of pointsLibres(champ)) {
    deriver(point, monde.temps, images);
    attirerVersLAnneau(point, monde.pointeur);
    reboucler(point, champ.largeur, champ.hauteur);
  }
  tenus.forEach((sommet, point) => {
    rapprocher(point, sommet, reduit);
    attirerVersLAnneau(point, monde.pointeur);
  });
  for (const onde of monde.ondes) pousserParLOnde(onde, champ.points, secondes);
  monde.ondes = monde.ondes.filter(({ age }) => age < DUREE_DE_L_ONDE);
};

const tracer = (
  contexte: CanvasRenderingContext2D,
  depart: Position,
  arrivee: Position,
  couleur: string,
  opacite: number,
): void => {
  contexte.globalAlpha = opacite;
  contexte.strokeStyle = couleur;
  contexte.beginPath();
  contexte.moveTo(depart.x, depart.y);
  contexte.lineTo(arrivee.x, arrivee.y);
  contexte.stroke();
};

const dessinerLesTraits = (
  contexte: CanvasRenderingContext2D,
  monde: Monde,
  points: readonly Point[],
  couleurs: Couleurs,
  voiles: readonly Boite[],
): void => {
  const positions: Position[] = monde.pointeur.actif ? [...points, monde.pointeur] : [...points];
  const pousses = new Set(
    monde.ondes.flatMap(({ poussees }) => [...poussees].map((index) => monde.champ.points[index])),
  );
  for (const { a, b, distance } of traitsParGrille(positions)) {
    const premier = points.at(a);
    const second = b < points.length ? points[b] : undefined;
    const pousse = (premier && pousses.has(premier)) || (second && pousses.has(second));
    const opacite =
      (pousse ? OPACITE_D_UN_TRAIT_POUSSE : opaciteDuTrait(distance)) *
      (premier?.opacite ?? 1) *
      (second?.opacite ?? 1) *
      voile(positions[a], positions[b], voiles);
    const lueur = premier?.lumineux || second?.lumineux;
    tracer(contexte, positions[a], positions[b], lueur ? couleurs.lueur : couleurs.trait, opacite);
  }
};

const dessinerLesFormes = (
  contexte: CanvasRenderingContext2D,
  monde: Monde,
  demandes: readonly DemandeDessinee[],
  couleurs: Couleurs,
): void => {
  for (const { cle, points, sommets } of monde.champ.formes) {
    const chaine = demandes.find((demande) => demande.cle === cle)?.chaine ?? false;
    if (chaine) {
      liensDesEtapes(sommets, monde.champ.hauteur).forEach((lien, index) => {
        contexte.setLineDash(lien === 'plein' ? [] : [3, 5]);
        tracer(
          contexte,
          points[index],
          points[index + 1],
          couleurs.trait,
          lien === 'plein' ? 0.6 : 0.4,
        );
      });
      contexte.setLineDash([]);
    } else {
      points.forEach((point, index) =>
        tracer(
          contexte,
          point,
          points[(index + 1) % points.length],
          couleurs.trait,
          0.45 * point.opacite,
        ),
      );
    }
  }
};

const dessinerLesPoints = (
  contexte: CanvasRenderingContext2D,
  monde: Monde,
  points: readonly Point[],
  couleurs: Couleurs,
  reduit: boolean,
): void => {
  for (const point of points) {
    const pulsation = reduit ? 1 : 0.7 + Math.sin(monde.temps * 2 + point.phase) * 0.3;
    contexte.globalAlpha = (point.lumineux ? 1 : 0.6) * point.opacite;
    contexte.fillStyle = point.lumineux ? couleurs.lueur : couleurs.trait;
    contexte.shadowColor = couleurs.lueur;
    contexte.shadowBlur = point.lumineux ? 12 : 0;
    contexte.beginPath();
    contexte.arc(point.x, point.y, point.rayon * pulsation, 0, Math.PI * 2);
    contexte.fill();
  }
  contexte.shadowBlur = 0;
  contexte.globalAlpha = 1;
};

const dessiner = (
  contexte: CanvasRenderingContext2D,
  monde: Monde,
  demandes: readonly DemandeDessinee[],
  couleurs: Couleurs,
  reduit: boolean,
  voiles: readonly Boite[],
): void => {
  const { champ } = monde;
  const points = [
    ...champ.points,
    ...champ.formes.flatMap((forme) => forme.points.filter(({ ne }) => ne)),
    ...champ.partants,
  ];
  contexte.save();
  contexte.setTransform(1, 0, 0, 1, 0, 0);
  contexte.clearRect(0, 0, contexte.canvas.width, contexte.canvas.height);
  contexte.restore();
  contexte.lineWidth = 1;
  dessinerLeCiel(contexte, monde.ciel, couleurs.trait, reduit, voiles);
  dessinerLesTraits(contexte, monde, points, couleurs, voiles);
  dessinerLesFormes(contexte, monde, demandes, couleurs);
  dessinerLesPoints(contexte, monde, points, couleurs, reduit);
};

const SECONDES_MAXIMALES = 0.05;

const hasard = (): number => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;

const centre = (element: Element): Position => {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { x: left + width / 2, y: top + height / 2 };
};

const densite = (): number => Math.min(devicePixelRatio || 1, 2);

const lireLesCouleurs = (): { readonly jour: Couleurs; readonly nuit: Couleurs } => {
  const styles = getComputedStyle(document.documentElement);
  const lueur = styles.getPropertyValue('--glow').trim() || '#5b8cff';
  return {
    jour: { trait: styles.getPropertyValue('--teal').trim() || '#4fb3a2', lueur },
    nuit: { trait: styles.getPropertyValue('--cream').trim() || '#fffaf2', lueur },
  };
};

const dessinerLesNuits = (
  monde: Monde,
  demandes: readonly DemandeDessinee[],
  nuit: Couleurs,
  reduit: boolean,
): void => {
  for (const couche of document.querySelectorAll<HTMLCanvasElement>('canvas.couche-de-nuit')) {
    const bande = couche.getBoundingClientRect();
    const contexte = couche.getContext('2d');
    if (!contexte || bande.width === 0 || bande.bottom <= 0 || bande.top >= innerHeight) continue;
    const echelle = densite();
    const largeur = Math.round(bande.width * echelle);
    const hauteur = Math.round(bande.height * echelle);
    if (couche.width !== largeur || couche.height !== hauteur) {
      couche.width = largeur;
      couche.height = hauteur;
    }
    contexte.setTransform(echelle, 0, 0, echelle, -bande.left * echelle, -bande.top * echelle);
    const voiles = [
      ...(couche.closest('.theme-night')?.querySelectorAll(BLOCS_DE_TEXTE) ?? []),
    ].map((bloc) => bloc.getBoundingClientRect());
    dessiner(contexte, monde, demandes, nuit, reduit, voiles);
  }
};

@Component({
  selector: 'app-constellation',
  standalone: true,
  template: `@if (navigateur) {
    <canvas #toile class="asili-field" aria-hidden="true"></canvas>
  }`,
  styles: `
    .asili-field {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: -2;
      pointer-events: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstellationComponent {
  protected readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly toile = viewChild<ElementRef<HTMLCanvasElement>>('toile');
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly cles = new WeakMap<Element, string>();
  private prochaineCle = 0;

  constructor() {
    afterNextRender(() => this.demarrer());
  }

  private cle(element: Element): string {
    const connue = this.cles.get(element);
    if (connue) return connue;
    const nouvelle = `forme-${this.prochaineCle++}`;
    this.cles.set(element, nouvelle);
    return nouvelle;
  }

  private lireLesFormes(reduit: boolean, largeur: number, hauteur: number): DemandeDessinee[] {
    const sections: DemandeDessinee[] = [];
    for (const hote of document.querySelectorAll('app-asili-method, app-asili-ai-method')) {
      const sommets = [...hote.querySelectorAll('.num, .ai-n')].map(centre);
      if (sommets.length > 1 && estTenue(sommets, largeur, hauteur)) {
        sections.push({ cle: this.cle(hote), sommets, chaine: true });
      }
    }
    const haut = ({ sommets }: Demande): number => Math.min(...sommets.map(({ y }) => y));
    sections.sort((premiere, seconde) => haut(premiere) - haut(seconde));
    const survolee = reduit ? null : document.querySelector('.proj:hover, .formation:hover');
    const carte =
      survolee && ecranASurvol()
        ? [
            {
              cle: this.cle(survolee),
              sommets: sommetsDuContour(survolee.getBoundingClientRect()),
              chaine: false,
            },
          ]
        : [];
    return [...carte, ...sections];
  }

  private lireLeCiel(
    largeur: number,
    hauteur: number,
  ): (Place & { readonly boite: Boite }) | undefined {
    const page = figureDeLaPage(this.router.url);
    const sections = [
      ...document.querySelectorAll('main router-outlet + * section:not(section section)'),
    ];
    const bande = sections.findIndex((section) => section.querySelector('.cta'));
    if (page === undefined || bande < 0) return undefined;
    const active = sectionActive(
      sections.map((section) => section.getBoundingClientRect().top),
      hauteur / 2,
    );
    const cta = active === bande ? sections[bande].querySelector('.cta') : null;
    return {
      figure: figureDeLaSection(page, active, bande),
      section: `${page}·${active}`,
      boite: cta?.getBoundingClientRect() ?? { left: 0, top: 0, width: largeur, height: hauteur },
    };
  }

  private demarrer(): void {
    const toile = this.toile()?.nativeElement;
    const contexte = toile?.getContext('2d');
    if (!toile || !contexte) return;
    const mouvement = matchMedia(REQUETE_MOUVEMENT_REDUIT);
    const couleurs = lireLesCouleurs();
    const monde: Monde = {
      champ: creerChamp(innerWidth, innerHeight, hasard),
      ciel: cielVide(),
      pointeur: POINTEUR_INACTIF,
      ondes: [],
      temps: 0,
    };
    let reduit = mouvement.matches;
    let boucle = 0;
    let precedent = 0;

    const dimensionner = (): void => {
      const echelle = densite();
      toile.width = innerWidth * echelle;
      toile.height = innerHeight * echelle;
      contexte.setTransform(echelle, 0, 0, echelle, 0, 0);
    };
    const image = (secondes: number): void => {
      const demandes = this.lireLesFormes(reduit, innerWidth, innerHeight);
      avancer(monde, demandes, secondes, reduit);
      const ciel = this.lireLeCiel(innerWidth, innerHeight);
      suivreLeCiel(
        monde.ciel,
        ciel,
        ciel ? sommetsDuCiel(ANNEAU[ciel.figure], ciel.boite) : [],
        secondes,
        reduit,
      );
      dessiner(contexte, monde, demandes, couleurs.jour, reduit, []);
      dessinerLesNuits(monde, demandes, couleurs.nuit, reduit);
    };
    const tourner = (instant: number): void => {
      const secondes = precedent ? Math.min((instant - precedent) / 1000, SECONDES_MAXIMALES) : 0;
      precedent = instant;
      image(secondes);
      boucle = requestAnimationFrame(tourner);
    };
    const lancer = (): void => {
      if (reduit || document.hidden || boucle) return;
      precedent = 0;
      boucle = requestAnimationFrame(tourner);
    };
    const arreter = (): void => {
      cancelAnimationFrame(boucle);
      boucle = 0;
    };
    const poser = (): void => {
      if (reduit) image(0);
    };
    const suivre = (evenement: PointerEvent): void => {
      if (reduit) return;
      monde.pointeur = suivreLePointeur(monde.pointeur, evenement);
      const onde = ondeDuPointeur(evenement);
      if (onde) monde.ondes.push(onde);
    };

    const ecoutes: [EventTarget, string, EventListener][] = [
      [
        window,
        'resize',
        () => {
          redimensionner(monde.champ, innerWidth, innerHeight, hasard);
          monde.ondes = [];
          dimensionner();
          poser();
        },
      ],
      [window, 'scroll', poser],
      [window, 'pointermove', suivre as EventListener],
      [window, 'pointerdown', suivre as EventListener],
      [window, 'pointerup', suivre as EventListener],
      [window, 'pointercancel', suivre as EventListener],
      [document.documentElement, 'pointerleave', () => (monde.pointeur = POINTEUR_INACTIF)],
      [document, 'visibilitychange', () => (document.hidden ? arreter() : lancer())],
      [
        mouvement,
        'change',
        () => {
          reduit = mouvement.matches;
          monde.pointeur = POINTEUR_INACTIF;
          monde.ondes = [];
          arreter();
          if (reduit) image(0);
          else lancer();
        },
      ],
    ];
    for (const [cible, type, ecoute] of ecoutes)
      cible.addEventListener(type, ecoute, { passive: true });
    const taille = new ResizeObserver(poser);
    taille.observe(document.documentElement);
    const navigations = this.router.events
      .pipe(filter((evenement) => evenement instanceof NavigationEnd))
      .subscribe(() => afterNextRender(poser, { injector: this.injector }));

    dimensionner();
    if (reduit) image(0);
    else lancer();

    this.destroyRef.onDestroy(() => {
      arreter();
      for (const [cible, type, ecoute] of ecoutes) cible.removeEventListener(type, ecoute);
      taille.disconnect();
      navigations.unsubscribe();
    });
  }
}
