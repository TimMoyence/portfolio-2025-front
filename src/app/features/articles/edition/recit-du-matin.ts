import type { PublishedArticle, SectionDuRecit } from '../../../core/models/article.model';

type Kind = SectionDuRecit['kind'];

export type BlocsDuRecit = { readonly [K in Kind]?: Extract<SectionDuRecit, { kind: K }> };

export interface PartieDuRecit {
  readonly kind: Exclude<Kind, 'edito'>;
  readonly ancre: string;
  readonly titre: string;
}

const PARTIES: readonly PartieDuRecit[] = [
  { kind: 'sujet', ancre: 'recit-sujet', titre: $localize`:@@recitSujet:Le sujet du jour` },
  { kind: 'shot', ancre: 'recit-shot', titre: $localize`:@@recitShot:Le Shot` },
  { kind: 'decodeur', ancre: 'recit-decodeur', titre: $localize`:@@recitDecodeur:Le décodeur` },
  {
    kind: 'a_tester',
    ancre: 'recit-a-tester',
    titre: $localize`:@@recitATester:À tester ce matin`,
  },
  { kind: 'sorties', ancre: 'recit-sorties', titre: $localize`:@@recitSorties:Les sorties` },
  { kind: 'chiffre', ancre: 'recit-chiffre', titre: $localize`:@@recitChiffre:Le chiffre` },
  { kind: 'citation', ancre: 'recit-citation', titre: $localize`:@@recitCitation:La citation` },
  { kind: 'a_part_ca', ancre: 'recit-a-part-ca', titre: $localize`:@@recitAPartCa:Et à part ça…` },
];

export function blocsDuRecit(article: PublishedArticle): BlocsDuRecit {
  return Object.fromEntries(article.sections.map((section) => [section.kind, section]));
}

export function partiesDuRecit(blocs: BlocsDuRecit): PartieDuRecit[] {
  return PARTIES.filter((partie) => blocs[partie.kind] !== undefined);
}
