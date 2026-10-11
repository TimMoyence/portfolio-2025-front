import { createJournalSpy } from '../testing/factories/journal.factory';
import { buildSeoMetadata } from '../testing/factories/seo-metadata.factory';
import { lecteurDeMetadonneesSeo } from './metadonnees-seo';

const FR = 'browser/fr/seo-metadata.json';
const EN = 'browser/en/seo-metadata.json';
const VALIDE = JSON.stringify(buildSeoMetadata([]));

function lecteur(fichiers: Record<string, string | null>) {
  const lireFichier = jasmine
    .createSpy('lireFichier')
    .and.callFake((chemin: string) => fichiers[chemin] ?? null);
  const journal = createJournalSpy();
  const lire = lecteurDeMetadonneesSeo({ candidats: [FR, EN], lireFichier, journal });
  return { lire, lireFichier, journal };
}

describe('lecteurDeMetadonneesSeo', () => {
  it('passe au candidat suivant quand le premier est illisible, et le signale', () => {
    const { lire, journal } = lecteur({ [FR]: '{ tronqué', [EN]: VALIDE });

    expect(lire()).toEqual(buildSeoMetadata([]));
    expect(journal.warn).toHaveBeenCalledOnceWith(jasmine.stringContaining(FR));
  });

  it('écarte un JSON valide qui n est pas un objet de métadonnées', () => {
    const { lire, journal } = lecteur({ [FR]: '[]', [EN]: VALIDE });

    expect(lire()).toEqual(buildSeoMetadata([]));
    expect(journal.warn).toHaveBeenCalledOnceWith(jasmine.stringContaining(FR));
  });

  it('mémorise l absence de métadonnées sans relire les candidats', () => {
    const { lire, lireFichier } = lecteur({ [FR]: '{', [EN]: null });

    expect(lire()).toBeNull();
    expect(lire()).toBeNull();
    expect(lireFichier).toHaveBeenCalledTimes(2);
  });

  it('mémorise les métadonnées lues', () => {
    const { lire, lireFichier } = lecteur({ [FR]: VALIDE });

    lire();
    lire();

    expect(lireFichier).toHaveBeenCalledOnceWith(FR);
  });
});
