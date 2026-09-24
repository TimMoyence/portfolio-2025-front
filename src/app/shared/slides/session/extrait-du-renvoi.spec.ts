import type { EcranContent } from '../../../../cours/content/types';
import { ecransPublicsB2_01 } from '../../../../testing/fixtures/instantane-b2-01';
import { extraireDuRenvoi } from './extrait-du-renvoi';

const ECRANS = ecransPublicsB2_01();

function ecran(id: string): EcranContent {
  const trouve = ECRANS.find((candidat) => candidat.id === id);
  if (trouve === undefined) {
    throw new Error(`écran absent de l instantané : ${id}`);
  }
  return trouve;
}

function renvoiDe(id: string): EcranContent {
  const renvoyant = ecran(id);
  return extraireDuRenvoi(ecran(renvoyant.renvoi ?? ''), renvoyant.cadrageDuRenvoi);
}

function proprietesDuTableau(extrait: EcranContent): Record<string, unknown> {
  const recit = extrait.donnees?.['recit'] as { presentation: { props: Record<string, unknown> } };
  return recit.presentation.props;
}

describe('extraireDuRenvoi', () => {
  it('R7 · ne garde du tableau de bord, à l écran des points, que la ligne du taux de marge', () => {
    const props = proprietesDuTableau(renvoiDe('B2-01-A2-06-POINTS'));

    expect(props['rows']).toEqual([jasmine.objectContaining({ indicateur: 'Taux de marge' })]);
    expect(props['columns']).toEqual(
      proprietesDuTableau(ecran('B2-01-A1-04-TABLEAU-DE-BORD'))['columns'],
    );
    expect(Object.keys(props)).not.toContain('title');
    expect(Object.keys(props)).not.toContain('subtitle');
    expect(Object.keys(props)).not.toContain('note');
  });

  it('R3 · ne garde du tableau de bord, à l écran du tri, que ses six lignes', () => {
    const rows = proprietesDuTableau(renvoiDe('B2-01-A1-05-ANATOMIE'))['rows'] as unknown[];

    expect(rows).toEqual(
      (proprietesDuTableau(ecran('B2-01-A1-04-TABLEAU-DE-BORD'))['rows'] as unknown[]).slice(0, 6),
    );
  });

  it('R3 · ne garde de la mission, à l écran de la question de gestion, que la situation', () => {
    const cas = renvoiDe('B2-01-A1-08-QUESTION-DE-GESTION').donnees?.['cas'] as Record<
      string,
      unknown
    >;
    const mission = ecran('B2-01-A1-03-MISSION').donnees?.['cas'] as Record<string, unknown>;

    expect(cas).toEqual(
      jasmine.objectContaining({
        id: mission['id'],
        metier: '',
        situation: mission['situation'],
        geste: '',
        consequence: null,
      }),
    );
    expect(Object.keys(cas)).not.toContain('questionsLibres');
  });

  it('rend tel quel un écran renvoyé sans extrait', () => {
    const cible = ecran('B2-01-A1-09-DIAPOSITIVE');

    expect(extraireDuRenvoi(cible, { part: 60 })).toBe(cible);
    expect(extraireDuRenvoi(cible, undefined)).toBe(cible);
  });

  it('ne modifie pas l écran renvoyé qu il découpe', () => {
    const tableau = ecran('B2-01-A1-04-TABLEAU-DE-BORD');
    const avant = JSON.stringify(tableau);

    extraireDuRenvoi(tableau, { part: 30, extrait: { lignes: [3] } });

    expect(JSON.stringify(tableau)).toBe(avant);
  });
});
