import { CHEMINS_DE_LA_NAVIGATION, nomCourtServi } from '../seo/site-servi';
import { cheminDuCoursEnSeance, COURS_EN_SEANCE } from './cours-en-seance';

export type FamilleDeFormation = 'digitale' | 'cours';

export const LIENS_DE_LA_FAMILLE: Readonly<Record<FamilleDeFormation, readonly string[]>> = {
  digitale: [
    '/formations/ia-solopreneurs',
    '/formations/automatiser-avec-ia',
    '/formations/audit-seo-diy',
    '/formations/ia-solopreneurs/toolkit',
  ],
  cours: COURS_EN_SEANCE.map((slug) => `/${cheminDuCoursEnSeance(slug)}`),
};

export function formationsComptees(nombre: number): string {
  return nombre === 1
    ? $localize`:Une seule formation@@formationsCompteesUne:1 formation`
    : $localize`:Plusieurs formations@@formationsCompteesPlusieurs:${nombre}:nombre: formations`;
}

function coursComptes(nombre: number): string {
  return $localize`:Nombre de cours, invariable@@coursComptes:${nombre}:nombre: cours`;
}

export interface EntreeDeFormation {
  readonly titre: string;
  readonly detail: string;
  readonly lien: string;
}

const DETAIL_DE_LA_FAMILLE: Readonly<Record<FamilleDeFormation, string>> = {
  digitale: $localize`:Détail de la formation digitale@@navFormationDigitaleDetail:IA & web pour les pros · ${formationsComptees(LIENS_DE_LA_FAMILLE.digitale.length)}:formations:`,
  cours: $localize`:Détail de la formation cours@@navFormationCoursDetail:BTS CG & Bachelor, en séance · ${coursComptes(LIENS_DE_LA_FAMILLE.cours.length)}:cours:`,
};

const PREFIXE_DES_FORMATIONS = '/formations/';

const estUneFamille = (valeur: string): valeur is FamilleDeFormation =>
  Object.hasOwn(DETAIL_DE_LA_FAMILLE, valeur);

export const ENTREES_DE_FORMATION: readonly EntreeDeFormation[] = CHEMINS_DE_LA_NAVIGATION.flatMap(
  (lien) => {
    const famille = lien.slice(PREFIXE_DES_FORMATIONS.length);
    return lien.startsWith(PREFIXE_DES_FORMATIONS) && estUneFamille(famille)
      ? [{ titre: nomCourtServi(lien), detail: DETAIL_DE_LA_FAMILLE[famille], lien }]
      : [];
  },
);
