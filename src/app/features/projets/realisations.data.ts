import { descriptionServie, nomCourtServi } from '../../core/seo/site-servi';
import type { BesoinDeContact } from '../../shared/offre/besoins';
import type { AsiliProject, AsiliProjectSize } from '../../shared/sections';

export type FamilleDeRealisation = 'sites' | 'apps' | 'sur-mesure';

export interface Etiquette {
  readonly id?: string;
  readonly libelle: string;
  readonly genre: 'secteur' | 'resultat';
}

export interface RecitDeRealisation {
  readonly defi: string;
  readonly construit: string;
  readonly resultat: string;
}

interface EntreeDeRealisation {
  readonly slug: string;
  readonly famille: FamilleDeRealisation;
  readonly etiquettes: readonly Etiquette[];
  readonly recit: RecitDeRealisation;
  readonly taille: AsiliProjectSize;
  readonly image: string;
  readonly largeurDeLaCapture: number;
  readonly imageAlt: string;
}

export interface Realisation extends EntreeDeRealisation {
  readonly titre: string;
  readonly description: string;
}

export interface FamilleDeRealisations {
  readonly id: FamilleDeRealisation;
  readonly titre: string;
  readonly precision?: string;
  readonly besoin: BesoinDeContact;
}

export const cleSeoDeLaRealisation = (slug: string): string => `projet-${slug}`;

export const cheminDeLaFiche = (slug: string): string => `projets/${slug}`;

export const ETIQUETTE_EN_LIGNE: Etiquette = {
  id: 'en-ligne',
  libelle: $localize`:Étiquette d'un site en ligne@@realisationEnLigne:En ligne`,
  genre: 'resultat',
};

const ETIQUETTE_EN_PRODUCTION: Etiquette = {
  libelle: $localize`:Étiquette d'un outil en service@@realisationEnProduction:En production`,
  genre: 'resultat',
};

const secteur = (libelle: string): Etiquette => ({ libelle, genre: 'secteur' });
const resultat = (libelle: string): Etiquette => ({ libelle, genre: 'resultat' });

export const FAMILLES_DE_REALISATIONS: readonly FamilleDeRealisations[] = [
  {
    id: 'sites',
    titre: $localize`:@@realisationsFamilleSites:Sites web`,
    besoin: 'creer',
  },
  {
    id: 'apps',
    titre: $localize`:@@realisationsFamilleApps:Apps mobiles`,
    besoin: 'app-mobile',
  },
  {
    id: 'sur-mesure',
    titre: $localize`:@@realisationsFamilleSurMesure:Sur-mesure`,
    precision: $localize`:@@realisationsFamilleSurMesurePrecision:Quand un site ne suffit plus`,
    besoin: 'sur-mesure',
  },
];

