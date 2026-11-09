import type {
  ItemDeSection,
  PublishedArticle,
  SectionDeLArticle,
} from '../../../core/models/article.model';
import { nomDeRubrique } from './noms-des-rubriques';

export interface PartDeRubrique {
  readonly id: string;
  readonly titre: string;
  readonly nombre: number;
}

export interface PartDePublication {
  readonly nom: string;
  readonly nombre: number;
}

export interface AnatomieDeLEdition {
  readonly informations: number;
  readonly publications: number;
  readonly minutes: number | null;
  readonly partDes24Heures: number | null;
  readonly rubriques: readonly PartDeRubrique[];
  readonly publicationsEnTete: readonly PartDePublication[];
  readonly autresPublications: {
    readonly publications: number;
    readonly informations: number;
  } | null;
}

export const PREFIXE_DU_RADAR = 'radar-';
export const PREFIXE_DU_TITRE_DU_RADAR = 'Radar — ';
const PUBLICATIONS_EN_TETE = 6;
const VINGT_QUATRE_HEURES = 24 * 60 * 60 * 1000;

export const AUTRES_SIGNAUX = $localize`:@@articlesAutresSignaux:Autres signaux`;

export function anatomieDeLEdition(article: PublishedArticle): AnatomieDeLEdition {
  const items = article.sections
    .filter((section) => section.kind !== 'brief')
    .flatMap((section) => section.items);
  const parPublication = publicationsParNombre(items);
  const enTete =
    parPublication.length > PUBLICATIONS_EN_TETE + 1 ? PUBLICATIONS_EN_TETE : parPublication.length;
  const autres = parPublication.slice(enTete);
  return {
    informations: items.length,
    publications: new Set(article.sources.map((source) => source.name)).size,
    minutes: article.reading_time_minutes,
    partDes24Heures: partDes24Heures(items, article.published_at),
    rubriques: partsDesRubriques(article),
    publicationsEnTete: parPublication.slice(0, enTete),
    autresPublications: autres.length
      ? {
          publications: autres.length,
          informations: autres.reduce((total, part) => total + part.nombre, 0),
        }
      : null,
  };
}

function partsDUneSection(section: SectionDeLArticle): PartDeRubrique[] {
  if (section.kind === 'rubric') {
    return [{ id: section.id, titre: section.title, nombre: section.items.length }];
  }
  if (section.kind === 'infos') {
    return section.items.flatMap((info) => {
      const titre = nomDeRubrique(info.rubric ?? '');
      return info.rubric && titre ? [{ id: info.rubric, titre, nombre: 1 }] : [];
    });
  }
  if (section.kind === 'radar' && section.id.startsWith(PREFIXE_DU_RADAR)) {
    const titre = section.title.startsWith(PREFIXE_DU_TITRE_DU_RADAR)
      ? section.title.slice(PREFIXE_DU_TITRE_DU_RADAR.length)
      : section.title;
    return [{ id: section.id.slice(PREFIXE_DU_RADAR.length), titre, nombre: section.items.length }];
  }
  return [];
}

function autresSignauxDe(section: SectionDeLArticle): number {
  if (section.kind === 'radar') {
    return section.id.startsWith(PREFIXE_DU_RADAR) ? 0 : section.items.length;
  }
  if (section.kind === 'infos') {
    return section.items.filter((info) => nomDeRubrique(info.rubric ?? '') === null).length;
  }
  return 0;
}

function partsDesRubriques(article: PublishedArticle): PartDeRubrique[] {
  const parts = new Map<string, { titre: string; nombre: number }>();
  for (const part of article.sections.flatMap(partsDUneSection)) {
    ajouter(parts, part.id, part.titre, part.nombre);
  }
  const autresSignaux = article.sections.reduce(
    (total, section) => total + autresSignauxDe(section),
    0,
  );
  const rubriques = [...parts]
    .filter(([, part]) => part.nombre > 0)
    .map(([id, part]) => ({ id, titre: part.titre, nombre: part.nombre }));
  return autresSignaux
    ? [...rubriques, { id: '', titre: AUTRES_SIGNAUX, nombre: autresSignaux }]
    : rubriques;
}

function ajouter(
  parts: Map<string, { titre: string; nombre: number }>,
  id: string,
  titre: string,
  nombre: number,
): void {
  const part = parts.get(id);
  if (part) {
    part.nombre += nombre;
  } else {
    parts.set(id, { titre, nombre });
  }
}

function publicationsParNombre(items: readonly ItemDeSection[]): PartDePublication[] {
  const nombres = new Map<string, number>();
  for (const item of items) {
    nombres.set(item.source, (nombres.get(item.source) ?? 0) + 1);
  }
  return [...nombres]
    .map(([nom, nombre]) => ({ nom, nombre }))
    .sort((a, b) => b.nombre - a.nombre || a.nom.localeCompare(b.nom, 'fr'));
}

function partDes24Heures(items: readonly ItemDeSection[], edition: string): number | null {
  const publication = Date.parse(edition);
  const depuis = publication - VINGT_QUATRE_HEURES;
  const dates = items.flatMap((item) => (item.published_at ? [Date.parse(item.published_at)] : []));
  if (dates.length === 0) return null;
  return dates.filter((date) => date >= depuis && date <= publication).length / dates.length;
}
