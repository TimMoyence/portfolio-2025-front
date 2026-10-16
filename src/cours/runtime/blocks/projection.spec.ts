import { creerMetadonneesBrique } from '../../content/types';
import {
  avecJeNeSaisPas,
  ID_JE_NE_SAIS_PAS,
  projeterMetadonnees,
  projeterOptions,
} from './projection';

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

describe('L4-F15 · option je ne sais pas', () => {
  it('ajoute l option je ne sais pas après les options servies, sans toucher la source', () => {
    const servies = [{ id: 'a', libelle: 'Mille euros' }];

    expect(avecJeNeSaisPas(servies, 'Je ne sais pas')).toEqual([
      { id: 'a', libelle: 'Mille euros' },
      { id: '__je_ne_sais_pas__', libelle: 'Je ne sais pas' },
    ]);
    expect(servies.length).toBe(1);
    expect(ID_JE_NE_SAIS_PAS).toBe('__je_ne_sais_pas__');
  });
});
