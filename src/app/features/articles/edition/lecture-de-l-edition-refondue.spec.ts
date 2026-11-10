import {
  buildEditionRefondue,
  buildItemDeSection,
} from '../../../../testing/factories/article.factory';
import { lectureDeLEdition, sourcesParPublication } from './lecture-de-l-edition';

describe('Lecture d’une édition refondue', () => {
  it('MB-07 · MB-01 · titre l’édition par l’info à la une et retient les lignes du brief', () => {
    const lecture = lectureDeLEdition(buildEditionRefondue());

    expect(lecture.titre).toBe('Claude Code laisse fuiter des secrets');
    expect(lecture.points).toEqual(['Une IA mal briefée se trompe autant qu’un stagiaire.']);
  });

  it('MB-08 · nomme une adresse citée par le brief et par une info du nom de l’info', () => {
    const edition = buildEditionRefondue();
    const [brief, ...suite] = edition.sections;
    const sources = sourcesParPublication({
      ...edition,
      sections: [
        {
          ...brief,
          items: [
            buildItemDeSection({
              entity: '',
              text: 'Une ligne du brief.',
              url: 'https://apiiro.com/blog/fuite',
            }),
          ],
        },
        ...suite,
      ],
    });

    expect(sources.find((groupe) => groupe.nom === 'Apiiro')?.liens).toEqual([
      { url: 'https://apiiro.com/blog/fuite', libelle: 'Apiiro' },
    ]);
  });
});