const ENTREES: readonly EntreeDeRealisation[] = [
  {
    slug: 'atlanticbike',
    famille: 'sites',
    etiquettes: [
      secteur($localize`:@@realisationAtlanticbikeSecteur:Location de vélos`),
      resultat($localize`:@@realisationAtlanticbikeResultat:Mise en ligne en cours`),
    ],
    recit: {
      defi: $localize`:@@realisationAtlanticbikeDefi:Les familles cherchaient un vélo pour leurs vacances, mais l'offre et les disponibilités se demandaient encore par téléphone.`,
      construit: $localize`:@@realisationAtlanticbikeConstruit:Un site clair, une demande de réservation guidée pas à pas dont le devis se calcule côté serveur, et un espace de gestion pour le parc et l'atelier. Les anciennes adresses sont redirigées pour garder les pages déjà trouvées sur Google.`,
      resultat: $localize`:@@realisationAtlanticbikeResultatRecit:La réservation passe en ligne sans perdre le référencement acquis. La nouvelle version est en cours de mise en ligne.`,
    },
    taille: 'small',
    image: '/assets/images/projects/Atlanticbike.webp',
    largeurDeLaCapture: 626,
    imageAlt: $localize`:@@realisationAtlanticbikeImageAlt:Capture du site AtlanticBike`,
  },
  {
    slug: 'maria-naumenko',
    famille: 'sites',
    etiquettes: [
      secteur($localize`:@@realisationMariaSecteur:Formation & coaching`),
      ETIQUETTE_EN_LIGNE,
      resultat($localize`:@@realisationMariaResultat:Site multilingue`),
    ],
    recit: {
      defi: $localize`:@@realisationMariaDefi:Maria exerce deux métiers, la conception de formations et le coaching, et craignait qu'un seul site les mélange au point de ne plus rien dire.`,
      construit: $localize`:@@realisationMariaConstruit:Un site en français, en anglais et en russe qui assume les deux métiers dès l'accueil, un parcours pour chacun, une auto-évaluation courte et la prise de rendez-vous pour une séance découverte.`,
      resultat: $localize`:@@realisationMariaResultatRecit:Le site est en ligne : chaque visiteur voit d'un coup d'œil le métier qui le concerne et la prochaine étape.`,
    },
    taille: 'small',
    image: '/assets/images/projects/maria-naumenko.webp',
    largeurDeLaCapture: 1200,
    imageAlt: $localize`:@@realisationMariaImageAlt:Capture du site de Maria Naumenko`,
  },
  {
    slug: 'asilidesign',
    famille: 'sites',
    etiquettes: [
      secteur($localize`:@@realisationAsiliSecteur:Studio web`),
      ETIQUETTE_EN_LIGNE,
      resultat($localize`:@@realisationAsiliResultat:Site bilingue`),
    ],
    recit: {
      defi: $localize`:@@realisationAsiliDefi:Mon site parlait de technologies plutôt que de ce qu'un artisan ou un commerçant gagne à être trouvé.`,
      construit: $localize`:@@realisationAsiliConstruit:Un récit centré sur une promesse claire, des réalisations rangées par famille, des formations séparées des cours, et des pages prérendues en français et en anglais pour s'afficher vite.`,
      resultat: $localize`:@@realisationAsiliResultatRecit:Le site est en ligne et sert de démonstration : ce que je promets, il le fait.`,
    },
    taille: 'small',
    image: '/assets/images/projects/asilidesign.webp',
    largeurDeLaCapture: 1200,
    imageAlt: $localize`:@@realisationAsiliImageAlt:Capture du site asilidesign.fr`,
  },
  {
    slug: 'innovmind',
    famille: 'apps',
    etiquettes: [
      secteur($localize`:@@realisationInnovmindSecteur:Culture & musées`),
      resultat($localize`:@@realisationInnovmindResultat:Reconnaissance d'œuvres par photo`),
    ],
    recit: {
      defi: $localize`:@@realisationInnovmindDefi:Devant une œuvre, une notice figée ne répond ni à la curiosité du visiteur ni à sa langue.`,
      construit: $localize`:@@realisationInnovmindConstruit:Une app mobile qui reconnaît l'œuvre à partir d'une photo, puis ouvre une conversation à son sujet dans la langue du visiteur. Co-conception du produit et développement de l'app.`,
      resultat: $localize`:@@realisationInnovmindResultatRecit:Le visiteur passe de la photo à une explication qui lui parle, en quelques secondes.`,
    },
    taille: 'big',
    image: '/assets/images/projects/Assistant-mediation-culturelle.webp',
    largeurDeLaCapture: 627,
    imageAlt: $localize`:@@realisationInnovmindImageAlt:Illustration de l'app InnovMind`,
  },
  {
    slug: 'gestion-de-chais',
    famille: 'sur-mesure',
    etiquettes: [
      secteur($localize`:@@realisationChaisSecteur:Viticulture`),
      ETIQUETTE_EN_PRODUCTION,
      resultat($localize`:@@realisationChaisResultat:Traçabilité de la vigne à la bouteille`),
    ],
    recit: {
      defi: $localize`:@@realisationChaisDefi:Les informations de production étaient dispersées entre carnets et tableurs : retracer un lot demandait des heures.`,
      construit: $localize`:@@realisationChaisConstruit:Un outil qui centralise chaque étape, de la vigne au chai puis à la bouteille, avec l'historique de chaque lot.`,
      resultat: $localize`:@@realisationChaisResultatRecit:La traçabilité devient un geste quotidien plutôt qu'un chantier de fin de saison.`,
    },
    taille: 'big',
    image: '/assets/images/projects/GDC-presentation.webp',
    largeurDeLaCapture: 627,
    imageAlt: $localize`:@@realisationChaisImageAlt:Capture de l'outil de gestion de chais`,
  },
  {
    slug: 'ifs-academy',
    famille: 'sur-mesure',
    etiquettes: [
      secteur($localize`:@@realisationIfsSecteur:Formation en ligne`),
      ETIQUETTE_EN_PRODUCTION,
      resultat($localize`:@@realisationIfsResultat:Accueil des élèves automatisé`),
    ],
    recit: {
      defi: $localize`:@@realisationIfsDefi:Vérifier les accès de chaque élève et relancer les retardataires prenait du temps et laissait passer des oublis.`,
      construit: $localize`:@@realisationIfsConstruit:Un parcours d'arrivée en plusieurs étapes, des liens d'invitation signés, des relances automatiques et un récapitulatif quotidien par e-mail.`,
      resultat: $localize`:@@realisationIfsResultatRecit:Les élèves arrivent, sont vérifiés et relancés sans que personne n'y passe ses journées.`,
    },
    taille: 'small',
    image: '/assets/images/projects/IFS-Academy.webp',
    largeurDeLaCapture: 627,
    imageAlt: $localize`:@@realisationIfsImageAlt:Capture du parcours d'arrivée d'IFS Academy`,
  },
  {
    slug: 'zenfirst-renta',
    famille: 'sur-mesure',
    etiquettes: [
      secteur($localize`:@@realisationZenfirstSecteur:Expertise comptable`),
      resultat($localize`:@@realisationZenfirstResultat:Calcul de rentabilité vérifiable`),
    ],
    recit: {
      defi: $localize`:@@realisationZenfirstDefi:Une analyse de rentabilité mêle charges, financements et hypothèses : un tableur ne permettait plus d'en garder la cohérence.`,
      construit: $localize`:@@realisationZenfirstConstruit:Un outil web sécurisé qui structure les hypothèses, calcule la rentabilité et garde la trace de chaque choix.`,
      resultat: $localize`:@@realisationZenfirstResultatRecit:Le cabinet explique chaque résultat à son client, et le calcul peut évoluer sans tout reprendre.`,
    },
    taille: 'big',
    image: '/assets/images/projects/voice-ia.webp',
    largeurDeLaCapture: 800,
    imageAlt: $localize`:@@realisationZenfirstImageAlt:Illustration de ZenFirst Renta`,
  },
  {
    slug: 'morning-brief',
    famille: 'sur-mesure',
    etiquettes: [
      secteur($localize`:@@realisationMorningSecteur:Veille & médias`),
      ETIQUETTE_EN_PRODUCTION,
      resultat($localize`:@@realisationMorningResultat:Édition livrée chaque matin`),
    ],
    recit: {
      defi: $localize`:@@realisationMorningDefi:Suivre son secteur demandait de lire chaque jour des dizaines de sources qui se répétaient.`,
      construit: $localize`:@@realisationMorningConstruit:Une chaîne qui collecte, dédoublonne, résume et livre une édition sourcée chaque matin, sans surveillance.`,
      resultat: $localize`:@@realisationMorningResultatRecit:La veille arrive prête à lire, sans tri à la main.`,
    },
    taille: 'small',
    image: '/assets/images/projects/morning-brief.webp',
    largeurDeLaCapture: 800,
    imageAlt: $localize`:@@realisationMorningImageAlt:Illustration de Morning-Brief`,
  },
];

