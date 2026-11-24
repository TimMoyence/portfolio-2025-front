import { descriptionServie, nomCourtServi } from '../../core/seo/site-servi';
import { variantesDeLargeur } from '../../shared/images/variantes-de-largeur';
import type { BesoinDeContact } from '../../shared/offre/besoins';
import type { AsiliProject } from '../../shared/sections';

export type FamilleDeRealisation = 'sites' | 'apps' | 'sur-mesure' | 'outils';

export interface Etiquette {
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
  readonly largeurDeLaCapture: number;
  readonly imageAlt: string;
  readonly depot?: string;
}

export interface Realisation extends EntreeDeRealisation {
  readonly titre: string;
  readonly description: string;
  readonly image: string;
}

type CaptureDeRealisation = Pick<Realisation, 'slug' | 'famille' | 'largeurDeLaCapture'>;

const dossierDeLaCapture = ({ slug, famille }: CaptureDeRealisation): string =>
  `/assets/images/projects/${famille}/${slug}`;

export interface FamilleDeRealisations {
  readonly id: FamilleDeRealisation;
  readonly titre: string;
  readonly precision?: string;
  readonly besoin: BesoinDeContact;
}

export const cleSeoDeLaRealisation = (slug: string): string => `projet-${slug}`;

export const cheminDeLaFiche = (slug: string): string => `projets/${slug}`;

export const ETIQUETTE_EN_LIGNE: Etiquette = {
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
  {
    id: 'outils',
    titre: $localize`:@@realisationsFamilleOutils:Outils`,
    precision: $localize`:@@realisationsFamilleOutilsPrecision:Ce que je construis pour travailler mieux`,
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
    largeurDeLaCapture: 1200,
    imageAlt: $localize`:@@realisationAsiliImageAlt:Capture du site asilidesign.fr`,
  },
  {
    slug: 'musaium',
    famille: 'apps',
    etiquettes: [
      secteur($localize`:@@realisationMusaiumSecteur:Culture & musées`),
      resultat($localize`:@@realisationMusaiumResultat:App mobile et site vitrine`),
    ],
    recit: {
      defi: $localize`:@@realisationMusaiumDefi:Devant une œuvre ou un monument, une notice figée ne répond ni à la curiosité du visiteur ni à sa langue.`,
      construit: $localize`:@@realisationMusaiumConstruit:Une app mobile qui reconnaît l'œuvre à partir d'une photo, en parle avec le visiteur, à la voix ou par écrit, dans sa langue, et garde un carnet de visite. Un site vitrine présente l'app aux visiteurs et aux musées.`,
      resultat: $localize`:@@realisationMusaiumResultatRecit:Le visiteur passe de la photo à une explication qui lui parle, et repart avec le carnet de sa visite.`,
    },
    largeurDeLaCapture: 1200,
    imageAlt: $localize`:@@realisationMusaiumImageAlt:Capture de l'app mobile Musaium : accueil, conversation sur une œuvre et carte des musées`,
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
      construit: $localize`:@@realisationChaisConstruit:Un outil web et son app mobile : on dessine ses chais et ses contenants, on compose les assemblages avec les volumes disponibles, et chaque mouvement d'eau-de-vie est tracé lot par lot, notes de dégustation comprises.`,
      resultat: $localize`:@@realisationChaisResultatRecit:La traçabilité devient un geste quotidien plutôt qu'un chantier de fin de saison.`,
    },
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
    largeurDeLaCapture: 1200,
    imageAlt: $localize`:@@realisationZenfirstImageAlt:Capture de l'aide à la décision de ZenFirst Renta`,
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
    largeurDeLaCapture: 1200,
    imageAlt: $localize`:@@realisationMorningImageAlt:Capture d'une édition de Morning-Brief`,
  },
  {
    slug: 'portail-eg',
    famille: 'sur-mesure',
    etiquettes: [
      secteur($localize`:@@realisationPortailSecteur:Expertise comptable`),
      resultat($localize`:@@realisationPortailResultat:Chaque dossier client au même endroit`),
    ],
    recit: {
      defi: $localize`:@@realisationPortailDefi:L'intranet du cabinet devait être refait pour accompagner chaque dossier client, de l'entrée en relation au diagnostic de l'entreprise.`,
      construit: $localize`:@@realisationPortailConstruit:Un portail qui reprend la fiche de chaque client, déduit sa forme juridique des données publiques quand elle est certaine et laisse la question à l'expert sinon, puis guide le diagnostic pas à pas.`,
      resultat: $localize`:@@realisationPortailResultatRecit:Les collaborateurs suivent chaque dossier au même endroit, et l'expert ne tranche que ce qui demande son jugement.`,
    },
    largeurDeLaCapture: 1200,
    imageAlt: $localize`:@@realisationPortailImageAlt:Capture du portail d'un cabinet comptable`,
  },
  {
    slug: 'schema-atlas',
    famille: 'outils',
    etiquettes: [
      secteur($localize`:@@realisationSchemaSecteur:Outil de développement`),
      resultat($localize`:@@realisationSchemaResultat:Deux niveaux de lecture`),
    ],
    recit: {
      defi: $localize`:@@realisationSchemaDefi:Un fichier de schéma décrit des tables, mais ne dit ni quelle table est au centre du modèle, ni ce que ses auteurs avaient en tête.`,
      construit: $localize`:@@realisationSchemaConstruit:Un rendu en deux profondeurs : la carte des domaines pour comprendre l'ensemble, le diagramme d'un domaine pour travailler, et les notes des auteurs affichées plutôt qu'ignorées. Le même schéma donne toujours le même rendu.`,
      resultat: $localize`:@@realisationSchemaResultatRecit:Le cœur du rendu est écrit et vérifié par ses tests ; le produit qui l'entoure est en construction.`,
    },
    largeurDeLaCapture: 1200,
    imageAlt: $localize`:@@realisationSchemaImageAlt:Capture de Schema-Atlas`,
  },
  {
    slug: 'slide-shot',
    famille: 'outils',
    etiquettes: [
      secteur($localize`:@@realisationSlideSecteur:Outil libre`),
      resultat($localize`:@@realisationSlideResultat:Tout reste sur votre machine`),
    ],
    recit: {
      defi: $localize`:@@realisationSlideDefi:Réutiliser les diapositives d'un support de cours demandait des captures d'écran, une par une.`,
      construit: $localize`:@@realisationSlideConstruit:Une petite application : on glisse le PDF, on coche les diapositives voulues, et chacune est enregistrée en image haute définition, sans que rien ne quitte la machine.`,
      resultat: $localize`:@@realisationSlideResultatRecit:Un support entier devient une série d'images prêtes à l'emploi, et le code est ouvert à tous.`,
    },
    largeurDeLaCapture: 1200,
    imageAlt: $localize`:@@realisationSlideImageAlt:Capture de Slide-Shot`,
    depot: 'https://github.com/TimMoyence/slide-shot',
  },
  {
    slug: 'outillage-claude',
    famille: 'outils',
    etiquettes: [
      secteur($localize`:@@realisationOutillageSecteur:Outil libre`),
      resultat($localize`:@@realisationOutillageResultat:Chaque livraison prouvée`),
    ],
    recit: {
      defi: $localize`:@@realisationOutillageDefi:Un assistant de code écrit vite, mais rien ne garantit que ce qu'il annonce soit vrai.`,
      construit: $localize`:@@realisationOutillageConstruit:Un ensemble de règles et de gardes : un contrat validé avant le code, un test vu en échec puis réussi, une contre-preuve sur l'ancien code, et un relecteur qui cherche le contre-exemple.`,
      resultat: $localize`:@@realisationOutillageResultatRecit:C'est la méthode qui a construit ce site : chaque livraison annoncée s'accompagne de sa preuve.`,
    },
    largeurDeLaCapture: 1200,
    imageAlt: $localize`:@@realisationOutillageImageAlt:Capture d'Outillage-Claude`,
    depot: 'https://github.com/TimMoyence/outillage-claude',
  },
  {
    slug: 'fourmizzz-suite',
    famille: 'outils',
    etiquettes: [
      secteur($localize`:@@realisationFourmizzzSecteur:Jeu en ligne`),
      resultat($localize`:@@realisationFourmizzzResultat:Calculs vérifiés sur de vrais rapports`),
    ],
    recit: {
      defi: $localize`:@@realisationFourmizzzDefi:Dans ce jeu de stratégie, chaque décision d'alliance reposait sur des calculs faits à la main, longs et source d'erreurs.`,
      construit: $localize`:@@realisationFourmizzzConstruit:Une suite d'outils qui lit les rapports de jeu, calcule chasses et attaques, et partage la coordination du terrain entre les membres de l'alliance.`,
      resultat: $localize`:@@realisationFourmizzzResultatRecit:Le moteur de calcul est vérifié au chiffre près sur de vrais rapports : l'alliance décide sur des chiffres justes.`,
    },
    largeurDeLaCapture: 1200,
    imageAlt: $localize`:@@realisationFourmizzzImageAlt:Capture de Fourmizzz-Suite`,
  },
];

