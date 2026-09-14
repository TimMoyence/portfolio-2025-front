import { creerMetadonneesBrique } from '../../content/types';
import { projeterMetadonnees, projeterOptions } from './projection';

const METADONNEES = creerMetadonneesBrique({
  concepts: ['capitalisation'],
  misconceptionsCiblees: ['interet-simple', 'oubli-de-la-duree'],
  dureeMinutes: 4,
  modalite: 'solo',
  regime: 'focus',
});

describe('projection vers le poste etudiant', () => {
  it('ne transmet aucune misconception ciblee', () => {
    const projetees = projeterMetadonnees(METADONNEES);

    expect(projetees.misconceptionsCiblees).toEqual([]);
    expect(JSON.stringify(projetees)).not.toContain('interet-simple');
    expect(JSON.stringify(projetees)).not.toContain('oubli-de-la-duree');
  });

  it('conserve ce dont la brique a besoin pour se rendre', () => {
    const projetees = projeterMetadonnees(METADONNEES);

    expect(projetees.concepts).toEqual(['capitalisation']);
    expect(projetees.dureeMinutes).toBe(4);
    expect(projetees.modalite).toBe('solo');
    expect(projetees.regime).toBe('focus');
  });

  it('ne partage aucun tableau avec la source', () => {
    const projetees = projeterMetadonnees(METADONNEES);

    expect(projetees.concepts).not.toBe(METADONNEES.concepts);
    expect(projetees.misconceptionsCiblees).not.toBe(METADONNEES.misconceptionsCiblees);
  });

  it('ne laisse passer aucune cle etrangere dans une option', () => {
    const options = projeterOptions([
      { id: 'a', libelle: 'Mille euros', misconception: 'interet-simple' } as never,
    ]);

    expect(Object.keys(options[0])).toEqual(['id', 'libelle']);
    expect(JSON.stringify(options)).not.toContain('interet-simple');
  });
});
