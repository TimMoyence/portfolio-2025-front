import { zPublishedArticleResponseDto } from '../../../../../contrat/zod.gen';
import {
  buildPublishedArticle,
  buildRecitDuMatin,
} from '../../../../testing/factories/article.factory';
import { blocsDuRecit, partiesDuRecit } from './recit-du-matin';

describe('Le récit du matin, bloc par bloc', () => {
  it('range chaque section sous son kind', () => {
    const blocs = blocsDuRecit(buildRecitDuMatin());
    expect(blocs.edito?.signature).toBe('Tim');
    expect(blocs.sujet?.titre).toBe('Claude vise les gros chantiers');
  });

  it('ne garde que les parties présentes, dans l ordre du mail, sans l édito', () => {
    const recit = buildRecitDuMatin();
    const sansDecodeur = buildRecitDuMatin({
      sections: recit.sections.filter((section) => section.kind !== 'decodeur'),
    });
    expect(partiesDuRecit(blocsDuRecit(sansDecodeur)).map((partie) => partie.kind)).toEqual([
      'sujet',
      'shot',
      'a_tester',
      'sorties',
      'chiffre',
      'citation',
      'a_part_ca',
    ]);
    expect(partiesDuRecit({})).toEqual([]);
  });

  for (const [cas, article] of [
    ['le récit du matin', buildRecitDuMatin()],
    ['une édition en texte suivi', buildPublishedArticle()],
  ] as const) {
    it(`les données de test de ${cas} sont celles que le contrat sert`, () => {
      expect(zPublishedArticleResponseDto.safeParse(article).success).toBeTrue();
    });
  }
});