export const REALISATIONS: readonly Realisation[] = ENTREES.map((entree) => ({
  ...entree,
  titre: nomCourtServi(`/${cheminDeLaFiche(entree.slug)}`),
  description: descriptionServie(`/${cheminDeLaFiche(entree.slug)}`),
  image: `${dossierDeLaCapture(entree)}/${entree.largeurDeLaCapture}.webp`,
}));

export const vignetteDeLaRealisation = (slug: string): string => `realisation-${slug}`;

export function realisationDuSlug(slug: string | undefined): Realisation | undefined {
  return REALISATIONS.find((realisation) => realisation.slug === slug);
}

export function familleDeLaRealisation({ famille }: Realisation): FamilleDeRealisations {
  return FAMILLES_DE_REALISATIONS.find(({ id }) => id === famille) ?? FAMILLES_DE_REALISATIONS[0];
}

const VITRINE_DE_L_ACCUEIL = [
  'atlanticbike',
  'maria-naumenko',
  'musaium',
  'gestion-de-chais',
  'ifs-academy',
  'zenfirst-renta',
];

export function vitrineDeLAccueil(): readonly Realisation[] {
  return VITRINE_DE_L_ACCUEIL.flatMap((slug) => realisationDuSlug(slug) ?? []);
}

export const variantesDeLaCapture = (capture: CaptureDeRealisation): string =>
  variantesDeLargeur(dossierDeLaCapture(capture), capture.largeurDeLaCapture);

export function carteDeRealisation(realisation: Realisation): AsiliProject {
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
  };
}