export const REALISATIONS: readonly Realisation[] = ENTREES.map((entree) => ({
  ...entree,
  titre: nomCourtServi(`/${cheminDeLaFiche(entree.slug)}`),
  description: descriptionServie(`/${cheminDeLaFiche(entree.slug)}`),
}));

export const vignetteDeLaRealisation = (slug: string): string => `realisation-${slug}`;

export function realisationDuSlug(slug: string | undefined): Realisation | undefined {
  return REALISATIONS.find((realisation) => realisation.slug === slug);
}

export function familleDeLaRealisation({ famille }: Realisation): FamilleDeRealisations {
  return FAMILLES_DE_REALISATIONS.find(({ id }) => id === famille) ?? FAMILLES_DE_REALISATIONS[0];
}

export function vitrineDeLAccueil(): readonly Realisation[] {
  return FAMILLES_DE_REALISATIONS.flatMap(
    ({ id }) => REALISATIONS.find(({ famille }) => famille === id) ?? [],
  );
}

const LARGEURS_DES_VIGNETTES = [360, 400, 480, 560, 640, 800, 1000, 1200];

export const variantesDeLaCapture = ({
  slug,
  largeurDeLaCapture,
}: Pick<Realisation, 'slug' | 'largeurDeLaCapture'>): string =>
  [...LARGEURS_DES_VIGNETTES.filter((largeur) => largeur < largeurDeLaCapture), largeurDeLaCapture]
    .map((largeur) => `/assets/images/projects/vignettes/${slug}/${largeur}.webp ${largeur}w`)
    .join(', ');

export function carteDeRealisation(
  realisation: Realisation,
  taille: AsiliProjectSize = realisation.taille,
): AsiliProject {
  return {
    title: realisation.titre,
    desc: realisation.description,
    tags: realisation.etiquettes.map(({ libelle, genre }) => ({
      label: libelle,
      prod: genre === 'resultat',
    })),
    image: realisation.image,
    srcset: variantesDeLaCapture(realisation),
    imageAlt: realisation.imageAlt,
    href: `/${cheminDeLaFiche(realisation.slug)}`,
    vignette: vignetteDeLaRealisation(realisation.slug),
    size: taille,
  };
}
